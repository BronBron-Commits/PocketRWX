import fs from "fs";
import path from "path";
import { glbToThree } from "../src/converters/glb.js";
import { threeToRWX } from "../src/converters/rwx.js";
import { applySidecarToThree } from "./sidecar.js";

const glbPath = process.argv[2];
const sidecarPath = process.argv[3];

if (!glbPath || !sidecarPath) {
  console.error("Usage: node tools/import_with_sidecar.js path/to/model.glb path/to/model.rwxmeta.json");
  process.exit(1);
}

const outDir = "tests/sidecar_reports";
fs.mkdirSync(outDir, { recursive: true });

const base = path.basename(glbPath).replace(/\.[^.]+$/, "");

const glbBuffer = fs.readFileSync(glbPath);
const sidecar = JSON.parse(fs.readFileSync(sidecarPath, "utf8"));

const arrayBuffer = glbBuffer.buffer.slice(
  glbBuffer.byteOffset,
  glbBuffer.byteOffset + glbBuffer.byteLength
);

const scene = await glbToThree(arrayBuffer);

applySidecarToThree(scene, sidecar);

const rwx = threeToRWX(scene);
const rwxPath = path.join(outDir, `${base}.sidecar.roundtrip.rwx`);

fs.writeFileSync(rwxPath, rwx);

console.log(`RWX: ${rwxPath}`);
