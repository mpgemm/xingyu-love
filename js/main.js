const $ = (id) => document.getElementById(id);

// 飘落花瓣
function spawnPetals() {
  const box = $("petals");
  const icons = ["🌸", "💗", "🌷"];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement("span");
    p.className = "petal";
    p.textContent = icons[i % icons.length];
    p.style.left = Math.random() * 100 + "vw";
    p.style.fontSize = 12 + Math.random() * 14 + "px";
    p.style.animationDuration = 8 + Math.random() * 10 + "s";
    p.style.animationDelay = -Math.random() * 12 + "s";
    box.appendChild(p);
  }
}

// 口令门
function unlock() {
  const input = $("pwd");
  if (input.value.trim() === PASSWORD) {
    $("gate").classList.add("hide");
    $("site").hidden = false;
    $("music-btn").hidden = false;
    document.body.classList.remove("locked");
    sessionStorage.setItem("unlocked", "1");
    tryPlay();
  } else {
    $("gate-tip").textContent = "再想想我们的纪念日哦~";
    input.classList.remove("shake");
    void input.offsetWidth;
    input.classList.add("shake");
  }
}

// 恋爱计时器
function tick() {
  const now = new Date();
  const diff = now - START;
  const s = Math.floor(diff / 1000);
  $("t-d").textContent = Math.floor(s / 86400);
  $("t-h").textContent = Math.floor((s % 86400) / 3600);
  $("t-m").textContent = Math.floor((s % 3600) / 60);
  $("t-s").textContent = s % 60;

  const days = Math.floor(diff / 86400000);
  const marks = [100, 200, 300, 365, 500, 600, 700, 730, 800, 900, 1000, 1095, 1500, 2000];
  const next = marks.find((m) => m > days);
  if (next) {
    const target = new Date(START.getTime() + next * 86400000);
    const left = Math.ceil((target - now) / 86400000);
    $("next").textContent = `距离我们的第 ${next} 天,还有 ${left} 天`;
  }
}

// 照片墙
function renderWall() {
  const wall = $("wall");
  if (!PHOTOS.length) {
    wall.innerHTML = '<p class="empty">照片正在路上,马上就来 📷</p>';
    return;
  }
  PHOTOS.forEach((p) => {
    const f = document.createElement("figure");
    const img = document.createElement("img");
    img.src = p.src;
    img.alt = p.caption || "";
    img.loading = "lazy";
    const cap = document.createElement("figcaption");
    cap.textContent = p.caption || "";
    f.append(img);
    if (p.caption) f.append(cap);
    f.onclick = () => {
      $("lb-img").src = p.src;
      $("lb-cap").textContent = p.caption || "";
      $("lightbox").hidden = false;
    };
    wall.appendChild(f);
  });
  $("lightbox").onclick = () => ($("lightbox").hidden = true);
}

// 中国地图 + 北京到深圳的虚线路径
function renderMap() {
  const NS = "http://www.w3.org/2000/svg";
  const svg = $("map");
  svg.setAttribute("viewBox", `0 0 ${MAP.w} ${MAP.h}`);
  const mk = (tag, attrs, text) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (text) el.textContent = text;
    svg.appendChild(el);
    return el;
  };
  MAP.paths.forEach((d) => mk("path", { d, class: "prov" }));

  const [bx, by] = MAP.bj;
  const [sx, sy] = MAP.sz;
  // 控制点向东偏移,让路径呈弧线
  const d = `M${bx},${by} Q${bx + 90},${(by + sy) / 2} ${sx},${sy}`;
  mk("path", { d, class: "route-line", id: "route" });

  const heart = mk("text", { class: "fly-heart", "text-anchor": "middle", "dy": "6" }, "❤");
  const anim = document.createElementNS(NS, "animateMotion");
  anim.setAttribute("dur", "5s");
  anim.setAttribute("repeatCount", "indefinite");
  anim.setAttribute("path", d);
  heart.appendChild(anim);

  [[bx, by, "北京", "我在这里", -1], [sx, sy, "深圳", "你在这里", 1]].forEach(([x, y, n, s, dir]) => {
    mk("circle", { cx: x, cy: y, r: 6, class: "pulse" });
    mk("circle", { cx: x, cy: y, r: 5, class: "dot" });
    mk("text", { x: x - 12, y: y + (dir < 0 ? -14 : 24), class: "city-name", "text-anchor": "end" }, n);
    mk("text", { x: x - 12, y: y + (dir < 0 ? 2 : 40), class: "city-sub", "text-anchor": "end" }, s);
  });
}

// 两地距离(haversine 球面距离)
function renderDistance() {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(HER.lat - ME.lat);
  const dLon = rad(HER.lon - ME.lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(ME.lat)) * Math.cos(rad(HER.lat)) * Math.sin(dLon / 2) ** 2;
  const km = 2 * 6371 * Math.asin(Math.sqrt(a));
  $("km").textContent = Math.round(km).toLocaleString();
}

// 情话盲盒
let lastQuote = -1;
function drawQuote() {
  let i;
  do {
    i = Math.floor(Math.random() * QUOTES.length);
  } while (i === lastQuote && QUOTES.length > 1);
  lastQuote = i;
  $("quote").textContent = QUOTES[i];
}

// 背景音乐(浏览器可能拦截自动播放,拦截时需要点按钮)
const bgm = $("bgm");
function setPlaying(on) {
  $("music-btn").classList.toggle("play", on);
}
function tryPlay() {
  bgm.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
}
$("music-btn").onclick = () => {
  if (bgm.paused) tryPlay();
  else {
    bgm.pause();
    setPlaying(false);
  }
};

spawnPetals();
renderWall();
renderDistance();
renderMap();
tick();
setInterval(tick, 1000);
$("gift").onclick = drawQuote;
$("enter").onclick = unlock;
$("pwd").addEventListener("keydown", (e) => e.key === "Enter" && unlock());
