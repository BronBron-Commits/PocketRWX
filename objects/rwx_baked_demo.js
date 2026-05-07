import { RWXWriter } from "../tools/proc/rwx_writer.js";
import { cylinder } from "../tools/proc/primitives.js";

const w = new RWXWriter();

for (let i = 0; i < 8; i++) {
  w.color(0.45, 0.24, 0.09);
  cylinder(w, -3.5 + i, 0.7, 0, 0.35, 1.4, 20);
}

w.color(0.9, 0.75, 0.25);
cylinder(w, 0, 2.5, 0, 0.45, 0.9, 24);

w.save("generated/rwx_baked_demo.rwx");
