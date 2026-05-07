export function box(w, cx, cy, cz, sx, sy, sz) {
  const x = sx / 2, y = sy / 2, z = sz / 2;

  const v = [
    w.vertex(cx-x, cy-y, cz-z, 0,0), w.vertex(cx+x, cy-y, cz-z, 1,0), w.vertex(cx+x, cy+y, cz-z, 1,1), w.vertex(cx-x, cy+y, cz-z, 0,1),
    w.vertex(cx-x, cy-y, cz+z, 0,0), w.vertex(cx+x, cy-y, cz+z, 1,0), w.vertex(cx+x, cy+y, cz+z, 1,1), w.vertex(cx-x, cy+y, cz+z, 0,1)
  ];

  w.quad(v[0], v[1], v[2], v[3]);
  w.quad(v[5], v[4], v[7], v[6]);
  w.quad(v[4], v[0], v[3], v[7]);
  w.quad(v[1], v[5], v[6], v[2]);
  w.quad(v[3], v[2], v[6], v[7]);
  w.quad(v[4], v[5], v[1], v[0]);
}

export function cylinder(w, cx, cy, cz, radius, height, sides = 16) {
  const top = [];
  const bottom = [];

  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    const x = cx + Math.cos(a) * radius;
    const z = cz + Math.sin(a) * radius;
    const u = i / sides;

    bottom.push(w.vertex(x, cy - height / 2, z, u, 0));
    top.push(w.vertex(x, cy + height / 2, z, u, 1));
  }

  const centerBottom = w.vertex(cx, cy - height / 2, cz, 0.5, 0.5);
  const centerTop = w.vertex(cx, cy + height / 2, cz, 0.5, 0.5);

  for (let i = 0; i < sides; i++) {
    const n = (i + 1) % sides;

    w.quad(bottom[i], bottom[n], top[n], top[i]);
    w.tri(centerBottom, bottom[i], bottom[n]);
    w.tri(centerTop, top[n], top[i]);
  }
}

export function cone(w, cx, cy, cz, radius, height, sides = 16) {
  const base = [];

  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    base.push(w.vertex(cx + Math.cos(a) * radius, cy, cz + Math.sin(a) * radius, i / sides, 0));
  }

  const tip = w.vertex(cx, cy + height, cz, 0.5, 1);
  const center = w.vertex(cx, cy, cz, 0.5, 0.5);

  for (let i = 0; i < sides; i++) {
    const n = (i + 1) % sides;
    w.tri(base[i], base[n], tip);
    w.tri(center, base[n], base[i]);
  }
}
