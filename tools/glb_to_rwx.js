import fs from "fs";
import path from "path";

globalThis.self = globalThis;

const { glbToThree } = await import("../src/converters/glb.js");
const { threeToRWX } = await import("../src/converters/rwx.js");

const input = process.argv[2];

if (!input) {
  console.error("usage: node tools/glb_to_rwx.js <input.glb|input.gltf> [output.rwx]");
  process.exit(1);
}

const output =
  process.argv[3] ||
  input.replace(/\.(glb|gltf)$/i, ".rwx");

const buf = fs.readFileSync(input);
const scene = await glbToThree(buf, path.dirname(input));
const rwx = threeToRWX(scene);

fs.writeFileSync(output, rwx);
console.log(`RWX: ${output}`);
