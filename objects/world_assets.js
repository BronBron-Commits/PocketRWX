import { RWXWriter } from "../tools/proc/rwx_writer.js";
import { box } from "../tools/proc/primitives.js";

function saveHouse(out) {
  const w = new RWXWriter();

  w.color(0.65, 0.42, 0.22);
  box(w, 0, 1, 0, 3, 2, 3);

  w.color(0.35, 0.08, 0.04);
  box(w, 0, 2.25, -0.75, 3.4, 0.35, 2.1);
  box(w, 0, 2.25, 0.75, 3.4, 0.35, 2.1);

  w.color(0.12, 0.07, 0.03);
  box(w, 0, 0.65, -1.55, 0.7, 1.2, 0.12);

  w.color(0.05, 0.25, 0.55);
  box(w, -1, 1.25, -1.56, 0.45, 0.45, 0.08);
  box(w, 1, 1.25, -1.56, 0.45, 0.45, 0.08);

  w.save(out);
}

function saveDock(out) {
  const w = new RWXWriter();

  w.color(0.42, 0.25, 0.12);
  for (let i = 0; i < 8; i++) {
    box(w, 0, 0, i * 0.75, 3.5, 0.18, 0.5);
  }

  w.color(0.25, 0.14, 0.07);
  for (const x of [-1.4, 1.4]) {
    for (let i = 0; i < 5; i++) {
      box(w, x, -0.7, i * 1.2, 0.22, 1.4, 0.22);
    }
  }

  w.save(out);
}

function saveBoat(out) {
  const w = new RWXWriter();

  w.color(0.28, 0.12, 0.05);
  box(w, 0, 0.25, 0, 3, 0.5, 1.2);
  box(w, -1.65, 0.35, 0, 0.35, 0.7, 0.9);
  box(w, 1.65, 0.35, 0, 0.35, 0.7, 0.9);

  w.color(0.9, 0.85, 0.65);
  box(w, 0, 1.2, 0, 0.12, 2.0, 0.12);
  box(w, 0.45, 1.55, 0, 0.9, 1.1, 0.08);

  w.save(out);
}

function saveTree(out) {
  const w = new RWXWriter();

  w.color(0.35, 0.18, 0.07);
  box(w, 0, 0.8, 0, 0.35, 1.6, 0.35);

  w.color(0.05, 0.45, 0.12);
  box(w, 0, 2.0, 0, 1.7, 1.0, 1.7);
  box(w, 0, 2.7, 0, 1.25, 0.9, 1.25);
  box(w, 0, 3.3, 0, 0.85, 0.7, 0.85);

  w.save(out);
}

function saveLantern(out) {
  const w = new RWXWriter();

  w.color(0.08, 0.08, 0.08);
  box(w, 0, 1.0, 0, 0.12, 2.0, 0.12);
  box(w, 0, 2.05, 0, 0.7, 0.12, 0.12);

  w.color(1.0, 0.72, 0.18);
  box(w, 0.4, 1.75, 0, 0.35, 0.5, 0.35);

  w.save(out);
}

function saveBridge(out) {
  const w = new RWXWriter();

  w.color(0.45, 0.27, 0.12);
  box(w, 0, 0.2, 0, 5.5, 0.3, 2.0);

  w.color(0.25, 0.14, 0.07);
  for (const x of [-2.4, -1.2, 0, 1.2, 2.4]) {
    box(w, x, 0.8, -0.9, 0.18, 1.1, 0.18);
    box(w, x, 0.8, 0.9, 0.18, 1.1, 0.18);
  }

  box(w, 0, 1.25, -0.9, 5.4, 0.18, 0.18);
  box(w, 0, 1.25, 0.9, 5.4, 0.18, 0.18);

  w.save(out);
}

const kind = process.argv[2];
const out = process.argv[3];

if (kind === "house") saveHouse(out || "generated/house.rwx");
else if (kind === "dock") saveDock(out || "generated/dock.rwx");
else if (kind === "boat") saveBoat(out || "generated/boat.rwx");
else if (kind === "tree") saveTree(out || "generated/tree.rwx");
else if (kind === "lantern") saveLantern(out || "generated/lantern.rwx");
else if (kind === "bridge") saveBridge(out || "generated/bridge.rwx");
else {
  console.error("usage: node objects/world_assets.js house|dock|boat|tree|lantern|bridge [out.rwx]");
  process.exit(1);
}

function savePerson(out) {
  const w = new RWXWriter();

  w.color(0.12, 0.18, 0.45);
  box(w, 0, 0.95, 0, 0.45, 0.9, 0.25);

  w.color(0.85, 0.62, 0.42);
  box(w, 0, 1.55, 0, 0.32, 0.32, 0.32);

  w.color(0.08, 0.08, 0.09);
  box(w, -0.13, 0.25, 0, 0.13, 0.5, 0.13);
  box(w, 0.13, 0.25, 0, 0.13, 0.5, 0.13);

  w.color(0.85, 0.62, 0.42);
  box(w, -0.35, 0.9, 0, 0.12, 0.65, 0.12);
  box(w, 0.35, 0.9, 0, 0.12, 0.65, 0.12);

  w.save(out);
}

if (kind === "person") savePerson(out || "generated/person.rwx");
