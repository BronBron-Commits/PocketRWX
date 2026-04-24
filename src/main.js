import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080808);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.01, 1000);
camera.position.set(0, 1.2, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 2.5));

const grid = new THREE.GridHelper(10, 10);
scene.add(grid);

let modelRoot = new THREE.Group();
scene.add(modelRoot);

function parseRWX(text) {
  const vertices = [];
  const uvs = [];
  const indices = [];
  let color = [0.8, 0.8, 0.8];

  const lines = text.split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const parts = line.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    if (cmd === "color") {
      color = parts.slice(1, 4).map(Number);
    }

    if (cmd === "vertex" || cmd === "vertexext") {
      const x = Number(parts[1]);
      const y = Number(parts[2]);
      const z = Number(parts[3]);
      vertices.push(x, y, z);

      const uvIndex = parts.findIndex(p => p.toLowerCase() === "uv");
      if (uvIndex >= 0) {
        uvs.push(Number(parts[uvIndex + 1]), Number(parts[uvIndex + 2]));
      } else {
        uvs.push(0, 0);
      }
    }

    if (cmd === "triangle") {
      indices.push(
        Number(parts[1]) - 1,
        Number(parts[2]) - 1,
        Number(parts[3]) - 1
      );
    }

    if (cmd === "quad") {
      const a = Number(parts[1]) - 1;
      const b = Number(parts[2]) - 1;
      const c = Number(parts[3]) - 1;
      const d = Number(parts[4]) - 1;
      indices.push(a, b, c, a, c, d);
    }

    if (cmd === "polygon") {
      const n = Number(parts[1]);
      const ids = parts.slice(2, 2 + n).map(v => Number(v) - 1);
      for (let i = 1; i < ids.length - 1; i++) {
        indices.push(ids[0], ids[i], ids[i + 1]);
      }
    }
  }

  return { vertices, uvs, indices, color };
}

function loadRWX(text) {
  modelRoot.clear();

  const meshData = parseRWX(text);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(meshData.vertices, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(meshData.uvs, 2));
  geo.setIndex(meshData.indices);
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(meshData.color[0], meshData.color[1], meshData.color[2]),
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geo, mat);
  modelRoot.add(mesh);

  const box = new THREE.Box3().setFromObject(modelRoot);
  const center = box.getCenter(new THREE.Vector3());
  modelRoot.position.sub(center);

  document.querySelector("#info").textContent =
    `${meshData.vertices.length / 3} verts, ${meshData.indices.length / 3} tris`;
}

const sampleRWX = `
ModelBegin
ClumpBegin
Color 0.2 0.7 1.0
Vertex -0.5 0 0 UV 0 1
Vertex -0.5 1 0 UV 0 0
Vertex 0.5 1 0 UV 1 0
Vertex 0.5 0 0 UV 1 1
Quad 1 2 3 4
ClumpEnd
ModelEnd
`;

document.querySelector("#sample").onclick = () => loadRWX(sampleRWX);

document.querySelector("#file").onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;
  loadRWX(await file.text());
};

let dragging = false;
let lastX = 0;
let lastY = 0;

renderer.domElement.addEventListener("pointerdown", e => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});

renderer.domElement.addEventListener("pointerup", () => dragging = false);
renderer.domElement.addEventListener("pointercancel", () => dragging = false);

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
  camera.position.z += e.deltaY * 0.002;
  camera.position.z = Math.max(0.5, Math.min(20, camera.position.z));
});

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

loadRWX(sampleRWX);

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
