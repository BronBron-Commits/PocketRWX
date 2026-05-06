import fs from "fs";
import path from "path";
import { rwxToThree, threeToRWX } from "../src/converters/rwx.js";
import { threeToGLB, glbToThree } from "../src/converters/glb.js";
import { sceneStats, compareStats } from "./conversion_stats.js";

const fixturesDir = "tests/fixtures";
const outDir = "tests/snapshots";

fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(fixturesDir).filter(f => f.endsWith(".rwx"));

let failed = 0;

for (const file of files) {
  const inputPath = path.join(fixturesDir, file);
  const base = path.basename(file, ".rwx");

  console.log(`\n=== ${file} ===`);

  const rwxText = fs.readFileSync(inputPath, "utf8");

  const sceneA = rwxToThree(rwxText);
  const statsA = sceneStats(sceneA);

  const glb = await threeToGLB(sceneA);
  fs.writeFileSync(path.join(outDir, `${base}.glb`), Buffer.from(glb));

  const sceneB = await glbToThree(glb);
  const statsB = sceneStats(sceneB);

  const roundTripRWX = threeToRWX(sceneB);
  fs.writeFileSync(path.join(outDir, `${base}.roundtrip.rwx`), roundTripRWX);

  const sceneC = rwxToThree(roundTripRWX);
  const statsC = sceneStats(sceneC);

  const glbCompare = compareStats(statsA, statsB);
  const rwxCompare = compareStats(statsA, statsC);

  const report = {
    input: file,
    rwx_original: statsA,
    after_glb: statsB,
    after_rwx_roundtrip: statsC,
    glbCompare,
    rwxCompare
  };

  fs.writeFileSync(
    path.join(outDir, `${base}.report.json`),
    JSON.stringify(report, null, 2)
  );

  console.log(JSON.stringify(report, null, 2));

  if (!glbCompare.pass || !rwxCompare.pass) {
    failed++;
  }
}

if (failed) {
  console.error(`\n${failed} conversion test(s) failed.`);
  process.exit(1);
}

console.log("\nAll conversion tests passed.");
