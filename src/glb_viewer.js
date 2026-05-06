import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const debug = document.querySelector("#debug");
const log = m => debug.innerText = m;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080808);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.01, 1000);
camera.position.set(0, 1.2, 3);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 2.5));
scene.add(new THREE.GridHelper(10,10));

const viewRoot = new THREE.Group();
const modelRoot = new THREE.Group();
viewRoot.add(modelRoot);
scene.add(viewRoot);

function downloadText(text, filename) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function centerModel() {
  viewRoot.rotation.set(0,0,0);
  viewRoot.position.set(0,0,0);

  const box = new THREE.Box3().setFromObject(modelRoot);
  const center = box.getCenter(new THREE.Vector3());
  modelRoot.position.sub(center);

  const size = box.getSize(new THREE.Vector3()).length();
  camera.position.z = Math.max(2, size * 1.4);

  log("loaded GLB");
}

function loadGLBFromURL(url) {
  modelRoot.clear();
  modelRoot.position.set(0,0,0);

  new GLTFLoader().load(
    url,
    gltf => {
      modelRoot.add(gltf.scene);
      centerModel();
    },
    undefined,
    err => {
      console.error(err);
      log("failed to load GLB");
    }
  );
}

function loadGLBFromFile(file) {
  loadGLBFromURL(URL.createObjectURL(file));
}

function colorFromMaterial(mat) {
  if (Array.isArray(mat)) mat = mat[0];
  if (!mat || !mat.color) return [0.8, 0.8, 0.8];
  return [mat.color.r, mat.color.g, mat.color.b];
}

function exportRWX() {
  let out = "ModelBegin\nClumpBegin\n\n";
  let offset = 0;
  let meshes = 0;
  let tris = 0;

  modelRoot.updateWorldMatrix(true, true);

  modelRoot.traverse(obj => {
    if (!obj.isMesh || !obj.geometry) return;

    const geo = obj.geometry;
    const pos = geo.attributes.position;
    if (!pos) return;

    const uv = geo.attributes.uv;
    const idx = geo.index;
    const color = colorFromMaterial(obj.material);

    out += `Color ${color[0].toFixed(4)} ${color[1].toFixed(4)} ${color[2].toFixed(4)}\n`;

    obj.updateWorldMatrix(true, false);

    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3(
        pos.getX(i),
        pos.getY(i),
        pos.getZ(i)
      ).applyMatrix4(obj.matrixWorld);

      if (uv) {
        out += `Vertex ${v.x.toFixed(6)} ${v.y.toFixed(6)} ${v.z.toFixed(6)} UV ${uv.getX(i).toFixed(6)} ${uv.getY(i).toFixed(6)}\n`;
      } else {
        out += `Vertex ${v.x.toFixed(6)} ${v.y.toFixed(6)} ${v.z.toFixed(6)}\n`;
      }
    }

    if (idx) {
      for (let i = 0; i < idx.count; i += 3) {
        out += `Triangle ${offset + idx.getX(i) + 1} ${offset + idx.getX(i+1) + 1} ${offset + idx.getX(i+2) + 1}\n`;
        tris++;
      }
    } else {
      for (let i = 0; i < pos.count; i += 3) {
        out += `Triangle ${offset+i+1} ${offset+i+2} ${offset+i+3}\n`;
        tris++;
      }
    }

    out += "\n";
    offset += pos.count;
    meshes++;
  });

  out += "ClumpEnd\nModelEnd\n";

  downloadText(out, "glb_export.rwx");
  log(`exported RWX meshes:${meshes} verts:${offset} tris:${tris}`);
}

const exportBtn = document.createElement("button");
exportBtn.textContent = "Export RWX";
exportBtn.style.position = "fixed";
exportBtn.style.top = "48px";
exportBtn.style.left = "8px";
exportBtn.style.zIndex = "20";
document.body.appendChild(exportBtn);
exportBtn.onclick = exportRWX;

document.querySelector("#file").onchange = e => {
  const file = e.target.files[0];
  if (file) loadGLBFromFile(file);
};

document.querySelector("#loadSample").onclick = () => {
  loadGLBFromURL("/pocketrwx_export.glb");
};

let drag=false,lx=0,ly=0;
renderer.domElement.onpointerdown=e=>{drag=true;lx=e.clientX;ly=e.clientY};
renderer.domElement.onpointerup=()=>drag=false;
renderer.domElement.onpointercancel=()=>drag=false;
renderer.domElement.onpointermove=e=>{
  if(!drag)return;
  viewRoot.rotation.y += (e.clientX-lx)*0.01;
  viewRoot.rotation.x += (e.clientY-ly)*0.01;
  lx=e.clientX; ly=e.clientY;
};

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

renderer.setAnimationLoop(()=>renderer.render(scene,camera));
