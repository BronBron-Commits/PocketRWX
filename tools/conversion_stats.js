import * as THREE from "three";

export function sceneStats(root) {
  let meshes = 0;
  let vertices = 0;
  let triangles = 0;
  const materials = new Set();

  root.updateMatrixWorld(true);

  const box = new THREE.Box3();

  root.traverse(obj => {
    if (!obj.isMesh || !obj.geometry) return;

    meshes++;

    const pos = obj.geometry.getAttribute("position");
    const idx = obj.geometry.getIndex();

    if (pos) vertices += pos.count;
    if (idx) triangles += idx.count / 3;
    else if (pos) triangles += pos.count / 3;

    if (Array.isArray(obj.material)) {
      for (const m of obj.material) materials.add(m.uuid);
    } else if (obj.material) {
      materials.add(obj.material.uuid);
    }

    box.expandByObject(obj);
  });

  const size = box.getSize(new THREE.Vector3());

  return {
    meshes,
    vertices,
    triangles,
    materials: materials.size,
    bounds: {
      x: Number(size.x.toFixed(4)),
      y: Number(size.y.toFixed(4)),
      z: Number(size.z.toFixed(4))
    }
  };
}

export function compareStats(before, after) {
  return {
    meshes: [before.meshes, after.meshes],
    vertices: [before.vertices, after.vertices],
    triangles: [before.triangles, after.triangles],
    materials: [before.materials, after.materials],
    bounds: [before.bounds, after.bounds],
    pass:
      before.triangles === after.triangles &&
      before.vertices === after.vertices &&
      before.meshes === after.meshes
  };
}
