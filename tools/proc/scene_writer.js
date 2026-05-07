import fs from "fs";

export class SceneWriter {
  constructor() {
    this.objects = [];
  }

  add(file, x=0, y=0, z=0, scale=1, yaw=0) {
    this.objects.push({ file, x, y, z, scale, yaw });
  }

  save(path) {
    fs.writeFileSync(path, JSON.stringify({ objects: this.objects }, null, 2));
    console.log("wrote", path);
  }
}
