import { spawnSync } from "child_process";

const input = process.argv[2];

if (!input) {
  console.error("Usage: node tools/sidecar_inspect.js path/to/model.rwx");
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

const restored =
  `tests/sidecar_reports/${base}.sidecar.roundtrip.rwx`;

run("node", [
  "tools/sidecar_roundtrip.js",
  input
]);

run("node", [
  "tools/inspect_loss.js",
  input
]);

run("node", [
  "tools/inspect_sidecar_loss.js",
  input,
  restored
]);

console.log("");
console.log("=".repeat(72));
console.log("FINAL RESULT: SIDECAR INSPECTION COMPLETE");
console.log("=".repeat(72));
