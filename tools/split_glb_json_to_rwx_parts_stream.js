import fs from "fs";
import path from "path";

const input = process.argv[2];
const outDir = process.argv[3] || "samples/real_glb/everything_parts";

if (!input) {
  console.error("usage: node tools/split_glb_json_to_rwx_parts_stream.js <input.glb> [outdir]");
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

function textureForMaterial(materialIndex) {
  const mat = json.materials?.[materialIndex];
  const texIndex = mat?.pbrMetallicRoughness?.baseColorTexture?.index;

  const imageIndex =
    json.textures?.[texIndex]?.source ??
    json.textures?.[texIndex]?.extensions?.EXT_texture_webp?.source;

  return imageFile(imageIndex);
}

function colorForMaterial(materialIndex) {
  const mat = json.materials?.[materialIndex];
  const c = mat?.pbrMetallicRoughness?.baseColorFactor || [0.8, 0.8, 0.8, 1];
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

const manifest = [];
let partIndex = 0;

for (let mi = 0; mi < (json.meshes || []).length; mi++) {
  const mesh = json.meshes[mi];

  for (let pi = 0; pi < (mesh.primitives || []).length; pi++) {
    const prim = mesh.primitives[pi];
    if ((prim.mode ?? 4) !== 4) continue;

    const positionReader = accessorReader(prim.attributes.POSITION);

    const uvReader =
      prim.attributes.TEXCOORD_0 !== undefined
        ? accessorReader(prim.attributes.TEXCOORD_0)
        : null;

    const indexReader =
      prim.indices !== undefined
        ? accessorReader(prim.indices)
        : null;

    const texture = textureForMaterial(prim.material);
    const color = colorForMaterial(prim.material);
    const mat = json.materials?.[prim.material];

    const filename =
      `${String(partIndex).padStart(4, "0")}_mesh_${mi}_${safeName(mesh.name)}_prim_${pi}.rwx`;

    const outPath = path.join(outDir, filename);
    const ws = fs.createWriteStream(outPath);

    ws.write("ModelBegin\n");
    ws.write("ClumpBegin\n");

    if (texture) ws.write(`Texture ${texture}\n`);
    ws.write(`Color ${color[0]} ${color[1]} ${color[2]}\n`);

    for (let i = 0; i < positionReader.count; i++) {
      const p = positionReader.get(i);
      const uv = uvReader ? uvReader.get(i) : null;

      if (uv) {
        ws.write(`Vertex ${p[0]} ${p[1]} ${p[2]} UV ${uv[0]} ${uv[1]}\n`);
      } else {
        ws.write(`Vertex ${p[0]} ${p[1]} ${p[2]}\n`);
      }
    }

    const indexCount = indexReader ? indexReader.count : positionReader.count;
    let tris = 0;

    for (let i = 0; i < indexCount; i += 3) {
      const a = indexReader ? indexReader.get(i)[0] : i;
      const b = indexReader ? indexReader.get(i + 1)[0] : i + 1;
      const c = indexReader ? indexReader.get(i + 2)[0] : i + 2;

      ws.write(`Triangle ${a + 1} ${b + 1} ${c + 1}\n`);
      tris++;
    }

    ws.write("ClumpEnd\n");
    ws.write("ModelEnd\n");
    ws.end();

    manifest.push({
      file: filename,
      meshIndex: mi,
      meshName: mesh.name || "",
      primitiveIndex: pi,
      materialIndex: prim.material ?? null,
      materialName: mat?.name || "",
      texture,
      vertices: positionReader.count,
      triangles: tris
    });

    console.log(filename, positionReader.count, tris, texture || "no-texture");
    partIndex++;
  }
}

fs.writeFileSync(
  path.join(outDir, "manifest.json"),
  JSON.stringify({ source: input, parts: manifest }, null, 2)
);

console.log("parts:", manifest.length);
console.log("manifest:", path.join(outDir, "manifest.json"));
