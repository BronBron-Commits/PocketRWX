export function classifyCommandLoss(commandLoss) {
  const acceptable = {};
  const real = {};

  for (const [cmd, change] of Object.entries(commandLoss)) {
    if (
      cmd === "quad" ||
      cmd === "polygon" ||
      cmd === "triangle"
    ) {
      acceptable[cmd] = {
        ...change,
        reason: "faces are triangulated for GLB compatibility"
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
