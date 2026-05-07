import { SceneWriter } from "../tools/proc/scene_writer.js";

const s = new SceneWriter();
const placed = [];

function rand(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function overlaps(a, b) {
  return !(
    a.x + a.r <= b.x - b.r ||
    a.x - a.r >= b.x + b.r ||
    a.z + a.r <= b.z - b.r ||
    a.z - a.r >= b.z + b.r
  );
}

function addSafe(file, x, y, z, scale = 1, yaw = 0, radius = 1) {
  const candidate = { x, z, r: radius * scale };

  for (const p of placed) {
    if (overlaps(candidate, p)) {
      return false;
    }
  }

  placed.push(candidate);
  s.add(file, x, y, z, scale, yaw);
  return true;
}

function mustAdd(file, x, y, z, scale = 1, yaw = 0, radius = 1) {
  placed.push({ x, z, r: radius * scale });
  s.add(file, x, y, z, scale, yaw);
}

mustAdd("generated/lighthouse.rwx", -16, 0, 10, 1.6, 0, 2.4);
mustAdd("generated/dock.rwx", 0, 0, 8, 1.4, 0, 3.5);
mustAdd("generated/bridge.rwx", 0, 0, 1, 1.2, 0, 3.5);

for (let i = 0; i < 4; i++) {
  addSafe(
    "generated/boat.rwx",
    -12 + i * 8,
    0,
    16 + rand(i) * 5,
    0.8 + rand(i + 9) * 0.4,
    rand(i + 20) * 1.2 - 0.6,
    2.5
  );
}

for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 5; col++) {
    addSafe(
      "generated/house.rwx",
      -12 + col * 6,
      0,
      -4 - row * 6,
      0.85 + rand(row * 10 + col) * 0.35,
      rand(row * 20 + col) * 0.5 - 0.25,
      2.8
    );
  }
}

for (let i = 0; i < 120; i++) {
  addSafe(
    "generated/pine.rwx",
    -26 + rand(i * 3) * 52,
    0,
    -28 + rand(i * 7) * 45,
    0.75 + rand(i * 11) * 0.6,
    rand(i) * 6.28,
    1.3
  );
}

for (let i = 0; i < 20; i++) {
  addSafe(
    "generated/lantern.rwx",
    -16 + i * 1.7,
    0,
    2.8 + Math.sin(i) * 0.4,
    1,
    0,
    0.5
  );
}

for (let i = 0; i < 30; i++) {
  addSafe(
    "generated/crate.rwx",
    -10 + rand(i) * 20,
    0,
    4 + rand(i + 30) * 7,
    0.4 + rand(i + 10) * 0.5,
    rand(i + 60) * 6.28,
    0.8
  );
}


for (let i = 0; i < 28; i++) {
  addSafe(
    "generated/person.rwx",
    -14 + rand(i * 13) * 28,
    0,
    -14 + rand(i * 17) * 20,
    0.9,
    rand(i * 23) * 6.28,
    0.45
  );
}

s.save("generated/proc_harbor_town.json");

console.log("placed objects:", placed.length);
