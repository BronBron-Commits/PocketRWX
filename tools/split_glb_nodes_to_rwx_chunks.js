import fs from "fs";
import path from "path";
import * as THREE from "three";

const input = process.argv[2];
const outDir = process.argv[3] || "samples/real_glb/everything_chunks";
const maxTrianglesPerChunk = Number(process.argv[4] || 50000);

if (!input) {
  console.error("usage: node tools/split_glb_nodes_to_rwx_chunks.js <input.glb> [outdir] [maxTrianglesPerChunk]");
  process.exit(1);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const buf = fs.readFileSync(input);

let offset = 12;
let json = null;
let bin = null;

while (offset < buf.length) {
  const len = buf.readUInt32LE(offset);
  const type = buf.toString("utf8", offset + 4, offset + 8);
  const start = offset + 8;

  if (type === "JSON") json = JSON.parse(buf.toString("utf8", start, start + len));
  if (type === "BIN\0") bin = buf.subarray(start, start + len);

  offset = start + len;
}

const texDir = input.replace(/\.(glb|gltf)$/i, "_textures");

function safeName(s) {
  return String(s || "part").replace(/[^a-z0-9._-]+/gi, "_");
}

function imageFile(imageIndex) {
  const image = json.images?.[imageIndex];
  if (!image) return null;

  const ext =
    image.mimeType === "image/png" ? "png" :
    image.mimeType === "image/webp" ? "webp" :
    "jpg";

  return path.join(texDir, `${imageIndex}_${safeName(image.name)}.${ext}`);
}

function baseTextureInfo(materialIndex) {
  const mat = json.materials?.[materialIndex];
  const base = mat?.pbrMetallicRoughness?.baseColorTexture;
  const texIndex = base?.index;

  const imageIndex =
    json.textures?.[texIndex]?.source ??
    json.textures?.[texIndex]?.extensions?.EXT_texture_webp?.source;

  return {
    texture: imageFile(imageIndex),
    texCoord: base?.texCoord ?? 0,
    transform: base?.extensions?.KHR_texture_transform || null
  };
}

function textureForMaterial(materialIndex) {
  return baseTextureInfo(materialIndex).texture;
}

function colorForMaterial(materialIndex) {
  const mat = json.materials?.[materialIndex];

  const c =
    mat?.pbrMetallicRoughness?.baseColorFactor ||
    mat?.extensions?.KHR_materials_pbrSpecularGlossiness?.diffuseFactor ||
    mat?.extras?.baseColorFactor ||
    mat?.extras?.diffuse ||
    mat?.extras?.color ||
    [0.8, 0.8, 0.8, 1];

  return [c[0], c[1], c[2]];
}

const componentSizes = { 5120:1, 5121:1, 5122:2, 5123:2, 5125:4, 5126:4 };
const typeCounts = { SCALAR:1, VEC2:2, VEC3:3, VEC4:4, MAT4:16 };

function readComponent(view, byteOffset, componentType) {
  if (componentType === 5120) return view.readInt8(byteOffset);
  if (componentType === 5121) return view.readUInt8(byteOffset);
  if (componentType === 5122) return view.readInt16LE(byteOffset);
  if (componentType === 5123) return view.readUInt16LE(byteOffset);
  if (componentType === 5125) return view.readUInt32LE(byteOffset);
  if (componentType === 5126) return view.readFloatLE(byteOffset);
  throw new Error("unsupported componentType " + componentType);
}

function accessorReader(accessorIndex) {
  const accessor = json.accessors[accessorIndex];
  const bufferView = json.bufferViews[accessor.bufferView];

  const componentSize = componentSizes[accessor.componentType];
  const itemSize = typeCounts[accessor.type];
  const stride = bufferView.byteStride || componentSize * itemSize;

  const start = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);

  return {
    count: accessor.count,
    get(i) {
      const item = [];
      for (let j = 0; j < itemSize; j++) {
        item.push(readComponent(bin, start + i * stride + j * componentSize, accessor.componentType));
      }
      return item;
    }
  };
}

function localMatrix(node) {
  if (node.matrix) {
    return new THREE.Matrix4().fromArray(node.matrix);
  }

  const t = new THREE.Vector3(...(node.translation || [0, 0, 0]));
  const r = new THREE.Quaternion(...(node.rotation || [0, 0, 0, 1]));
  const s = new THREE.Vector3(...(node.scale || [1, 1, 1]));

  return new THREE.Matrix4().compose(t, r, s);
}

const nodeWorld = new Map();

function walkNode(nodeIndex, parentMatrix) {
  const node = json.nodes[nodeIndex];
  const world = parentMatrix.clone().multiply(localMatrix(node));
  nodeWorld.set(nodeIndex, world);

  for (const child of node.children || []) {
    walkNode(child, world);
  }
}

const scene = json.scenes?.[json.scene || 0];

for (const nodeIndex of scene.nodes || []) {
  walkNode(nodeIndex, new THREE.Matrix4());
}

