import { RWXWriter } from "../tools/proc/rwx_writer.js";
import { box } from "../tools/proc/primitives.js";

function part(out, color, sx, sy, sz) {
  const w = new RWXWriter();
  w.color(...color);
  box(w, 0, 0, 0, sx, sy, sz);
  w.save(out);
}

part("generated/person_body.rwx", [0.12, 0.18, 0.45], 0.45, 0.9, 0.25);
part("generated/person_head.rwx", [0.85, 0.62, 0.42], 0.32, 0.32, 0.32);
part("generated/person_left_leg.rwx", [0.08, 0.08, 0.09], 0.13, 0.5, 0.13);
part("generated/person_right_leg.rwx", [0.08, 0.08, 0.09], 0.13, 0.5, 0.13);
part("generated/person_left_arm.rwx", [0.85, 0.62, 0.42], 0.12, 0.65, 0.12);
part("generated/person_right_arm.rwx", [0.85, 0.62, 0.42], 0.12, 0.65, 0.12);
