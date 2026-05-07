import { RWXWriter } from "../tools/proc/rwx_writer.js";

const w = new RWXWriter();

w.protoBegin("post");
w.surface(0.7, 0.9, 0.05);
w.color(0.28, 0.16, 0.07);
w.cylinder(1.2, 0.12, 0.12, 12);
w.protoEnd();

w.protoBegin("barrel");
w.surface(0.7, 0.85, 0.05);
w.color(0.45, 0.24, 0.09);
w.cylinder(1.0, 0.32, 0.32, 18);
w.protoEnd();

w.beginClump();

w.color(0.42, 0.25, 0.12);
for (let i = 0; i < 8; i++) {
  w.transformBegin();
  w.translate(0, 0, i * 0.75);
  w.scale(3.5, 0.18, 0.5);
  w.block(1, 1, 1);
  w.transformEnd();
}

for (const x of [-1.5, 1.5]) {
  for (let i = 0; i < 6; i++) {
    w.transformBegin();
    w.translate(x, -0.4, 4 + i * 1.1);
    w.protoInstance("post");
    w.transformEnd();
  }
}

for (let i = 0; i < 6; i++) {
  w.transformBegin();
  w.translate(-3 + i * 1.2, 0.5, -2);
  w.rotate(0, 1, 0, i * 18);
  w.protoInstance("barrel");
  w.transformEnd();
}

w.save("generated/harbor_full.rwx");
