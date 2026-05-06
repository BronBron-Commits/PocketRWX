import { parseTransformMetadata } from "./transform_metadata.js";

export function buildRWXSidecar(text) {
  return {
    version: 1,
    format: "PocketRWXSidecar",
    mode: "baked",
    rwx: {
      transforms: parseTransformMetadata(text)
    }
  };
}

export function applySidecarToThree(root, sidecar) {
  root.userData.rwx = {
    ...(root.userData.rwx || {}),
    ...(sidecar?.rwx || {}),
    sidecarMode: sidecar?.mode || "baked"
  };

  root.userData.gltfExtensions = {
    ...(root.userData.gltfExtensions || {}),
    EXT_pocket_rwx: {
      mode: sidecar?.mode || "baked",
      ...(sidecar?.rwx || {})
    }
  };

  return root;
}
