import { SceneWriter } from "../tools/proc/scene_writer.js";

const out = process.argv[2] || "generated/town_scene.json";
const s = new SceneWriter();

s.add("generated/bookshelf.rwx", 0, 0, 0, 1, 0);
s.add("generated/bookshelf.rwx", 5, 0, 0, 1, 0.4);
s.add("generated/bookshelf.rwx", -5, 0, 0, 1, -0.4);
s.add("generated/crate.rwx", 0, 0, 4, 1, 0);
s.add("generated/crate.rwx", 2, 0, 4, 0.75, 0.2);
s.add("generated/crate.rwx", -2, 0, 4, 0.75, -0.2);

s.save(out);
