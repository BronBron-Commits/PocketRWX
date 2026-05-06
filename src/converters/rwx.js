import * as THREE from "three";
import { parseTransformMetadata } from "../../tools/transform_metadata.js";

export function parseRWX(text) {
  const vertices = [];
  const uvs = [];
  const faces = [];

  let color = [0.8, 0.8, 0.8];
  let texture = null;
  let surface = null;
  let opacity = 1;

  const transformStack = [
    new THREE.Matrix4()
  ];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const parts = line.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    if (cmd === "transformbegin") {
      transformStack.push(
        transformStack[
          transformStack.length - 1
        ].clone()
      );
      continue;
    }

    if (cmd === "transformend") {
      if (transformStack.length > 1) {
        transformStack.pop();
      }
      continue;
    }

    if (cmd === "translate") {
      const m =
        new THREE.Matrix4()
          .makeTranslation(
            Number(parts[1]),
            Number(parts[2]),
            Number(parts[3])
          );

      transformStack[
        transformStack.length - 1
      ].multiply(m);

      continue;
    }

    if (cmd === "scale") {
      const m =
        new THREE.Matrix4()
          .makeScale(
            Number(parts[1]),
            Number(parts[2]),
            Number(parts[3])
          );

      transformStack[
        transformStack.length - 1
      ].multiply(m);

      continue;
    }

    if (cmd === "rotate") {
      let m;

      if (parts.length >= 5) {
        const axis =
          new THREE.Vector3(
            Number(parts[1]),
            Number(parts[2]),
            Number(parts[3])
          ).normalize();

        const angle =
          THREE.MathUtils.degToRad(
            Number(parts[4])
          );

        m =
          new THREE.Matrix4()
            .makeRotationAxis(
              axis,
              angle
            );
      } else {
        const rx =
          THREE.MathUtils.degToRad(
            Number(parts[1])
          );

        const ry =
          THREE.MathUtils.degToRad(
            Number(parts[2])
          );

        const rz =
          THREE.MathUtils.degToRad(
            Number(parts[3])
          );

        m =
          new THREE.Matrix4()
            .makeRotationFromEuler(
              new THREE.Euler(
                rx,
                ry,
                rz,
                "XYZ"
              )
            );
      }

      transformStack[
        transformStack.length - 1
      ].multiply(m);

      continue;
    }

    if (cmd === "texture") {
      texture =
        parts
          .slice(1)
          .join(" ") || null;

      continue;
    }

    if (cmd === "surface") {
      surface =
        parts
          .slice(1)
          .map(Number);

      continue;
    }

    if (cmd === "opacity") {
      opacity =
        Number(parts[1]);

      continue;
    }

    if (cmd === "color") {
      color =
        parts
          .slice(1, 4)
          .map(Number);

      continue;
    }

    if (
      cmd === "vertex" ||
      cmd === "vertexext"
    ) {
      const v =
        new THREE.Vector3(
          Number(parts[1]),
          Number(parts[2]),
          Number(parts[3])
        );

      v.applyMatrix4(
        transformStack[
          transformStack.length - 1
        ]
      );

      vertices.push([
        v.x,
        v.y,
        v.z
      ]);

      const uvIndex =
        parts.findIndex(
          p =>
            p.toLowerCase() ===
            "uv"
        );

      if (uvIndex >= 0) {
        uvs.push([
          Number(
            parts[uvIndex + 1]
          ),
          Number(
            parts[uvIndex + 2]
          )
        ]);
      } else {
        uvs.push([0, 0]);
      }

      continue;
    }

    if (cmd === "triangle") {
      faces.push([
        Number(parts[1]) - 1,
        Number(parts[2]) - 1,
        Number(parts[3]) - 1
      ]);

      continue;
    }

    if (cmd === "quad") {
      const a =
        Number(parts[1]) - 1;

      const b =
        Number(parts[2]) - 1;

      const c =
        Number(parts[3]) - 1;

      const d =
        Number(parts[4]) - 1;

      faces.push([a, b, c]);
      faces.push([a, c, d]);

      continue;
    }

    if (cmd === "polygon") {
      const n =
        Number(parts[1]);

      const ids =
        parts
          .slice(2, 2 + n)
          .map(
            v => Number(v) - 1
          );

      for (
        let i = 1;
        i < ids.length - 1;
        i++
      ) {
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
    color,
    texture,
    surface,
    opacity
  };
}

export function rwxToThree(text) {
  const data = parseRWX(text);

  const positions = [];
  const uvFlat = [];
  const indices = [];

  for (const v of data.vertices) {
    positions.push(
      v[0],
      v[1],
      v[2]
    );
  }

  for (const uv of data.uvs) {
    uvFlat.push(
      uv[0],
      uv[1]
    );
  }

  for (const f of data.faces) {
    indices.push(
      f[0],
      f[1],
      f[2]
    );
  }

  const geometry =
    new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      positions,
      3
    )
  );

  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(
      uvFlat,
      2
    )
  );

  geometry.setIndex(indices);

  geometry.computeVertexNormals();

  const material =
    new THREE.MeshStandardMaterial({
      color:
        new THREE.Color(
          data.color[0],
          data.color[1],
          data.color[2]
        ),
      side:
        THREE.DoubleSide,
      transparent:
        data.opacity < 1,
      opacity:
        data.opacity
    });

  material.userData.rwx = {
    texture: data.texture,
    surface: data.surface,
    opacity: data.opacity
  };

  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  mesh.name = "RWX_Mesh";

  const root =
    new THREE.Group();

  root.name = "RWX_Root";

  root.userData.rwx = {
    transforms:
      parseTransformMetadata(text)
  };

  root.add(mesh);

  return root;
}

