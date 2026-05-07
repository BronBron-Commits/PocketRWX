import { RWXWriter } from "../tools/proc/rwx_writer.js";

const out = process.argv[2] || "generated/crate.rwx";
const w = new RWXWriter();

w.color(0.55, 0.32, 0.12);

const s = 1;

const v = [
  w.vertex(-s,-s,-s,0,0), w.vertex( s,-s,-s,1,0), w.vertex( s, s,-s,1,1), w.vertex(-s, s,-s,0,1),
  w.vertex(-s,-s, s,0,0), w.vertex( s,-s, s,1,0), w.vertex( s, s, s,1,1), w.vertex(-s, s, s,0,1)
];

w.quad(v[0], v[1], v[2], v[3]);
w.quad(v[5], v[4], v[7], v[6]);
w.quad(v[4], v[0], v[3], v[7]);
w.quad(v[1], v[5], v[6], v[2]);
w.quad(v[3], v[2], v[6], v[7]);
w.quad(v[4], v[5], v[1], v[0]);

w.save(out);
