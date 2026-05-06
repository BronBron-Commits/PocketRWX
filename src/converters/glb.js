import { Blob } from "buffer";

globalThis.Blob ??= Blob;

if (!globalThis.FileReader) {
  globalThis.FileReader = class FileReader {
    constructor() {
      this.result = null;
      this.onloadend = null;
    }

    async readAsArrayBuffer(blob) {
      this.result = await blob.arrayBuffer();

      if (this.onloadend) {
        this.onloadend();
      }
    }

    async readAsDataURL(blob) {
      const buffer = Buffer.from(
        await blob.arrayBuffer()
      );

      this.result =
        "data:application/octet-stream;base64," +
        buffer.toString("base64");

      if (this.onloadend) {
        this.onloadend();
      }
    }
  };
}

import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export function threeToGLB(object3d) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();

    exporter.parse(
      object3d,
      result => resolve(result),
      error => reject(error),
      { binary: true }
    );
  });
}

export function glbToThree(arrayBuffer) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    loader.parse(
      arrayBuffer,
      "",
      gltf => resolve(gltf.scene),
      error => reject(error)
    );
  });
}
