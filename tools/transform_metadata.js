export function parseTransformMetadata(text) {
  const commands = [];
  let depth = 0;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();

    if (!line || line.startsWith("#")) continue;

    const cmd = line.split(/\s+/)[0].toLowerCase();

    if (cmd === "transformbegin") {
      depth++;
      continue;
    }

    if (cmd === "transformend") {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (
      depth > 0 &&
      (
        cmd === "translate" ||
        cmd === "rotate" ||
        cmd === "scale"
      )
    ) {
      commands.push(line);
    }
  }

  return commands.length ? [commands] : [];
}
