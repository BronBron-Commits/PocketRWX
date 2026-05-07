import { RWXWriter } from "../tools/proc/rwx_writer.js";
import { box, cylinder, cone } from "../tools/proc/primitives.js";

function lighthouse(out) {
  const w = new RWXWriter();

  w.color(0.92, 0.9, 0.82);
  cylinder(w, 0, 1.8, 0, 0.75, 3.6, 24);

  w.color(0.7, 0.08, 0.06);
  cylinder(w, 0, 1.0, 0, 0.78, 0.28, 24);
  cylinder(w, 0, 2.2, 0, 0.78, 0.28, 24);

  w.color(0.1, 0.1, 0.12);
  cylinder(w, 0, 3.75, 0, 0.9, 0.25, 24);

  w.color(1.0, 0.85, 0.28);
  cylinder(w, 0, 4.05, 0, 0.55, 0.45, 16);

  w.color(0.45, 0.05, 0.05);
  cone(w, 0, 4.25, 0, 0.9, 0.9, 24);

  w.save(out);
}

function pine(out) {
  const w = new RWXWriter();

  w.color(0.34, 0.18, 0.07);
  cylinder(w, 0, 0.8, 0, 0.16, 1.6, 12);

  w.color(0.04, 0.36, 0.11);
  cone(w, 0, 1.2, 0, 1.1, 1.2, 16);
  cone(w, 0, 1.9, 0, 0.85, 1.1, 16);
  cone(w, 0, 2.55, 0, 0.6, 0.9, 16);

  w.save(out);
}

function pierPost(out) {
  const w = new RWXWriter();

  w.color(0.28, 0.16, 0.07);
  cylinder(w, 0, 0.5, 0, 0.18, 1.0, 12);

  w.color(0.8, 0.75, 0.62);
  cylinder(w, 0, 1.1, 0, 0.2, 0.16, 12);

  w.save(out);
}

const kind = process.argv[2];
const out = process.argv[3];

if (kind === "lighthouse") lighthouse(out || "generated/lighthouse.rwx");
else if (kind === "pine") pine(out || "generated/pine.rwx");
else if (kind === "pierpost") pierPost(out || "generated/pierpost.rwx");
else {
  console.error("usage: node objects/coastal_assets.js lighthouse|pine|pierpost [out.rwx]");
  process.exit(1);
}
