import fs from "fs";
import path from "path";
import { glbToThree } from "../src/converters/glb.js";
import { threeToRWX } from "../src/converters/rwx.js";

const glbPath = process.argv[2];
const sidecarPath = process.argv[3];

if (!glbPath || !sidecarPath) {
  console.error("Usage: node tools/import_with_sidecar.js model.glb model.rwxmeta.json");
  process.exit(1);
}

const glb = fs.readFileSync(glbPath);
const sidecar = JSON.parse(fs.readFileSync(sidecarPath, "utf8"));

const scene = await glbToThree(glb);
const rwx = threeToRWX(scene);

const lines = rwx.split(/\r?\n/);
const output = [];

for (const line of lines) {
  output.push(line);

  if (line.trim().toLowerCase() === "clumpbegin") {
    output.push("# PocketRWX: original transforms were baked into vertex positions");
    output.push(`# PocketRWX: sidecar mode = ${sidecar.mode || "unknown"}`);

    for (const extra of sidecar.rwx?.extraOriginalCommands || []) {
      output.push(`# original ${extra}`);
    }

    for (const block of sidecar.rwx?.transforms || []) {
      for (const cmd of block) {
        output.push(`# original ${cmd}`);
      }
    }
  }
}

const base = path.basename(sidecarPath).replace(".rwxmeta.json", "");
const outPath = path.join(
  path.dirname(sidecarPath),
  `${base}.sidecar.roundtrip.rwx`
);

fs.writeFileSync(outPath, output.join("\n").replace(/\n+$/, "\n"));

console.log(`RWX: ${outPath}`);
