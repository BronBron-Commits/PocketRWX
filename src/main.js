import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080808);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.01, 5000);
camera.position.set(0, 1.2, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 2.5));

const dir = new THREE.DirectionalLight(0xffffff, 1.5);
dir.position.set(3, 5, 4);
scene.add(dir);

const grid = new THREE.GridHelper(10, 10);
scene.add(grid);

let modelRoot = new THREE.Group();
modelRoot.name = "PocketRWX_Model";
scene.add(modelRoot);

let currentFileName = "pocket-rwx";
let lastStats = null;

const info = document.querySelector("#info");

function numberOr(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeColorPart(v) {
  const n = numberOr(v, 1);
  return n > 1 ? Math.max(0, Math.min(255, n)) / 255 : Math.max(0, Math.min(1, n));
}

function materialKey(state) {
  return JSON.stringify({
    color: state.color,
    opacity: state.opacity,
    ambient: state.ambient,
    diffuse: state.diffuse,
    specular: state.specular,
    texture: state.texture || ""
  });
}

function makeMaterial(state) {
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(state.color[0], state.color[1], state.color[2]),
    roughness: 0.75,
    metalness: 0.05,
    side: THREE.DoubleSide,
    transparent: state.opacity < 1,
    opacity: state.opacity
  });

  mat.name = state.texture ? `rwx_mat_${state.texture}` : "rwx_mat";
  mat.userData = {
    rwx: {
      texture: state.texture || null,
      ambient: state.ambient,
      diffuse: state.diffuse,
      specular: state.specular
    }
  };

  return mat;
}

function identityState() {
  return {
    color: [0.8, 0.8, 0.8],
    opacity: 1,
    ambient: 0.2,
    diffuse: 0.8,
    specular: 0,
    texture: null
  };
}

function stripComment(line) {
  const hash = line.indexOf("#");
  return hash >= 0 ? line.slice(0, hash) : line;
}

function parseVertexParts(parts) {
  const x = numberOr(parts[1]);
  const y = numberOr(parts[2]);
  const z = numberOr(parts[3]);

  let u = 0;
  let v = 0;

  const uvIndex = parts.findIndex(p => p.toLowerCase() === "uv");
  if (uvIndex >= 0) {
    u = numberOr(parts[uvIndex + 1]);
    v = numberOr(parts[uvIndex + 2]);
  }

  return { x, y, z, u, v };
}

function parseRWX(text) {
  const vertices = [];
  const faces = [];
  const warnings = [];

  let state = identityState();
  const materialStates = new Map();

  const lines = text.split(/\r?\n/);

  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const raw = stripComment(lines[lineNo]).trim();
    if (!raw) continue;

    const parts = raw.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    if (
      cmd === "modelbegin" ||
      cmd === "modelend" ||
      cmd === "clumpbegin" ||
      cmd === "clumpend" ||
      cmd === "transformbegin" ||
      cmd === "transformend" ||
      cmd === "prototype" ||
      cmd === "protoinstance"
    ) {
      continue;
    }

    if (cmd === "color") {
      state.color = [
        normalizeColorPart(parts[1]),
        normalizeColorPart(parts[2]),
        normalizeColorPart(parts[3])
      ];
      continue;
    }

    if (cmd === "opacity") {
      state.opacity = Math.max(0, Math.min(1, numberOr(parts[1], 1)));
      continue;
    }

    if (cmd === "surface") {
      state.ambient = numberOr(parts[1], state.ambient);
      state.diffuse = numberOr(parts[2], state.diffuse);
      state.specular = numberOr(parts[3], state.specular);
      continue;
    }

    if (cmd === "texture") {
      state.texture = parts[1] || null;
      continue;
    }

    if (cmd === "vertex" || cmd === "vertexext") {
      vertices.push(parseVertexParts(parts));
      continue;
    }

    if (cmd === "triangle") {
      const ids = parts.slice(1, 4).map(v => Number(v) - 1);
      faces.push({ ids, key: materialKey(state) });
      materialStates.set(materialKey(state), structuredClone(state));
      continue;
    }

    if (cmd === "quad") {
      const ids = parts.slice(1, 5).map(v => Number(v) - 1);
      faces.push({ ids, key: materialKey(state) });
      materialStates.set(materialKey(state), structuredClone(state));
      continue;
    }

    if (cmd === "polygon") {
      let ids;

      const count = Number(parts[1]);
      if (Number.isFinite(count)) {
        ids = parts.slice(2, 2 + count).map(v => Number(v) - 1);
      } else {
        ids = parts.slice(1).map(v => Number(v) - 1);
      }

      faces.push({ ids, key: materialKey(state) });
      materialStates.set(materialKey(state), structuredClone(state));
      continue;
    }

    warnings.push(`Line ${lineNo + 1}: unsupported command "${parts[0]}"`);
  }

  return { vertices, faces, materialStates, warnings };
}

