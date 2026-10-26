// 视觉特效:漂浮粒子、点击爱心烟花、滚动渐显
(function () {
  const cv = document.getElementById("fx");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = cv && cv.getContext("2d");
  let W = 0, H = 0, DPR = 1;
  const floaters = [];
  const bursts = [];
  const COLORS = ["#ff7fa3", "#ffb6c9", "#ffc9a8", "#d9b8ff", "#ff5c8a"];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth;
    H = innerHeight;
    cv.width = W * DPR;
    cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function heart(x, y, s, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, 0.3);
    ctx.bezierCurveTo(-1, -0.5, -0.6, -1.1, 0, -0.5);
    ctx.bezierCurveTo(0.6, -1.1, 1, -0.5, 0, 0.3);
    ctx.fill();
    ctx.restore();
  }

  function spawnFloater(initial) {
    floaters.push({
      x: Math.random() * W,
      y: initial ? Math.random() * H : H + 20,
      s: 5 + Math.random() * 11,
      vy: 0.15 + Math.random() * 0.45,
      sway: Math.random() * Math.PI * 2,
      rot: Math.random() * 6,
      a: 0.25 + Math.random() * 0.4,
      c: COLORS[(Math.random() * COLORS.length) | 0],
    });
  }

  window.burstHearts = function (x, y, n) {
    if (reduce || !ctx) return;
    for (let i = 0; i < (n || 14); i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 1.5 + Math.random() * 4;
      bursts.push({
        x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 1.5,
        s: 7 + Math.random() * 9, rot: Math.random() * 6, life: 1,
        c: COLORS[(Math.random() * COLORS.length) | 0],
      });
    }
  };

  function frame() {
    ctx.clearRect(0, 0, W, H);
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.y -= f.vy;
      f.sway += 0.01;
      f.x += Math.sin(f.sway) * 0.4;
      f.rot += 0.004;
      if (f.y < -30) {
        floaters.splice(i, 1);
        spawnFloater(false);
        continue;
      }
      ctx.globalAlpha = f.a;
      ctx.fillStyle = f.c;
      heart(f.x, f.y, f.s, Math.sin(f.rot) * 0.5);
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.x += b.vx;
      b.y += b.vy;
      b.vy += 0.09;
      b.life -= 0.016;
      if (b.life <= 0) {
        bursts.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = b.life;
      ctx.fillStyle = b.c;
      heart(b.x, b.y, b.s, b.rot);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  if (ctx && !reduce) {
    resize();
    addEventListener("resize", resize);
    const count = innerWidth < 600 ? 16 : 28;
    for (let i = 0; i < count; i++) spawnFloater(true);
    requestAnimationFrame(frame);

    // 点击或触摸时迸发爱心
    document.addEventListener("pointerdown", (e) => {
      if (e.target.closest("input,textarea,#lightbox")) return;
      window.burstHearts(e.clientX, e.clientY, 12);
    });
    // 鼠标拖尾
    let last = 0;
    document.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const now = performance.now();
      if (now - last < 70) return;
      last = now;
      window.burstHearts(e.clientX, e.clientY, 1);
    });
  }

  // 滚动渐显
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".rv").forEach((n) => io.observe(n));
})();