export function threeToRWX(root) {
  const lines = [];

  lines.push("ModelBegin");
  lines.push("ClumpBegin");

  const transformBlocks =
    root.userData?.rwx?.transforms || [];

  for (const block of transformBlocks) {
    lines.push("TransformBegin");

    for (const line of block) {
      lines.push(line);
    }

    lines.push("TransformEnd");
  }

  let vertexOffset = 1;

  root.updateMatrixWorld(true);

  root.traverse(obj => {
    if (
      !obj.isMesh ||
      !obj.geometry
    ) {
      return;
    }

    const geometry =
      obj.geometry.clone();

    geometry.applyMatrix4(
      obj.matrixWorld
    );

    const position =
      geometry.getAttribute(
        "position"
      );

    const uv =
      geometry.getAttribute("uv");

    const index =
      geometry.getIndex();

    const mat =
      Array.isArray(
        obj.material
      )
        ? obj.material[0]
        : obj.material;

    const color =
      mat?.color ||
      new THREE.Color(
        0.8,
        0.8,
        0.8
      );

    const rwx =
      mat?.userData?.rwx || {};

    if (rwx.texture) {
      lines.push(
        `Texture ${rwx.texture}`
      );
    }

    if (rwx.surface) {
      lines.push(
        `Surface ${rwx.surface.join(" ")}`
      );
    }

    if (
      typeof rwx.opacity === "number" &&
      rwx.opacity < 1
    ) {
      lines.push(
        `Opacity ${rwx.opacity}`
      );
    }

    lines.push(
      `Color ${color.r} ${color.g} ${color.b}`
    );

    for (
      let i = 0;
      i < position.count;
      i++
    ) {
      const x =
        position.getX(i);

      const y =
        position.getY(i);

      const z =
        position.getZ(i);

      if (uv) {
        const u =
          uv.getX(i);

        const v =
          uv.getY(i);

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
      for (
        let i = 0;
        i < index.count;
        i += 3
      ) {
        lines.push(
          `Triangle ${
            index.getX(i) +
            vertexOffset
          } ${
            index.getX(i + 1) +
            vertexOffset
          } ${
            index.getX(i + 2) +
            vertexOffset
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

    vertexOffset +=
      position.count;
  });

  lines.push("ClumpEnd");
  lines.push("ModelEnd");

  return (
    lines.join("\n") + "\n"
  );
}
