import fs from "fs";
import path from "path";

const chunksDir = "samples/real_glb/everything_chunks";
const texDir = "samples/real_glb/everything_decoded_textures";

const textureFiles = fs.readdirSync(texDir);

function findActualTexture(requestedPath) {
  const base = path.basename(requestedPath);
  const m = base.match(/^(\d+)_/);

  if (!m) return requestedPath;

  const prefix = m[1] + "_";
  const actual = textureFiles.find(f => f.startsWith(prefix));

  if (!actual) return requestedPath;

  return `${texDir}/${actual}`;
}

let changed = 0;

for (const file of fs.readdirSync(chunksDir)) {
  if (!file.endsWith(".rwx")) continue;

  const full = path.join(chunksDir, file);
  const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);

  const out = lines.map(line => {
    if (!line.startsWith("Texture ")) return line;

    const requested = line.slice("Texture ".length).trim();
    const actual = findActualTexture(requested);

    if (actual !== requested) changed++;

    return "Texture " + actual;
  });

  fs.writeFileSync(full, out.join("\n"));
}

console.log("changed texture refs:", changed);
