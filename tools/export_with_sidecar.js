import fs from "fs";
import path from "path";
import { rwxToThree } from "../src/converters/rwx.js";
import { threeToGLB } from "../src/converters/glb.js";
import { buildRWXSidecar, applySidecarToThree } from "./sidecar.js";

const input = process.argv[2];

if (!input) {
  console.error("Usage: node tools/export_with_sidecar.js path/to/model.rwx");
  process.exit(1);
}

const outDir = "tests/sidecar_reports";
fs.mkdirSync(outDir, { recursive: true });

const base = path.basename(input).replace(/\.[^.]+$/, "");
const text = fs.readFileSync(input, "utf8");

const sidecar = buildRWXSidecar(text);
const scene = applySidecarToThree(
  rwxToThree(text),
  sidecar
);

const glb = await threeToGLB(scene);

const glbPath = path.join(outDir, `${base}.glb`);
const sidecarPath = path.join(outDir, `${base}.rwxmeta.json`);

fs.writeFileSync(glbPath, Buffer.from(glb));
fs.writeFileSync(sidecarPath, JSON.stringify(sidecar, null, 2) + "\n");

console.log(`GLB:     ${glbPath}`);
console.log(`Sidecar: ${sidecarPath}`);
