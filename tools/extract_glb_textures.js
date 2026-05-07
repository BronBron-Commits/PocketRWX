import fs from "fs";
import path from "path";

const input = process.argv[2];
const outDir = process.argv[3] || input.replace(/\.(glb|gltf)$/i, "_textures");

if (!input) {
  console.error("usage: node tools/extract_glb_textures.js <input.glb> [outdir]");
  process.exit(1);
}

const buf = fs.readFileSync(input);

let offset = 12;
let json = null;
let bin = null;

while (offset < buf.length) {
  const len = buf.readUInt32LE(offset);
  const type = buf.toString("utf8", offset + 4, offset + 8);
  const start = offset + 8;

  if (type === "JSON") {
    json = JSON.parse(buf.toString("utf8", start, start + len));
  }

  if (type === "BIN\0") {
    bin = buf.subarray(start, start + len);
  }

  offset = start + len;
}

fs.mkdirSync(outDir, { recursive: true });

for (let i = 0; i < (json.images || []).length; i++) {
  const image = json.images[i];
  const view = json.bufferViews[image.bufferView];
  const ext = image.mimeType === "image/png" ? "png" : "jpg";
  const safe = String(image.name || `image_${i}`).replace(/[^a-z0-9._-]+/gi, "_");
  const out = path.join(outDir, `${i}_${safe}.${ext}`);

  fs.writeFileSync(out, bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength));
  console.log(out);
}
