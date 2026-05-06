export function classifyCommandLoss(commandLoss) {
  const acceptable = {};
  const real = {};

  for (const [cmd, change] of Object.entries(commandLoss)) {
    if (
      cmd === "quad" ||
      cmd === "polygon" ||
      cmd === "triangle" ||
      cmd === "transformbegin" ||
      cmd === "transformend"
    ) {
      acceptable[cmd] = {
        ...change,
        reason:
          cmd === "transformbegin" || cmd === "transformend"
            ? "transform block markers are represented by baked sidecar metadata"
            : "faces are triangulated for GLB compatibility"
      };
    } else {
      real[cmd] = change;
    }
  }

  return {
    acceptable,
    real
  };
}
