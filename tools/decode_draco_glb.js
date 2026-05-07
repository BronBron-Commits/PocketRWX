import { NodeIO } from "@gltf-transform/core";
import {
  KHRDracoMeshCompression,
  EXTTextureWebP
} from "@gltf-transform/extensions";
import draco3d from "draco3d";

const input = process.argv[2];
const output = process.argv[3];

if (!input || !output) {
  console.error("usage: node tools/decode_draco_glb.js <input.glb> <output.glb>");
  process.exit(1);
}

const decoder = await draco3d.createDecoderModule();
const encoder = await draco3d.createEncoderModule();

const io = new NodeIO()
  .registerExtensions([
    KHRDracoMeshCompression,
    EXTTextureWebP
  ])
  .registerDependencies({
    "draco3d.decoder": decoder,
    "draco3d.encoder": encoder
  });

const document = await io.read(input);

for (const ext of document.getRoot().listExtensionsUsed()) {
  if (ext.extensionName === "KHR_draco_mesh_compression") {
    ext.dispose();
  }
}

await io.write(output, document);

console.log(`decoded: ${output}`);
