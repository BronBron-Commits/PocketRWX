import fs from "fs";
import path from "path";
import { rwxToThree, threeToRWX, parseRWX } from "../src/converters/rwx.js";
import { threeToGLB, glbToThree } from "../src/converters/glb.js";
import { sceneStats } from "./conversion_stats.js";
import { classifyCommandLoss } from "./loss_policy.js";

const input = process.argv[2];

if (!input) {
  console.error("Usage: node tools/inspect_loss.js path/to/model.rwx");
  process.exit(1);
}

const outDir = "tests/loss_reports";
fs.mkdirSync(outDir, { recursive: true });

const base = path.basename(input).replace(/\.[^.]+$/, "");
const originalText = fs.readFileSync(input, "utf8");

const supported = new Set([
  "modelbegin",
  "modelend",
  "clumpbegin",
  "clumpend",
  "transformbegin",
  "transformend",
  "translate",
  "scale",
  "rotate",
  "color",
  "texture",
  "surface",
  "opacity",
  "vertex",
  "vertexext",
  "triangle",
  "quad",
  "polygon"
]);

function commandStats(text) {
  const commands = {};
  const unsupported = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const cmd = line.split(/\s+/)[0].toLowerCase();
    commands[cmd] = (commands[cmd] || 0) + 1;

    if (!supported.has(cmd)) unsupported.push(line);
  }

  return { commands, unsupported };
}

function diffCommandCounts(before, after) {
  const all = new Set([
    ...Object.keys(before.commands),
    ...Object.keys(after.commands)
  ]);

  const changed = {};

  for (const key of all) {
    const a = before.commands[key] || 0;
    const b = after.commands[key] || 0;

    if (a !== b) {
      changed[key] = {
        before: a,
        after: b,
        delta: b - a
      };
    }
  }

  return changed;
}

function compareSceneStats(a, b) {
  const changes = {};

  for (const key of ["meshes", "vertices", "triangles", "materials"]) {
    if (a[key] !== b[key]) {
      changes[key] = {
        before: a[key],
        after: b[key],
        delta: b[key] - a[key]
      };
    }
  }

  for (const axis of ["x", "y", "z"]) {
    if (a.bounds[axis] !== b.bounds[axis]) {
      changes[`bounds.${axis}`] = {
        before: a.bounds[axis],
        after: b.bounds[axis],
        delta: Number((b.bounds[axis] - a.bounds[axis]).toFixed(4))
      };
    }
  }

  return changes;
}

function printTable(title, rows) {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));

  if (!rows.length) {
    console.log("none");
    return;
  }

  for (const row of rows) {
    console.log(row);
  }
}

const originalCommands = commandStats(originalText);
const parsed = parseRWX(originalText);

const sceneA = rwxToThree(originalText);
const statsA = sceneStats(sceneA);

const glb = await threeToGLB(sceneA);
const glbPath = path.join(outDir, `${base}.roundtrip.glb`);
fs.writeFileSync(glbPath, Buffer.from(glb));

const sceneB = await glbToThree(glb);
const statsB = sceneStats(sceneB);

const roundtripRWX = threeToRWX(sceneB);
const rwxPath = path.join(outDir, `${base}.roundtrip.rwx`);
fs.writeFileSync(rwxPath, roundtripRWX);

const sceneC = rwxToThree(roundtripRWX);
const statsC = sceneStats(sceneC);

const roundtripCommands = commandStats(roundtripRWX);

const commandLoss = diffCommandCounts(originalCommands, roundtripCommands);
const classifiedLoss = classifyCommandLoss(commandLoss);
const sceneLossFull = compareSceneStats(statsA, statsC);

const report = {
  input,
  outputs: {
    glb: glbPath,
    rwx: rwxPath
  },
  original_rwx_commands: originalCommands.commands,
  roundtrip_rwx_commands: roundtripCommands.commands,
  command_count_loss: commandLoss,
  acceptable_command_loss: classifiedLoss.acceptable,
  real_command_loss: classifiedLoss.real,
  unsupported_original_commands: originalCommands.unsupported,
  parsed_rwx_summary: {
    vertices: parsed.vertices.length,
    faces: parsed.faces.length,
    uvs: parsed.uvs.length,
    color: parsed.color,
    texture: parsed.texture,
    surface: parsed.surface,
    opacity: parsed.opacity
  },
  stats: {
    original_rwx_scene: statsA,
    after_glb_scene: statsB,
    after_rwx_roundtrip_scene: statsC
  },
  scene_loss_full_roundtrip: sceneLossFull
};

const reportPath = path.join(outDir, `${base}.loss.json`);

fs.writeFileSync(
  reportPath,
  JSON.stringify(report, null, 2)
);

console.log("");
console.log(`PocketRWX loss report: ${input}`);

printTable("Scene stats", [
  `original:  meshes=${statsA.meshes} verts=${statsA.vertices} tris=${statsA.triangles} bounds=${JSON.stringify(statsA.bounds)}`,
  `after GLB: meshes=${statsB.meshes} verts=${statsB.vertices} tris=${statsB.triangles} bounds=${JSON.stringify(statsB.bounds)}`,
  `roundtrip: meshes=${statsC.meshes} verts=${statsC.vertices} tris=${statsC.triangles} bounds=${JSON.stringify(statsC.bounds)}`
]);

printTable(
  "Acceptable command changes",
  Object.entries(classifiedLoss.acceptable).map(([cmd, v]) => {
    const sign = v.delta > 0 ? "+" : "";
    return `${cmd}: ${v.before} -> ${v.after} (${sign}${v.delta}) ${v.reason ? "- " + v.reason : ""}`;
  })
);

printTable(
  "Real command loss",
  Object.entries(classifiedLoss.real).map(([cmd, v]) => {
    const sign = v.delta > 0 ? "+" : "";
    return `${cmd}: ${v.before} -> ${v.after} (${sign}${v.delta})`;
  })
);

printTable(
  "Unsupported commands",
  originalCommands.unsupported
);

printTable("Outputs", [
  `report: ${reportPath}`,
  `glb:    ${glbPath}`,
  `rwx:    ${rwxPath}`
]);

const realLossCount =
  Object.keys(classifiedLoss.real).length +
  Object.keys(sceneLossFull).length +
  originalCommands.unsupported.length;

console.log("");
console.log("=".repeat(72));

if (realLossCount > 0) {
  console.log("FINAL RESULT: LOSS DETECTED");
  console.log(`Real losses: ${realLossCount}`);
} else {
  console.log("FINAL RESULT: ROUNDTRIP CLEAN");
  console.log("No measurable conversion loss detected.");
}

console.log("=".repeat(72));

console.log("");
console.log("Summary");
console.log("-------");
console.log(`Input:  ${input}`);
console.log(`GLB:    ${glbPath}`);
console.log(`RWX:    ${rwxPath}`);
console.log(`Report: ${reportPath}`);