function buildMeshGroup(parsed) {
  const group = new THREE.Group();
  group.name = currentFileName.replace(/\.[^.]+$/, "") || "RWX_Model";

  const buckets = new Map();

  for (const face of parsed.faces) {
    if (!buckets.has(face.key)) {
      buckets.set(face.key, []);
    }
    buckets.get(face.key).push(face.ids);
  }

  for (const [key, bucketFaces] of buckets.entries()) {
    const positions = [];
    const uvs = [];
    const indices = [];

    function pushVertex(idx) {
      const v = parsed.vertices[idx];
      if (!v) return null;

      const outIndex = positions.length / 3;
      positions.push(v.x, v.y, v.z);
      uvs.push(v.u, v.v);
      return outIndex;
    }

    for (const ids of bucketFaces) {
      if (ids.length < 3) continue;

      const local = ids.map(pushVertex);
      if (local.some(v => v === null)) continue;

      for (let i = 1; i < local.length - 1; i++) {
        indices.push(local[0], local[i], local[i + 1]);
      }
    }

    if (!positions.length || !indices.length) continue;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();

    const matState = parsed.materialStates.get(key) || identityState();
    const mesh = new THREE.Mesh(geo, makeMaterial(matState));
    mesh.name = "rwx_mesh";
    group.add(mesh);
  }

  return group;
}

function fitCameraToObject(object) {
  const box = new THREE.Box3().setFromObject(object);

  if (box.isEmpty()) {
    camera.position.set(0, 1.2, 4);
    camera.lookAt(0, 0.5, 0);
    return;
  }

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);

  object.position.sub(center);

  const dist = maxDim * 1.75;
  camera.position.set(0, maxDim * 0.45, dist);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

function loadRWX(text, name = "model.rwx") {
  currentFileName = name;

  modelRoot.clear();
  modelRoot.rotation.set(0, 0, 0);
  modelRoot.position.set(0, 0, 0);

  const parsed = parseRWX(text);
  const group = buildMeshGroup(parsed);

  modelRoot.add(group);
  fitCameraToObject(modelRoot);

  const triCount = group.children.reduce((sum, mesh) => {
    return sum + (mesh.geometry.index ? mesh.geometry.index.count / 3 : 0);
  }, 0);

  lastStats = {
    verts: parsed.vertices.length,
    faces: parsed.faces.length,
    tris: triCount,
    meshes: group.children.length,
    warnings: parsed.warnings.length
  };

  info.textContent =
    `${lastStats.verts} verts, ${lastStats.faces} faces, ${lastStats.tris} tris, ${lastStats.meshes} meshes` +
    (lastStats.warnings ? `, ${lastStats.warnings} warnings` : "");

  if (parsed.warnings.length) {
    console.warn("PocketRWX parser warnings:", parsed.warnings);
  }
}

function exportGLB() {
  if (!modelRoot.children.length) {
    info.textContent = "No RWX loaded yet.";
    return;
  }

  const exportRoot = modelRoot.clone(true);
  exportRoot.name = currentFileName.replace(/\.[^.]+$/, "") || "PocketRWX_Model";

  const exporter = new GLTFExporter();

  exporter.parse(
    exportRoot,
    result => {
      const blob = result instanceof ArrayBuffer
        ? new Blob([result], { type: "model/gltf-binary" })
        : new Blob([JSON.stringify(result, null, 2)], { type: "model/gltf+json" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentFileName.replace(/\.[^.]+$/, "") || "pocket-rwx"}.glb`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      info.textContent = `Exported ${a.download}`;
    },
    error => {
      console.error(error);
      info.textContent = "GLB export failed. Check console.";
    },
    { binary: true }
  );
}

const sampleRWX = `
ModelBegin
ClumpBegin
Surface 0.2 0.8 0.1
Color 0.2 0.7 1.0
Vertex -0.5 0 0 UV 0 1
Vertex -0.5 1 0 UV 0 0
Vertex 0.5 1 0 UV 1 0
Vertex 0.5 0 0 UV 1 1
Quad 1 2 3 4
Color 1.0 0.35 0.1
Vertex 0 1.35 0 UV 0.5 0
Triangle 2 5 3
ClumpEnd
ModelEnd
`;

document.querySelector("#sample").onclick = () => loadRWX(sampleRWX, "sample.rwx");
document.querySelector("#exportGlb").onclick = exportGLB;

document.querySelector("#resetView").onclick = () => {
  modelRoot.rotation.set(0, 0, 0);
  fitCameraToObject(modelRoot);
};

document.querySelector("#file").onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;
  loadRWX(await file.text(), file.name);
};

addEventListener("dragover", e => {
  e.preventDefault();
});

addEventListener("drop", async e => {
  e.preventDefault();
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  loadRWX(await file.text(), file.name);
});

let dragging = false;
let lastX = 0;
let lastY = 0;
let pinchDistance = 0;

renderer.domElement.addEventListener("pointerdown", e => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  renderer.domElement.setPointerCapture?.(e.pointerId);
});

renderer.domElement.addEventListener("pointerup", e => {
  dragging = false;
  pinchDistance = 0;
  renderer.domElement.releasePointerCapture?.(e.pointerId);
});

renderer.domElement.addEventListener("pointercancel", () => {
  dragging = false;
  pinchDistance = 0;
});

renderer.domElement.addEventListener("pointermove", e => {
  if (!dragging) return;

  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;

  modelRoot.rotation.y += dx * 0.01;
  modelRoot.rotation.x += dy * 0.01;
});

renderer.domElement.addEventListener("wheel", e => {
  e.preventDefault();
  camera.position.multiplyScalar(1 + e.deltaY * 0.001);
  camera.position.z = Math.max(0.05, Math.min(5000, camera.position.z));
}, { passive: false });

addEventListener("touchmove", e => {
  if (e.touches.length !== 2) return;

  const a = e.touches[0];
  const b = e.touches[1];
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (pinchDistance > 0) {
    const scale = pinchDistance / dist;
    camera.position.multiplyScalar(scale);
  }

  pinchDistance = dist;
}, { passive: true });

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

loadRWX(sampleRWX, "sample.rwx");

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
