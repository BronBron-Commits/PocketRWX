import fs from "fs";
import path from "path";
import { commandStats, diffCommandCounts } from "./loss_utils.js";
import { classifyCommandLoss } from "./loss_policy.js";

const originalPath = process.argv[2];
const restoredPath = process.argv[3];

if (!originalPath || !restoredPath) {
  console.error("Usage: node tools/inspect_sidecar_loss.js original.rwx restored.rwx");
  process.exit(1);
}

const outDir = "tests/sidecar_reports";
fs.mkdirSync(outDir, { recursive: true });

const base = path.basename(originalPath).replace(/\.[^.]+$/, "");

const originalText = fs.readFileSync(originalPath, "utf8");
const restoredText = fs.readFileSync(restoredPath, "utf8");

const before = commandStats(originalText);
const after = commandStats(restoredText);

const commandLoss = diffCommandCounts(before, after);
const classified = classifyCommandLoss(commandLoss);

const report = {
  original: originalPath,
  restored: restoredPath,
  original_commands: before.commands,
  restored_commands: after.commands,
  acceptable_command_loss: classified.acceptable,
  real_command_loss: classified.real,
  unsupported_original_commands: before.unsupported
};

const reportPath = path.join(outDir, `${base}.sidecar.loss.json`);
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");

console.log("");
console.log(`PocketRWX sidecar loss report: ${originalPath}`);

console.log("");
console.log("Acceptable command changes");
console.log("--------------------------");
const acceptable = Object.entries(classified.acceptable);
if (!acceptable.length) {
  console.log("none");
} else {
  for (const [cmd, v] of acceptable) {
    const sign = v.delta > 0 ? "+" : "";
    console.log(`${cmd}: ${v.before} -> ${v.after} (${sign}${v.delta}) - ${v.reason}`);
  }
}

console.log("");
console.log("Real command loss");
console.log("-----------------");
const real = Object.entries(classified.real);
if (!real.length) {
  console.log("none");
} else {
  for (const [cmd, v] of real) {
    const sign = v.delta > 0 ? "+" : "";
    console.log(`${cmd}: ${v.before} -> ${v.after} (${sign}${v.delta})`);
  }
}

console.log("");
console.log("Outputs");
console.log("-------");
console.log(`report: ${reportPath}`);

console.log("");
console.log("=".repeat(72));

if (real.length) {
  console.log("FINAL RESULT: SIDECAR LOSS DETECTED");
  console.log(`Real losses: ${real.length}`);
} else {
  console.log("FINAL RESULT: SIDECAR ROUNDTRIP CLEAN");
  console.log("No real command loss detected through sidecar restore.");
}

console.log("=".repeat(72));
