import { spawnSync } from "child_process";

const input = process.argv[2];

if (!input) {
  console.error("Usage: node tools/sidecar_roundtrip.js path/to/model.rwx");
  process.exit(1);
}

function run(command, args) {
  console.log("");
  console.log(`$ ${command} ${args.join(" ")}`);

  const result = spawnSync(command, args, {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status);
  }
}

const base =
  input
    .split("/")
    .pop()
    .replace(/\.[^.]+$/, "");

const glb =
  `tests/sidecar_reports/${base}.glb`;

const sidecar =
  `tests/sidecar_reports/${base}.rwxmeta.json`;

const rwx =
  `tests/sidecar_reports/${base}.sidecar.roundtrip.rwx`;

run("node", [
  "tools/export_with_sidecar.js",
  input
]);

run("node", [
  "tools/import_with_sidecar.js",
  glb,
  sidecar
]);

run("cat", [
  rwx
]);

console.log("");
console.log("=".repeat(72));
console.log("FINAL RESULT: SIDECAR ROUNDTRIP COMPLETE");
console.log("=".repeat(72));
console.log("");
console.log(`Input:   ${input}`);
console.log(`GLB:     ${glb}`);
console.log(`Sidecar: ${sidecar}`);
console.log(`RWX:     ${rwx}`);
