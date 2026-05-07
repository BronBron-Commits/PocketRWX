export function classifyCommandLoss(commandLoss) {
  const acceptable = {};
  const real = {};

  for (const [cmd, change] of Object.entries(commandLoss)) {
    if (
      cmd === "quad" ||
      cmd === "polygon" ||
      cmd === "triangle" ||
      cmd === "block" ||
      cmd === "sphere" ||
      cmd === "cylinder" ||
      cmd === "cone" ||
      cmd === "disc" ||
      cmd === "hemisphere" ||
      cmd === "vertex" ||
      cmd === "block" ||
      cmd === "sphere" ||
      cmd === "cylinder" ||
      cmd === "cone" ||
      cmd === "disc" ||
      cmd === "hemisphere" ||
      cmd === "vertex" ||
      cmd === "transformbegin" ||
      cmd === "transformend"
    ) {
      acceptable[cmd] = {
        ...change,
        reason:
          cmd === "transformbegin" || cmd === "transformend"
            ? "transform block markers are represented by baked sidecar metadata"
            : cmd === "block" ||
              cmd === "sphere" ||
              cmd === "cylinder" ||
              cmd === "cone" ||
              cmd === "disc" ||
              cmd === "hemisphere" ||
              cmd === "vertex"
            ? "RWX primitives are baked into explicit mesh geometry"
            : cmd === "block" ||
              cmd === "sphere" ||
              cmd === "cylinder" ||
              cmd === "cone" ||
              cmd === "disc" ||
              cmd === "hemisphere" ||
              cmd === "vertex"
            ? "RWX primitives are baked into explicit mesh geometry"
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
