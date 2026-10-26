// 祝福墙:表单 + 列表。所有内容用 textContent 渲染,避免 XSS。
(function () {
  const list = document.getElementById("wish-list");
  if (!list) return;
  const API = "/api/wishes";

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  };

  // 表单
  const form = el("form", "wish-form glass");
  form.innerHTML =
    '<label>你的名字<input name="name" maxlength="12" required placeholder="怎么称呼你"></label>' +
    '<label>你的祝福<textarea name="text" rows="3" maxlength="80" required placeholder="写一句祝福吧(80 字以内)"></textarea></label>' +
    '<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
    '<button class="btn" type="submit">送出祝福</button>' +
    '<p class="wish-msg" role="status"></p>';
  list.parentNode.insertBefore(form, list);
  const msg = form.querySelector(".wish-msg");

  function card(w, delay) {
    const c = el("div", "wish");
    c.style.animationDelay = (delay || 0) + "s";
    c.append(el("p", "", w.text), el("span", "", "— " + w.name));
    return c;
  }

  function note(text) {
    list.replaceChildren(el("p", "empty", text));
  }

  async function load() {
    try {
      const r = await fetch(API, { cache: "no-store" });
      if (!r.ok) throw new Error(r.status);
      const { items } = await r.json();
      if (!items.length) return note("还没有祝福,来写下第一条吧");
      list.replaceChildren(...items.map((w, i) => card(w, Math.min(i, 12) * 0.05)));
    } catch (e) {
      note("祝福墙暂时打不开,稍后再来看看");
    }
  }

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const fd = new FormData(form);
    const btn = form.querySelector("button");
    btn.disabled = true;
    msg.textContent = "正在送出...";
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fd.get("name"), text: fd.get("text"), website: fd.get("website") }),
      });
      if (r.status === 429) throw new Error("太快啦,过一会儿再试");
      if (!r.ok) throw new Error("送出失败,稍后再试");
      const data = await r.json();
      if (data.item) {
        if (list.querySelector(".empty")) list.replaceChildren();
        list.prepend(card(data.item));
      }
      form.querySelector("textarea").value = "";
      msg.textContent = "收到啦,谢谢你的祝福";
      if (window.burstHearts) window.burstHearts(window.innerWidth / 2, window.innerHeight / 2, 24);
    } catch (e) {
      msg.textContent = e.message;
    } finally {
      btn.disabled = false;
    }
  });

  load();
})();
