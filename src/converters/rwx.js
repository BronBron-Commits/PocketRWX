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


    function addBlock(sx, sy, sz) {
      const base = vertices.length;
      const hx = sx / 2;
      const hy = sy / 2;
      const hz = sz / 2;

      const corners = [
        [-hx, -hy, -hz], [hx, -hy, -hz], [hx, hy, -hz], [-hx, hy, -hz],
        [-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]
      ];

      for (const c of corners) {
        const v = new THREE.Vector3(c[0], c[1], c[2]);
        v.applyMatrix4(transformStack[transformStack.length - 1]);
        vertices.push([v.x, v.y, v.z]);
        uvs.push([0, 0]);
      }

      for (const t of [
        [0,1,2],[0,2,3],
        [4,6,5],[4,7,6],
        [0,4,5],[0,5,1],
        [1,5,6],[1,6,2],
        [2,6,7],[2,7,3],
        [3,7,4],[3,4,0]
      ]) {
        faces.push([base + t[0], base + t[1], base + t[2]]);
      }
    }
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


      if (cmd === "block") {
        addBlock(Number(parts[1]), Number(parts[2]), Number(parts[3]));
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

  const rwxMetadata = {
    transforms:
      parseTransformMetadata(text)
  };

  root.userData.rwx = rwxMetadata;
  root.userData.gltfExtensions = {
    EXT_pocket_rwx: rwxMetadata
  };

  root.add(mesh);

  return root;
}

export function threeToRWX(root) {
  const lines = [];

  lines.push("ModelBegin");
  lines.push("ClumpBegin");

  const rwxMeta =
    root.userData?.rwx ||
    root.userData?.gltfExtensions?.EXT_pocket_rwx ||
    {};

  const transformBlocks =
    rwxMeta.transforms || [];

  const sidecarMode =
    rwxMeta.sidecarMode ||
    rwxMeta.mode ||
    "structural";

  if (sidecarMode === "structural") {
    for (const block of transformBlocks) {
      lines.push("TransformBegin");

      for (const line of block) {
        lines.push(line);
      }

      lines.push("TransformEnd");
    }
  } else if (transformBlocks.length) {
    lines.push("# PocketRWX: original transforms were baked into vertex positions");
    lines.push("# PocketRWX: sidecar mode = baked");

    for (const block of transformBlocks) {
      for (const line of block) {
        lines.push(`# original ${line}`);
      }
    }
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

      const materials =
        Array.isArray(obj.material)
          ? obj.material
          : [obj.material];

      const writeMaterial = mat => {
        const color =
          mat?.color ||
          new THREE.Color(0.8, 0.8, 0.8);

        const rwx =
          mat?.userData?.rwx || {};

        if (rwx.texture) {
          lines.push(`Texture ${rwx.texture}`);
        }

        if (rwx.surface) {
          lines.push(`Surface ${rwx.surface.join(" ")}`);
        }

        if (
          typeof rwx.opacity === "number" &&
          rwx.opacity < 1
        ) {
          lines.push(`Opacity ${rwx.opacity}`);
        }

        lines.push(`Color ${color.r} ${color.g} ${color.b}`);
      };

      const writeTriangle = (a, b, c) => {
        lines.push(
          `Triangle ${a + vertexOffset} ${b + vertexOffset} ${c + vertexOffset}`
        );
      };

      for (
        let i = 0;
        i < position.count;
        i++
      ) {
        const x = position.getX(i);
        const y = position.getY(i);
        const z = position.getZ(i);

        if (uv) {
          lines.push(
            `Vertex ${x} ${y} ${z} UV ${uv.getX(i)} ${uv.getY(i)}`
          );
        } else {
          lines.push(`Vertex ${x} ${y} ${z}`);
        }
      }

      const groups =
        geometry.groups && geometry.groups.length
          ? geometry.groups
          : [{
              start: 0,
              count: index ? index.count : position.count,
              materialIndex: 0
            }];

      for (const group of groups) {
        writeMaterial(materials[group.materialIndex] || materials[0]);

        const groupEnd = group.start + group.count;

        if (index) {
          for (let i = group.start; i < groupEnd; i += 3) {
            writeTriangle(
              index.getX(i),
              index.getX(i + 1),
              index.getX(i + 2)
            );
          }
        } else {
          for (let i = group.start; i < groupEnd; i += 3) {
            writeTriangle(i, i + 1, i + 2);
          }
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
