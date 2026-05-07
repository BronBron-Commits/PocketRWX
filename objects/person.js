import { RWXWriter } from "../tools/proc/rwx_writer.js";
import { box } from "../tools/proc/primitives.js";

const out = process.argv[2] || "generated/person.rwx";
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
