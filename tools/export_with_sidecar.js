import fs from "fs";
import { parseTransformMetadata } from "./transform_metadata.js";
import path from "path";
import { rwxToThree } from "../src/converters/rwx.js";
import { threeToGLB } from "../src/converters/glb.js";

const input = process.argv[2];
const inputText = fs.readFileSync(input, "utf8");

if (!input) {
  console.error("Usage: node tools/export_with_sidecar.js model.rwx");
  process.exit(1);
}

const outDir = "tests/sidecar_reports";
fs.mkdirSync(outDir, { recursive: true });

const base = path.basename(input, ".rwx");
const text = fs.readFileSync(input, "utf8");

function linesOf(cmd) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.toLowerCase().startsWith(cmd.toLowerCase() + " "));
}

function countCmd(cmd) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim().toLowerCase())
    .filter(line => line === cmd.toLowerCase()).length;
}

function parseTransformBlocks(text) {
  return parseTransformMetadata(text);
}

const scene = rwxToThree(text);
const glb = await threeToGLB(scene);

const glbPath = `${outDir}/${base}.glb`;
const sidecarPath = `${outDir}/${base}.rwxmeta.json`;

fs.writeFileSync(glbPath, Buffer.from(glb));

const colorLines = linesOf("Color");

const sidecar = {
  version: 1,
  format: "PocketRWXSidecar",
  mode: "baked",
  rwx: {
    transforms: parseTransformBlocks(inputText),
    extraOriginalCommands: [
      ...Array(Math.max(0, countCmd("ClumpBegin") - 1)).fill("ClumpBegin"),
      ...colorLines.slice(1),
      ...Array(Math.max(0, countCmd("ClumpEnd") - 1)).fill("ClumpEnd")
    ]
  }
};

fs.writeFileSync(sidecarPath, JSON.stringify(sidecar, null, 2));

console.log(`GLB:     ${glbPath}`);
console.log(`Sidecar: ${sidecarPath}`);
