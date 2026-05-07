import { RWXWriter } from "../tools/proc/rwx_writer.js";
import { box } from "../tools/proc/primitives.js";

const out = process.argv[2] || "generated/bookshelf.rwx";
const w = new RWXWriter();

w.color(0.42, 0.22, 0.08);

box(w, 0, 1.5, 0, 4, 0.25, 0.35);
box(w, 0, 0.0, 0, 4, 0.25, 0.35);
box(w, 0, 0.75, 0, 4, 0.18, 0.3);
box(w, -2, 0.75, 0, 0.25, 1.75, 0.4);
box(w, 2, 0.75, 0, 0.25, 1.75, 0.4);

w.color(0.65, 0.05, 0.05);
for (let i = 0; i < 8; i++) {
  box(w, -1.55 + i * 0.42, 0.35, 0.05, 0.25, 0.7, 0.25);
}

w.color(0.05, 0.15, 0.65);
for (let i = 0; i < 7; i++) {
  box(w, -1.4 + i * 0.48, 1.1, 0.05, 0.3, 0.65, 0.25);
}

w.save(out);
