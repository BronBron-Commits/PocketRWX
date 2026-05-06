const supported = new Set([
  "modelbegin",
  "modelend",
  "clumpbegin",
  "clumpend",
  "transformbegin",
  "transformend",
  "translate",
  "scale",
  "rotate",
  "color",
  "texture",
  "surface",
  "opacity",
  "vertex",
  "vertexext",
  "triangle",
  "quad",
  "polygon"
]);

export function commandStats(text) {
  const commands = {};
  const unsupported = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    let normalized = line;

    if (line.toLowerCase().startsWith("# original ")) {
      normalized = line.slice("# original ".length).trim();
    } else if (line.startsWith("#")) {
      continue;
    }

    const cmd = normalized.split(/\s+/)[0].toLowerCase();
    commands[cmd] = (commands[cmd] || 0) + 1;

    if (!supported.has(cmd)) unsupported.push(line);
  }

  return { commands, unsupported };
}

export function diffCommandCounts(before, after) {
  const all = new Set([
    ...Object.keys(before.commands),
    ...Object.keys(after.commands)
  ]);

  const changed = {};

  for (const key of all) {
    const a = before.commands[key] || 0;
    const b = after.commands[key] || 0;

    if (a !== b) {
      changed[key] = {
        before: a,
        after: b,
        delta: b - a
      };
    }
  }

  return changed;
}
