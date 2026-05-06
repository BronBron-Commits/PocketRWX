import * as THREE from "three";

export function parseRWX(text) {
  const vertices = [];
  const uvs = [];
  const faces = [];
  let color = [0.8, 0.8, 0.8];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();

    if (!line || line.startsWith("#")) continue;

    const parts = line.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    if (cmd === "color") {
      color = parts.slice(1, 4).map(Number);
    }

    if (cmd === "vertex" || cmd === "vertexext") {
      vertices.push([
        Number(parts[1]),
        Number(parts[2]),
        Number(parts[3])
      ]);

      const uvIndex = parts.findIndex(
        p => p.toLowerCase() === "uv"
      );

      if (uvIndex >= 0) {
        uvs.push([
          Number(parts[uvIndex + 1]),
          Number(parts[uvIndex + 2])
        ]);
      } else {
        uvs.push([0, 0]);
      }
    }

    if (cmd === "triangle") {
      faces.push([
        Number(parts[1]) - 1,
        Number(parts[2]) - 1,
        Number(parts[3]) - 1
      ]);
    }

    if (cmd === "quad") {
      const a = Number(parts[1]) - 1;
      const b = Number(parts[2]) - 1;
      const c = Number(parts[3]) - 1;
      const d = Number(parts[4]) - 1;

      faces.push([a, b, c]);
      faces.push([a, c, d]);
    }

    if (cmd === "polygon") {
      const n = Number(parts[1]);

      const ids = parts
        .slice(2, 2 + n)
        .map(v => Number(v) - 1);

      for (let i = 1; i < ids.length - 1; i++) {
        faces.push([
          ids[0],
          ids[i],
          ids[i + 1]
        ]);
      }
    }
  }

  return {
    vertices,
    uvs,
    faces,
    color
  };
}

export function rwxToThree(text) {
  const data = parseRWX(text);

  const positions = [];
  const uvFlat = [];
  const indices = [];

  for (const v of data.vertices) {
    positions.push(v[0], v[1], v[2]);
  }

  for (const uv of data.uvs) {
    uvFlat.push(uv[0], uv[1]);
  }

  for (const f of data.faces) {
    indices.push(f[0], f[1], f[2]);
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(uvFlat, 2)
  );

  geometry.setIndex(indices);

  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(
      data.color[0],
      data.color[1],
      data.color[2]
    ),
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(
    geometry,
    material
  );

  mesh.name = "RWX_Mesh";

  const root = new THREE.Group();
  root.name = "RWX_Root";

  root.add(mesh);

  return root;
}

export function threeToRWX(root) {
  const lines = [];

  lines.push("ModelBegin");
  lines.push("ClumpBegin");

  let vertexOffset = 1;

  root.updateMatrixWorld(true);

  root.traverse(obj => {
    if (!obj.isMesh || !obj.geometry) {
      return;
    }

    const geometry = obj.geometry.clone();

    geometry.applyMatrix4(obj.matrixWorld);

    const position =
      geometry.getAttribute("position");

    const uv =
      geometry.getAttribute("uv");

    const index =
      geometry.getIndex();

    const mat = Array.isArray(obj.material)
      ? obj.material[0]
      : obj.material;

    const color =
      mat?.color ||
      new THREE.Color(0.8, 0.8, 0.8);

    lines.push(
      `Color ${color.r} ${color.g} ${color.b}`
    );

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);

      if (uv) {
        const u = uv.getX(i);
        const v = uv.getY(i);

        lines.push(
          `Vertex ${x} ${y} ${z} UV ${u} ${v}`
        );
      } else {
        lines.push(
          `Vertex ${x} ${y} ${z}`
        );
      }
    }

    if (index) {
      for (let i = 0; i < index.count; i += 3) {
        lines.push(
          `Triangle ${
            index.getX(i) + vertexOffset
          } ${
            index.getX(i + 1) + vertexOffset
          } ${
            index.getX(i + 2) + vertexOffset
          }`
        );
      }
    } else {
      for (
        let i = 0;
        i < position.count;
        i += 3
      ) {
        lines.push(
          `Triangle ${
            i + vertexOffset
          } ${
            i + 1 + vertexOffset
          } ${
            i + 2 + vertexOffset
          }`
        );
      }
    }

    vertexOffset += position.count;
  });

  lines.push("ClumpEnd");
  lines.push("ModelEnd");

  return lines.join("\n") + "\n";
}
