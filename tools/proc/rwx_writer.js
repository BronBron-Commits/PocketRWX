import fs from "fs";

export class RWXWriter {
  constructor() {
    this.lines = ["ModelBegin"];
    this.vertexCount = 0;
    this.openClump = false;
  }

  beginClump() {
    this.lines.push("ClumpBegin");
    this.openClump = true;
  }

  endClump() {
    this.lines.push("ClumpEnd");
    this.openClump = false;
  }

  ensureClump() {
    if (!this.openClump) this.beginClump();
  }

  comment(text) {
    this.lines.push(`# ${text}`);
  }

  surface(a = 0.7, d = 0.9, s = 0.0) {
    this.ensureClump();
    this.lines.push(`Surface ${a} ${d} ${s}`);
  }

  ambient(v) {
    this.ensureClump();
    this.lines.push(`Ambient ${v}`);
  }

  diffuse(v) {
    this.ensureClump();
    this.lines.push(`Diffuse ${v}`);
  }

  specular(v) {
    this.ensureClump();
    this.lines.push(`Specular ${v}`);
  }

  opacity(v) {
    this.ensureClump();
    this.lines.push(`Opacity ${v}`);
  }

  texture(path) {
    this.ensureClump();
    this.lines.push(`Texture ${path}`);
  }

  textureAddressMode(mode = "wrap") {
    this.ensureClump();
    this.lines.push(`TextureAddressMode ${mode}`);
  }

  textureMode(mode = "lit") {
    this.ensureClump();
    this.lines.push(`TextureMode ${mode}`);
  }

  color(r, g, b) {
    this.ensureClump();
    this.lines.push(`Color ${r} ${g} ${b}`);
  }

  materialBegin() {
    this.ensureClump();
    this.lines.push("MaterialBegin");
  }

  materialEnd() {
    this.ensureClump();
    this.lines.push("MaterialEnd");
  }

  material(opts = {}) {
    this.materialBegin();

    if (opts.surface) this.surface(...opts.surface);
    if (opts.color) this.color(...opts.color);
    if (opts.texture) this.texture(opts.texture);
    if (opts.textureAddressMode) this.textureAddressMode(opts.textureAddressMode);
    if (opts.opacity !== undefined) this.opacity(opts.opacity);
    if (opts.ambient !== undefined) this.ambient(opts.ambient);
    if (opts.diffuse !== undefined) this.diffuse(opts.diffuse);
    if (opts.specular !== undefined) this.specular(opts.specular);

    this.materialEnd();
  }

  transformBegin() {
    this.ensureClump();
    this.lines.push("TransformBegin");
  }

  transformEnd() {
    this.ensureClump();
    this.lines.push("TransformEnd");
  }

  identity() {
    this.ensureClump();
    this.lines.push("Identity");
  }

  translate(x, y, z) {
    this.ensureClump();
    this.lines.push(`Translate ${x} ${y} ${z}`);
  }

  rotate(x, y, z, degrees) {
    this.ensureClump();
    this.lines.push(`Rotate ${x} ${y} ${z} ${degrees}`);
  }

  scale(x, y, z) {
    this.ensureClump();
    this.lines.push(`Scale ${x} ${y} ${z}`);
  }

  tag(value) {
    this.ensureClump();
    this.lines.push(`Tag ${value}`);
  }

  collision(on = true) {
    this.ensureClump();
    this.lines.push(`Collision ${on ? "on" : "off"}`);
  }

  seamless(on = true) {
    this.ensureClump();
    this.lines.push(`#! Seamless ${on ? "on" : "off"}`);
  }

  prelight(r, g, b) {
    return `#!prelight ${r} ${g} ${b}`;
  }

  vertex(x, y, z, u = null, v = null, extra = "") {
    this.ensureClump();
    this.vertexCount++;

    let line = `Vertex ${x} ${y} ${z}`;
    if (u !== null && v !== null) line += ` UV ${u} ${v}`;
    if (extra) line += ` ${extra}`;

    this.lines.push(line);
    return this.vertexCount;
  }

  tri(a, b, c, tag = null) {
    this.ensureClump();
    this.lines.push(`Triangle ${a} ${b} ${c}${tag !== null ? ` Tag ${tag}` : ""}`);
  }

  quad(a, b, c, d, tag = null) {
    this.ensureClump();
    this.tri(a, b, c, tag);
    this.tri(a, c, d, tag);
  }

  block(x, y, z) {
    this.ensureClump();
    this.lines.push(`Block ${x} ${y} ${z}`);
  }

  cone(h, r, n = 12) {
    this.ensureClump();
    this.lines.push(`Cone ${h} ${r} ${n}`);
  }

  cylinder(h, r1, r2 = r1, n = 12) {
    this.ensureClump();
    this.lines.push(`Cylinder ${h} ${r1} ${r2} ${n}`);
  }

  disc(v, r, n = 12) {
    this.ensureClump();
    this.lines.push(`Disc ${v} ${r} ${n}`);
  }

  sphere(r, d = 2) {
    this.ensureClump();
    this.lines.push(`Sphere ${r} ${d}`);
  }

  hemisphere(r, d = 2) {
    this.ensureClump();
    this.lines.push(`Hemisphere ${r} ${d}`);
  }

  protoBegin(name) {
    if (this.openClump) throw new Error("ProtoBegin cannot be inside ClumpBegin");
    this.lines.push(`ProtoBegin ${name}`);
    this.openClump = true;
  }

  protoEnd() {
    this.lines.push("ProtoEnd");
    this.openClump = false;
  }

  protoInstance(name) {
    this.ensureClump();
    this.lines.push(`ProtoInstance ${name}`);
  }

  protoInstanceGeometry(name) {
    this.ensureClump();
    this.lines.push(`ProtoInstanceGeometry ${name}`);
  }

  save(path) {
    if (this.openClump) this.endClump();
    this.lines.push("ModelEnd", "");
    fs.writeFileSync(path, this.lines.join("\n"));
    console.log("wrote", path);
  }
}
