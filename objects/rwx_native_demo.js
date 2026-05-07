import { RWXWriter } from "../tools/proc/rwx_writer.js";

const out = process.argv[2] || "generated/rwx_native_demo.rwx";
const w = new RWXWriter();

w.comment("Prototype barrel: defined once, reused many times");
w.protoBegin("barrel_proto");
w.surface(0.7, 0.85, 0.05);
w.textureAddressMode("wrap");
w.color(0.45, 0.24, 0.09);
w.seamless(true);
w.cylinder(1.4, 0.35, 0.35, 20);
w.seamless(false);
w.protoEnd();

w.beginClump();

for (let i = 0; i < 8; i++) {
  w.transformBegin();
  w.translate(-3.5 + i, 0.7, 0);
  w.rotate(0, 1, 0, i * 12);
  w.protoInstance("barrel_proto");
  w.transformEnd();
}

w.materialBegin();
w.surface(0.9, 0.9, 0.1);
w.color(0.9, 0.75, 0.25);
w.opacity(0.92);
w.materialEnd();

w.transformBegin();
w.translate(0, 2.5, 0);
w.sphere(0.45, 2);
w.transformEnd();

w.save(out);
