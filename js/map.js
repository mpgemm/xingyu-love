// 地图:一起去过的城市(点亮) + 北京到深圳的路线
const NS = "http://www.w3.org/2000/svg";
const project = (lon, lat) => [
  (lon - MAP.lon0) * MAP.sx,
  (MAP.y1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) * MAP.sy,
];

function svgEl(svg, tag, attrs, text) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (text) el.textContent = text;
  svg.appendChild(el);
  return el;
}

function drawProvinces(svg) {
  svg.setAttribute("viewBox", `0 0 ${MAP.w} ${MAP.h}`);
  const defs = svgEl(svg, "defs", {});
  const g = document.createElementNS(NS, "linearGradient");
  g.setAttribute("id", "litgrad");
  g.setAttribute("x1", "0");
  g.setAttribute("y1", "0");
  g.setAttribute("x2", "1");
  g.setAttribute("y2", "1");
  [["0", "#ff8fb4"], ["1", "#e0467a"]].forEach(([o, c]) => {
    const s = document.createElementNS(NS, "stop");
    s.setAttribute("offset", o);
    s.setAttribute("stop-color", c);
    g.appendChild(s);
  });
  defs.appendChild(g);
  const map = {};
  MAP.prov.forEach((p) => (map[p.n] = svgEl(svg, "path", { d: p.d, class: "prov" })));
  return map;
}

// 城市标签偏移 [dx, dy, 锚点]
const LABEL = {
  重庆: [-6, -9, "end"],
  武汉: [0, -10, "middle"],
  长沙: [-7, 4, "end"],
  南京: [8, -5, "start"],
};

// 粤港澳挨得太近,放大到右下角的圆形放大镜里单独展示
const INSET = { cx: 705, cy: 452, r: 74, k: 7, center: [113.8, 22.4] };
const INSET_LABEL = {
  深圳: [10, -14, "start"],
  香港: [12, 14, "start"],
  珠海: [-10, -12, "end"],
  澳门: [-10, 16, "end"],
};
const INSET_PROV = ["广东省", "香港特别行政区", "澳门特别行政区"];

function renderInset(svg) {
  const { cx, cy, r, k, center } = INSET;
  const [px, py] = project(center[0], center[1]);
  const defs = svg.querySelector("defs");
  const cp = document.createElementNS(NS, "clipPath");
  cp.setAttribute("id", "insetclip");
  const c = document.createElementNS(NS, "circle");
  c.setAttribute("cx", cx);
  c.setAttribute("cy", cy);
  c.setAttribute("r", r);
  cp.appendChild(c);
  defs.appendChild(cp);

  // 主图上标出放大的位置,并连线到放大镜
  svgEl(svg, "circle", { cx: px, cy: py, r: 7, fill: "none", stroke: "#b83a63", "stroke-width": 1.5 });
  const ang = Math.atan2(cy - py, cx - px);
  svgEl(svg, "line", {
    x1: px + Math.cos(ang) * 7, y1: py + Math.sin(ang) * 7,
    x2: cx - Math.cos(ang) * r, y2: cy - Math.sin(ang) * r,
    stroke: "#b83a63", "stroke-width": 1.2, "stroke-dasharray": "3 3",
  });

  svgEl(svg, "circle", { cx, cy, r, fill: "#fff3f7", stroke: "#e0567f", "stroke-width": 2.5 });
  const g = svgEl(svg, "g", { "clip-path": "url(#insetclip)" });
  const inner = document.createElementNS(NS, "g");
  inner.setAttribute("transform", `translate(${cx},${cy}) scale(${k}) translate(${-px},${-py})`);
  g.appendChild(inner);
  MAP.prov.filter((p) => INSET_PROV.includes(p.n)).forEach((p) => {
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", p.d);
    path.setAttribute("class", "prov fill");
    path.setAttribute("vector-effect", "non-scaling-stroke");
    inner.appendChild(path);
  });

  VISITED.filter((v) => INSET_LABEL[v.n]).forEach((v) => {
    const [x, y] = project(v.lon, v.lat);
    const ix = cx + (x - px) * k;
    const iy = cy + (y - py) * k;
    const [dx, dy, anchor] = INSET_LABEL[v.n];
    svgEl(svg, "line", { x1: ix, y1: iy, x2: ix + dx, y2: iy + dy - 4, stroke: "#b83a63", "stroke-width": 0.9 });
    svgEl(svg, "circle", { cx: ix, cy: iy, r: 3.6, class: "visit-dot" });
    svgEl(svg, "text", { x: ix + dx, y: iy + dy, class: "visit-name inset-name", "text-anchor": anchor }, v.n);
  });
}

function renderCityMap() {
  const svg = document.getElementById("cmap");
  if (!svg) return;
  const provs = drawProvinces(svg);
  const lit = new Set(VISITED.map((c) => c.prov));

  VISITED.filter((c) => LABEL[c.n]).forEach((c) => {
    const [x, y] = project(c.lon, c.lat);
    const [dx, dy, anchor] = LABEL[c.n];
    svgEl(svg, "circle", { cx: x, cy: y, r: 2.4, class: "visit-dot" });
    svgEl(svg, "text", { x: x + dx, y: y + dy, class: "visit-name", "text-anchor": anchor }, c.n);
  });
  renderInset(svg);
  drawRoute(svg);

  const chips = document.getElementById("chips");
  VISITED.forEach((c, i) => {
    const s = document.createElement("span");
    s.className = "chip";
    s.style.animationDelay = i * 0.12 + "s";
    s.textContent = c.n;
    chips.appendChild(s);
  });
  document.getElementById("c-cities").textContent = VISITED.length;
  document.getElementById("c-provs").textContent = lit.size;

  // 滚动到这里时,按顺序点亮
  const sec = document.getElementById("cities");
  const io = new IntersectionObserver((es) => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    [...lit].forEach((name, i) => setTimeout(() => provs[name] && provs[name].classList.add("lit"), 300 + i * 260));
  }, { threshold: 0.3 });
  io.observe(sec);
}

// 北京到深圳的虚线路径(画在点亮的地图之上)
function drawRoute(svg) {
  const [bx, by] = project(ME.lon, ME.lat);
  const [sx, sy] = project(HER.lon, HER.lat);
  const d = `M${bx},${by} Q${bx + 90},${(by + sy) / 2} ${sx},${sy}`;
  svgEl(svg, "path", { d, class: "route-line" });

  const heart = svgEl(svg, "text", { class: "fly-heart", "text-anchor": "middle", dy: "6" }, "❤");
  const anim = document.createElementNS(NS, "animateMotion");
  anim.setAttribute("dur", "5s");
  anim.setAttribute("repeatCount", "indefinite");
  anim.setAttribute("path", d);
  heart.appendChild(anim);

  svgEl(svg, "circle", { cx: bx, cy: by, r: 6, class: "pulse" });
  svgEl(svg, "circle", { cx: bx, cy: by, r: 5, class: "dot" });
  svgEl(svg, "text", { x: bx - 10, y: by - 6, class: "bj-name", "text-anchor": "end" }, ME.name);
}

// 两地直线距离(haversine 球面距离)
function renderDistance() {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(HER.lat - ME.lat);
  const dLon = rad(HER.lon - ME.lon);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(ME.lat)) * Math.cos(rad(HER.lat)) * Math.sin(dLon / 2) ** 2;
  const km = 2 * 6371 * Math.asin(Math.sqrt(a));
  document.getElementById("km").textContent = Math.round(km).toLocaleString();
}
