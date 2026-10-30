const $ = (id) => document.getElementById(id);

// 口令门
function unlock() {
  const input = $("pwd");
  if (input.value.trim() === PASSWORD) {
    $("gate").classList.add("hide");
    $("site").hidden = false;
    $("music-btn").hidden = false;
    document.body.classList.remove("locked");
    typeHero();
    loadWeather();
    tryPlay();
  } else {
    $("gate-tip").textContent = "再想想我们的纪念日哦~";
    input.classList.remove("shake");
    void input.offsetWidth;
    input.classList.add("shake");
  }
}

// 首屏打字机
function typeHero() {
  const text = "这里是只属于我们两个人的世界";
  const box = $("typed");
  let i = 0;
  const t = setInterval(() => {
    box.textContent = text.slice(0, ++i);
    if (i >= text.length) clearInterval(t);
  }, 120);
}

// 恋爱计时器 + 下一个纪念日 + 见面倒计时
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
  if (MEET && MEET > now) {
    const left = Math.ceil((MEET - now) / 86400000);
    $("meet").textContent = `距离下一次见面,还有 ${left} 天`;
  } else {
    $("meet").textContent = "";
  }
}

// 照片墙
function renderWall() {
  const wall = $("wall");
  if (!PHOTOS.length) {
    wall.innerHTML = '<p class="empty">照片正在路上,马上就来</p>';
    return;
  }
  PHOTOS.forEach((p) => {
    const f = document.createElement("figure");
    const img = document.createElement("img");
    img.src = p.src;
    img.alt = p.caption || "";
    img.loading = "lazy";
    f.append(img);
    if (p.caption) {
      const cap = document.createElement("figcaption");
      cap.textContent = p.caption;
      f.append(cap);
    }
    f.onclick = () => {
      $("lb-img").src = p.src;
      $("lb-cap").textContent = p.caption || "";
      $("lightbox").hidden = false;
    };
    wall.appendChild(f);
  });
  $("lightbox").onclick = () => ($("lightbox").hidden = true);
}

// 情话盲盒
let lastQuote = -1;
let boxBusy = false;
function drawQuote() {
  if (boxBusy) return;
  boxBusy = true;
  let i;
  do {
    i = Math.floor(Math.random() * QUOTES.length);
  } while (i === lastQuote && QUOTES.length > 1);
  lastQuote = i;

  const gift = $("gift");
  const quote = $("quote");
  quote.classList.remove("show");
  gift.classList.remove("open");
  void gift.offsetWidth; // 重新触发动画
  gift.classList.add("open");

  // 礼盒打开的瞬间,飘出几个小图标
  const wrap = gift.parentNode;
  ["💌", "✨", "💖", "🌸", "⭐"].forEach((ch, k) => {
    const s = document.createElement("span");
    s.className = "pop-item";
    s.textContent = ch;
    s.style.setProperty("--dx", (k - 2) * 38 + "px");
    s.style.setProperty("--rot", (k - 2) * 18 + "deg");
    s.style.animationDelay = 0.5 + k * 0.06 + "s";
    wrap.appendChild(s);
    setTimeout(() => s.remove(), 2200);
  });

  setTimeout(() => {
    quote.textContent = QUOTES[i];
    void quote.offsetWidth;
    quote.classList.add("show");
    const r = gift.getBoundingClientRect();
    if (window.burstHearts) window.burstHearts(r.left + r.width / 2, r.top + r.height / 2, 22);
  }, 550);

  setTimeout(() => {
    gift.classList.remove("open");
    boxBusy = false;
  }, 950);
}

// 两地天气(open-meteo,免费、无需密钥;取不到时只显示提示)
const WX = (c) => {
  if (c === 0) return ["☀️", "晴"];
  if (c <= 3) return ["⛅", "多云"];
  if (c <= 48) return ["🌫️", "有雾"];
  if (c <= 57) return ["🌦️", "毛毛雨"];
  if (c <= 67) return ["🌧️", "下雨"];
  if (c <= 77) return ["❄️", "下雪"];
  if (c <= 82) return ["🌧️", "阵雨"];
  return ["⛈️", "雷雨"];
};
async function loadWeather() {
  try {
    const q = `latitude=${ME.lat},${HER.lat}&longitude=${ME.lon},${HER.lon}`;
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?${q}&current=temperature_2m,weather_code&timezone=auto`);
    if (!r.ok) throw new Error(r.status);
    const [a, b] = await r.json();
    [[a, "wx-me"], [b, "wx-her"]].forEach(([d, id]) => {
      const [ic, ds] = WX(d.current.weather_code);
      const box = $(id);
      box.querySelector(".ic").textContent = ic;
      box.querySelector(".tp").textContent = Math.round(d.current.temperature_2m) + "°C";
      box.querySelector(".ds").textContent = ds;
    });
    const code = b.current.weather_code;
    const t = b.current.temperature_2m;
    let tip = "深圳现在这样,你那边也要照顾好自己";
    if (code >= 51 && code <= 82) tip = "深圳在下雨,记得带伞";
    else if (code >= 95) tip = "深圳有雷雨,今天别在外面逛啦";
    else if (t >= 32) tip = "深圳有点热,记得多喝水";
    else if (t <= 12) tip = "深圳降温了,多穿一点";
    $("wx-tip").textContent = tip;
  } catch (e) {
    $("wx-tip").textContent = "天气暂时没取到,过会儿再看看";
  }
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

renderWall();
renderCityMap();
renderDistance();
tick();
setInterval(tick, 1000);
$("gift").onclick = drawQuote;
$("enter").onclick = unlock;
$("pwd").addEventListener("keydown", (e) => e.key === "Enter" && unlock());
