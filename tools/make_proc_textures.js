import fs from "fs";

fs.mkdirSync("generated/textures", { recursive: true });

function svg(path, body) {
  fs.writeFileSync(
    path,
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">${body}</svg>`
  );
}

svg("generated/textures/wood.svg", `
<rect width="256" height="256" fill="#7b461e"/>
<path d="M0 30 C40 10 80 50 130 28 S220 20 256 45" stroke="#a66a32" stroke-width="12" fill="none"/>
<path d="M0 90 C60 70 90 120 150 92 S220 80 256 110" stroke="#5b2e12" stroke-width="8" fill="none"/>
<path d="M0 160 C70 140 100 180 160 155 S230 150 256 175" stroke="#9a5a27" stroke-width="10" fill="none"/>
<g opacity=".25">${Array.from({length:18},(_,i)=>`<path d="M${i*15} 0 V256" stroke="#2a1208" stroke-width="2"/>`).join("")}</g>
`);

svg("generated/textures/stone.svg", `
<rect width="256" height="256" fill="#77766e"/>
<g stroke="#343434" stroke-width="5" opacity=".7">
<path d="M0 50 H256M0 105 H256M0 160 H256M0 215 H256"/>
<path d="M40 0 V50M130 50 V105M75 105 V160M180 160 V215M110 215 V256"/>
</g>
<g fill="#999891" opacity=".35">
<circle cx="35" cy="30" r="6"/><circle cx="190" cy="80" r="9"/><circle cx="120" cy="185" r="7"/>
</g>
`);

svg("generated/textures/roof.svg", `
<rect width="256" height="256" fill="#6e1510"/>
<g stroke="#2b0907" stroke-width="4">
${Array.from({length:12},(_,i)=>`<path d="M0 ${i*24} H256"/>`).join("")}
${Array.from({length:12},(_,i)=>`<path d="M${i*24} 0 v24 m12 0 v24 m-12 0 v24 m12 0 v24 m-12 0 v24 m12 0 v24 m-12 0 v24 m12 0 v24"/>`).join("")}
</g>
<g fill="#a43a2d" opacity=".5">
${Array.from({length:40},(_,i)=>`<circle cx="${(i*47)%256}" cy="${(i*83)%256}" r="${3+(i%5)}"/>`).join("")}
</g>
`);

svg("generated/textures/metal.svg", `
<rect width="256" height="256" fill="#55595c"/>
<linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#2d3032"/><stop offset=".5" stop-color="#aeb5b8"/><stop offset="1" stop-color="#3a3d40"/></linearGradient>
<rect width="256" height="256" fill="url(#g)" opacity=".7"/>
<g stroke="#1f2224" stroke-width="3" opacity=".45">
${Array.from({length:16},(_,i)=>`<path d="M0 ${i*16} H256"/>`).join("")}
</g>
`);

svg("generated/textures/water.svg", `
<rect width="256" height="256" fill="#0b5fa5"/>
<g stroke="#8bd3ff" stroke-width="5" fill="none" opacity=".45">
<path d="M-20 40 C30 20 70 60 120 38 S220 30 280 58"/>
<path d="M-30 105 C40 80 80 130 150 100 S220 95 290 125"/>
<path d="M-20 180 C35 150 80 205 135 175 S225 165 290 200"/>
</g>
`);

svg("generated/textures/glass.svg", `
<rect width="256" height="256" fill="#6fb6d8" opacity=".85"/>
<path d="M30 256 L180 0" stroke="#ffffff" stroke-width="18" opacity=".35"/>
<path d="M95 256 L245 0" stroke="#ffffff" stroke-width="8" opacity=".25"/>
`);

svg("generated/textures/dirt.svg", `
<rect width="256" height="256" fill="#5a3b1e"/>
<g opacity=".45">
${Array.from({length:80},(_,i)=>`<circle cx="${(i*37)%256}" cy="${(i*91)%256}" r="${2+(i%8)}" fill="${i%2?'#75502a':'#392413'}"/>`).join("")}
</g>
`);

svg("generated/textures/leaf.svg", `
<rect width="256" height="256" fill="#145c24"/>
<g fill="#237a34" opacity=".8">
<circle cx="50" cy="50" r="35"/><circle cx="130" cy="70" r="42"/><circle cx="210" cy="45" r="30"/>
<circle cx="80" cy="150" r="45"/><circle cx="180" cy="165" r="50"/>
</g>
`);

svg("generated/textures/sign.svg", `
<rect width="256" height="256" fill="#4e2b12"/>
<rect x="18" y="28" width="220" height="170" rx="14" fill="#8a5525"/>
<text x="128" y="120" text-anchor="middle" font-family="serif" font-size="38" fill="#f5d28a">SHOP</text>
<path d="M35 170 H221" stroke="#3a1d0b" stroke-width="5"/>
`);

svg("generated/textures/canvas.svg", `
<rect width="256" height="256" fill="#aa8958"/>
<g stroke="#d0b47a" stroke-width="3" opacity=".55">
${Array.from({length:32},(_,i)=>`<path d="M${i*8} 0 V256"/><path d="M0 ${i*8} H256"/>`).join("")}
</g>
`);

console.log("wrote procedural texture set");
