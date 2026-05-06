import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const fixturesDir = "tests/fixtures";

const files = fs
  .readdirSync(fixturesDir)
  .filter(f => f.endsWith(".rwx"))
  .sort();

for (const file of files) {
  const input = path.join(fixturesDir, file);
  const base = path.basename(file, ".rwx");
  const roundtrip = `tests/sidecar_reports/${base}.sidecar.roundtrip.rwx`;

  console.log("============================================================");
  console.log(`SIDECAR INSPECT: ${file}`);
  console.log("============================================================");

  try {
    execSync(`node tools/sidecar_roundtrip.js "${input}"`, {
      stdio: "ignore"
    });

    const out = execSync(
      `node tools/inspect_sidecar_loss.js "${input}" "${roundtrip}"`,
      { encoding: "utf8" }
    );

    const lines = out
      .split("\n")
      .filter(line =>
        line.includes("FINAL RESULT") ||
        line.includes("No real command loss") ||
        line.includes("Real losses:")
      );

    for (const line of lines) {
      console.log(line);
    }
  } catch (err) {
    console.log(`FAILED: ${file}`);

    if (err.stdout) console.log(err.stdout.toString());
    if (err.stderr) console.log(err.stderr.toString());
  }

  console.log();
}
