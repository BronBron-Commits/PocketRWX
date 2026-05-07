import fs from "fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node tools/validate_rwx_core.js <file.rwx>");
  process.exit(1);
}

const text = fs.readFileSync(file, "utf8");
const lines = text.split(/\r?\n/);

let verts = 0;
let tris = 0;
let errors = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line || line.startsWith("#")) continue;

  const p = line.split(/\s+/);
  const cmd = p[0].toLowerCase();

  if (cmd === "vertex") verts++;

  if (cmd === "triangle") {
    tris++;
    for (const n of [p[1], p[2], p[3]]) {
      const idx = Number(n);
      if (!Number.isInteger(idx) || idx < 1 || idx > verts) {
        console.error(`bad triangle index at line ${i + 1}: ${line}`);
        errors++;
      }
    }
  }

  const safe = new Set([
    "modelbegin","modelend","clumpbegin","clumpend",
    "surface","color","ambient","diffuse","specular","opacity",
    "texture","textureaddressmode","texturemode",
    "vertex","triangle","collision","lightsampling","geometrysampling"
  ]);

  if (!safe.has(cmd)) {
    console.warn(`non-core command line ${i + 1}: ${line}`);
  }
}

console.log({ file, verts, tris, errors });

if (errors) process.exit(1);
