import fs from "fs";
import path from "path";
import { rwxToThree, threeToRWX } from "../src/converters/rwx.js";
import { threeToGLB, glbToThree } from "../src/converters/glb.js";
import { sceneStats, compareStats } from "./conversion_stats.js";

const fixturesDir = "tests/fixtures";
const outDir = "tests/snapshots";
const expectedPath = "tests/expected_conversion_stats.json";

fs.mkdirSync(outDir, { recursive: true });

const expected = fs.existsSync(expectedPath)
  ? JSON.parse(fs.readFileSync(expectedPath, "utf8"))
  : {};

const files = fs.readdirSync(fixturesDir).filter(f => f.endsWith(".rwx"));

let failed = 0;

function checkExpected(base, stats) {
  const exp = expected[base];

  if (!exp) {
    return {
      pass: false,
      reason: "missing expected baseline"
    };
  }

  const problems = [];

  for (const key of ["meshes", "vertices", "triangles"]) {
    if (stats[key] !== exp[key]) {
      problems.push(`: expected , got `);
    }
  }

  if (exp.bounds) {
    for (const axis of ["x", "y", "z"]) {
      const expectedValue = Number(exp.bounds[axis].toFixed(3));
      const actualValue = Number(stats.bounds[axis].toFixed(3));

      if (expectedValue !== actualValue) {
        problems.push(`bounds.: expected , got `);
      }
    }
  }

  return {
    pass: problems.length === 0,
    problems
  };
}

for (const file of files) {
  const inputPath = path.join(fixturesDir, file);
  const base = path.basename(file, ".rwx");

  console.log(`\n=== ${file} ===`);

  const rwxText = fs.readFileSync(inputPath, "utf8");

  const sceneA = rwxToThree(rwxText);
  const statsA = sceneStats(sceneA);

  const baselineCheck = checkExpected(base, statsA);

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
    expected: expected[base] || null,
    baselineCheck,
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

  if (!baselineCheck.pass || !glbCompare.pass || !rwxCompare.pass) {
    failed++;
  }
}

if (failed) {
  console.error(`\n${failed} conversion test(s) failed.`);
  process.exit(1);
}

console.log("\nAll conversion tests passed.");
