export function parseTransformMetadata(text) {
  const transforms = [];
  const stack = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const parts = line.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    if (cmd === "transformbegin") {
      stack.push([]);
      continue;
    }

    if (cmd === "transformend") {
      const block = stack.pop();

      if (block && block.length) {
        transforms.push(block);
      }

      continue;
    }

    if (
      stack.length &&
      (
        cmd === "translate" ||
        cmd === "rotate" ||
        cmd === "scale"
      )
    ) {
      stack[stack.length - 1].push(line);
    }
  }

  return transforms;
}
