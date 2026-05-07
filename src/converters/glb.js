import { Blob } from "buffer";
import fs from "fs";

globalThis.Blob ??= Blob;
globalThis.self ??= globalThis;
globalThis.URL ??= URL;

globalThis.ProgressEvent ??= class ProgressEvent extends Event {
  constructor(type, props = {}) {
    super(type);
    this.lengthComputable = props.lengthComputable || false;
    this.loaded = props.loaded || 0;
    this.total = props.total || 0;
  }
};

const realFetch = globalThis.fetch;

globalThis.fetch = async function(input, init) {
  const url = String(input?.url || input);

  if (url.startsWith("file://")) {
    const filePath = decodeURIComponent(new URL(url).pathname);
    const data = fs.readFileSync(filePath);
    return new Response(data);
  }

  return realFetch(input, init);
};

if (!globalThis.FileReader) {
  globalThis.FileReader = class FileReader {
    constructor() {
      this.result = null;
      this.onloadend = null;
    }

    async readAsArrayBuffer(blob) {
      this.result = await blob.arrayBuffer();
      if (this.onloadend) this.onloadend();
    }

    async readAsDataURL(blob) {
      const buffer = Buffer.from(await blob.arrayBuffer());
      this.result =
        "data:application/octet-stream;base64," +
        buffer.toString("base64");
      if (this.onloadend) this.onloadend();
    }
  };
}

import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

export function threeToGLB(object3d) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();

    exporter.parse(
      object3d,
      result => resolve(result),
      error => reject(error),
      {
        binary: true,
        includeCustomExtensions: true
      }
    );
  });
}

export function glbToThree(arrayBuffer) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      new URL(
        "../../node_modules/three/examples/jsm/libs/draco/gltf/",
        import.meta.url
      ).href
    );
    dracoLoader.setDecoderConfig({ type: "js" });
    loader.setDRACOLoader(dracoLoader);

    const input =
      Buffer.isBuffer(arrayBuffer)
        ? arrayBuffer.buffer.slice(
            arrayBuffer.byteOffset,
            arrayBuffer.byteOffset + arrayBuffer.byteLength
          )
        : arrayBuffer;

    loader.parse(
      input,
      "",
      gltf => {
        const scene = gltf.scene;

        scene.userData.gltf = {
          asset: gltf.asset || null,
          parser: null
        };

        resolve(scene);
      },
      error => reject(error)
    );
  });
}
