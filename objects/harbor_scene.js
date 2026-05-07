import { SceneWriter } from "../tools/proc/scene_writer.js";

const s = new SceneWriter();

s.add("generated/lighthouse.rwx", -11, 0, 6, 1.4, 0);

s.add("generated/house.rwx", -6, 0, -2, 1, 0.2);
s.add("generated/house.rwx", 0, 0, -3, 1.1, -0.15);
s.add("generated/house.rwx", 6, 0, -2, 1, 0.1);

s.add("generated/dock.rwx", 0, 0, 4, 1, 0);

s.add("generated/boat.rwx", -6.5, 0, 11.5, 1, 0.35);
s.add("generated/boat.rwx", 7.5, 0, 13.5, 0.8, -0.45);

s.add("generated/bridge.rwx", 0, 0, 0.5, 1, 0);

for (let i = 0; i < 10; i++) {
  s.add(
    "generated/pine.rwx",
    -12 + i * 2.6,
    0,
    -7.5,
    0.9 + (i % 3) * 0.1,
    i * 0.2
  );
}

for (let i = 0; i < 7; i++) {
  s.add("generated/lantern.rwx", -6 + i * 2, 0, 2.5, 1, 0);
}

for (let i = 0; i < 6; i++) {
  s.add("generated/pierpost.rwx", -1.6, -0.4, 4 + i * 1.1, 1, 0);
  s.add("generated/pierpost.rwx", 1.6, -0.4, 4 + i * 1.1, 1, 0);
}

s.save("generated/harbor_scene.json");
