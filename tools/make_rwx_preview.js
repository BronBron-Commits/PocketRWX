import fs from "fs";

const input = process.argv[2];
const output = process.argv[3];
const maxTriangles = Number(process.argv[4] || 10000);

if (!input || !output) {
  console.error("usage: node tools/make_rwx_preview.js <input.rwx> <output.rwx> [maxTriangles]");
  process.exit(1);
}

const text = fs.readFileSync(input, "utf8");
const lines = text.split(/\r?\n/);

const vertices = [];
const triangles = [];
const header = [];

let currentTexture = null;

for (const line of lines) {
  if (line.startsWith("Vertex ")) {
    vertices.push(line);
  } else if (line.startsWith("Texture ")) {
    currentTexture = line;
  } else if (line.startsWith("Color ") || line.startsWith("Surface ") || line.startsWith("Opacity ")) {
    header.push(line);
  } else if (line.startsWith("Triangle ")) {
    if (triangles.length >= maxTriangles) break;
    triangles.push({ texture: currentTexture, line });
  }
}

const used = new Map();
const outVerts = [];
const outTris = [];
let lastTexture = null;

function remap(oldIndex) {
  if (!used.has(oldIndex)) {
    used.set(oldIndex, used.size + 1);
    outVerts.push(vertices[oldIndex - 1]);
  }
  return used.get(oldIndex);
}

for (const tri of triangles) {
  const parts = tri.line.trim().split(/\s+/);
  const a = remap(Number(parts[1]));
  const b = remap(Number(parts[2]));
  const c = remap(Number(parts[3]));

  if (tri.texture && tri.texture !== lastTexture) {
    outTris.push(tri.texture);
    lastTexture = tri.texture;
  }

  outTris.push(`Triangle ${a} ${b} ${c}`);
}

const out = [
  "ModelBegin",
  "ClumpBegin",
  ...header.slice(0, 8),
  ...outVerts,
  ...outTris,
  "ClumpEnd",
  "ModelEnd",
  ""
].join("\n");

fs.writeFileSync(output, out);

console.log("input triangles:", triangles.length);
console.log("used vertices:", used.size);
console.log("output:", output);
console.log("bytes:", fs.statSync(output).size);