const manifest = [];
let fileIndex = 0;

function writeChunk({
  meshIndex,
  meshName,
  nodeIndex,
  nodeName,
  primitiveIndex,
  materialIndex,
  materialName,
  texture,
  color,
  positions,
  uvs,
  indices,
  matrix,
  chunkStart,
  chunkEnd
}) {
  const filename =
    `${String(fileIndex).padStart(5, "0")}_node_${nodeIndex}_${safeName(nodeName)}_mesh_${meshIndex}_${safeName(meshName)}_prim_${primitiveIndex}.rwx`;

  const outPath = path.join(outDir, filename);
  const ws = fs.createWriteStream(outPath);

  ws.write("ModelBegin\n");
  ws.write("ClumpBegin\n");

  if (texture) ws.write(`Texture ${texture}\n`);
  ws.write(`Color ${color[0]} ${color[1]} ${color[2]}\n`);

  const used = new Map();
  let localVertexCount = 0;
  let triCount = 0;
  const triangleLines = [];

  function addVertex(sourceIndex) {
    if (used.has(sourceIndex)) return used.get(sourceIndex);

    const p = positions.get(sourceIndex);
    const v = new THREE.Vector3(p[0], p[1], p[2]).applyMatrix4(matrix);
    const uv = uvs ? uvs.get(sourceIndex) : null;

    localVertexCount++;
    used.set(sourceIndex, localVertexCount);

    if (uv) {
      ws.write(`Vertex ${v.x} ${v.y} ${v.z} UV ${uv[0]} ${uv[1]}\n`);
    } else {
      ws.write(`Vertex ${v.x} ${v.y} ${v.z}\n`);
    }

    return localVertexCount;
  }

  for (let i = chunkStart; i < chunkEnd; i += 3) {
    const aSrc = indices ? indices.get(i)[0] : i;
    const bSrc = indices ? indices.get(i + 1)[0] : i + 1;
    const cSrc = indices ? indices.get(i + 2)[0] : i + 2;

    const a = addVertex(aSrc);
    const b = addVertex(bSrc);
    const c = addVertex(cSrc);

    triangleLines.push(`Triangle ${a} ${b} ${c}\n`);
    triCount++;
  }

  for (const line of triangleLines) {
    ws.write(line);
  }

  ws.write("ClumpEnd\n");
  ws.write("ModelEnd\n");
  ws.end();

  manifest.push({
    file: filename,
    nodeIndex,
    nodeName,
    meshIndex,
    meshName,
    primitiveIndex,
    materialIndex,
    materialName,
    texture,
    vertices: localVertexCount,
    triangles: triCount
  });

  console.log(filename, "verts", localVertexCount, "tris", triCount, texture || "no-texture");

  fileIndex++;
}

for (const [nodeIndex, matrix] of nodeWorld.entries()) {
  const node = json.nodes[nodeIndex];
  if (node.mesh === undefined) continue;

  const meshIndex = node.mesh;
  const mesh = json.meshes[meshIndex];

  for (let primitiveIndex = 0; primitiveIndex < mesh.primitives.length; primitiveIndex++) {
    const prim = mesh.primitives[primitiveIndex];
    if ((prim.mode ?? 4) !== 4) continue;

    const positions = accessorReader(prim.attributes.POSITION);
    const texInfo = baseTextureInfo(prim.material);
    const uvAttr = "TEXCOORD_" + texInfo.texCoord;

    const uvs =
      prim.attributes[uvAttr] !== undefined
        ? accessorReader(prim.attributes[uvAttr])
        : prim.attributes.TEXCOORD_0 !== undefined
          ? accessorReader(prim.attributes.TEXCOORD_0)
          : null;

    const indices =
      prim.indices !== undefined
        ? accessorReader(prim.indices)
        : null;

    const indexCount = indices ? indices.count : positions.count;

    const texture = texInfo.texture;
    const color = colorForMaterial(prim.material);
    const materialName = json.materials?.[prim.material]?.name || "";

    const maxIndexCount = maxTrianglesPerChunk * 3;

    for (let chunkStart = 0; chunkStart < indexCount; chunkStart += maxIndexCount) {
      const chunkEnd = Math.min(indexCount, chunkStart + maxIndexCount);

      writeChunk({
        meshIndex,
        meshName: mesh.name || "",
        nodeIndex,
        nodeName: node.name || "",
        primitiveIndex,
        materialIndex: prim.material ?? null,
        materialName,
        texture,
        color,
        positions,
        uvs,
        indices,
        matrix,
        chunkStart,
        chunkEnd
      });
    }
  }
}

fs.writeFileSync(
  path.join(outDir, "manifest.json"),
  JSON.stringify({ source: input, maxTrianglesPerChunk, parts: manifest }, null, 2)
);

console.log("chunks:", manifest.length);
console.log("manifest:", path.join(outDir, "manifest.json"));
