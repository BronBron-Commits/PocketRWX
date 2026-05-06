import { parseTransformMetadata } from "./transform_metadata.js";

export function buildRWXSidecar(text) {
  return {
    version: 1,
    format: "PocketRWXSidecar",
    rwx: {
      transforms: parseTransformMetadata(text)
    }
  };
}

export function applySidecarToThree(root, sidecar) {
  root.userData.rwx = {
    ...(root.userData.rwx || {}),
    ...(sidecar?.rwx || {})
  };

  root.userData.gltfExtensions = {
    ...(root.userData.gltfExtensions || {}),
    EXT_pocket_rwx: sidecar?.rwx || {}
  };

  return root;
}
