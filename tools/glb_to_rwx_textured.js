import fs from "fs";
import path from "path";

globalThis.self ??= globalThis;

const { glbToThree } = await import("../src/converters/glb.js");
const { threeToRWX } = await import("../src/converters/rwx.js");

const input = process.argv[2];
const output = process.argv[3] || input.replace(/\.(glb|gltf)$/i, ".rwx");

if (!input) {
  console.error("usage: node tools/glb_to_rwx_textured.js <input.glb> [output.rwx]");
  process.exit(1);
}

const buf = fs.readFileSync(input);
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.toString("utf8", 20, 20 + jsonLen));

const texDir = input.replace(/\.(glb|gltf)$/i, "_textures");
const textures = json.textures || [];
const images = json.images || [];
const materials = json.materials || [];

function safeName(s) {
  return String(s || "texture").replace(/[^a-z0-9._-]+/gi, "_");
}

function imageFile(imageIndex) {
  const image = images[imageIndex];
  if (!image) return null;

  const ext =
    image.mimeType === "image/png" ? "png" :
    image.mimeType === "image/webp" ? "webp" :
    "jpg";

  return path.join(texDir, `${imageIndex}_${safeName(image.name)}.${ext}`);
}

const materialTexture = new Map();

for (const mat of materials) {
  const texIndex = mat?.pbrMetallicRoughness?.baseColorTexture?.index;
  const imageIndex =
    textures[texIndex]?.source ??
    textures[texIndex]?.extensions?.EXT_texture_webp?.source;

  const file = imageFile(imageIndex);

  if (mat?.name && file) {
    materialTexture.set(mat.name, file);
  }
}

console.log("GLB materials:", materials.length);
console.log("GLB textures:", textures.length);
console.log("mapped material textures:", materialTexture.size);

const scene = await glbToThree(buf);

let assigned = 0;

scene.traverse(o => {
  if (!o.isMesh) return;

  const mats = Array.isArray(o.material) ? o.material : [o.material];

  for (const m of mats) {
    const texture = materialTexture.get(m?.name);

    if (texture) {
      m.userData.rwx = {
        ...(m.userData.rwx || {}),
        texture
      };
      assigned++;
    }
  }
});

console.log("assigned mesh material textures:", assigned);

const rwx = threeToRWX(scene);
fs.writeFileSync(output, rwx);
console.log(`RWX: ${output}`);
