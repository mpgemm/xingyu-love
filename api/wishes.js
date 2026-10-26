// 祝福墙接口:读取和提交祝福,存储在 Upstash Redis(Vercel Marketplace 里的 Upstash for Redis)
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const ADMIN_KEY = process.env.ADMIN_KEY; // 可选:设置后可以用它删除不合适的祝福
const LIST = "xingyu:wishes";
const MAX_KEEP = 200;

async function redis(...cmds) {
  const r = await fetch(`${URL_}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error("redis " + r.status);
  return r.json();
}

const clean = (s, max) =>
  String(s || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!URL_ || !TOKEN) return res.status(503).json({ error: "storage-not-configured" });

  try {
    if (req.method === "GET") {
      const [{ result }] = await redis(["LRANGE", LIST, 0, 99]);
      const items = (result || []).map((s) => JSON.parse(s));
      return res.status(200).json({ items });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      const name = clean(body.name, 12);
      const text = clean(body.text, 80);
      if (!name || !text) return res.status(400).json({ error: "empty" });
      if (body.website) return res.status(200).json({ ok: true }); // 蜜罐字段,机器人会填

      // 简单限流:同一 IP 每 60 秒最多 3 条
      const ip = String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
      const rl = `xingyu:rl:${ip}`;
      const [{ result: n }] = await redis(["INCR", rl]);
      if (n === 1) await redis(["EXPIRE", rl, 60]);
      if (n > 3) return res.status(429).json({ error: "too-fast" });

      const item = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, text, t: Date.now() };
      await redis(["LPUSH", LIST, JSON.stringify(item)], ["LTRIM", LIST, 0, MAX_KEEP - 1]);
      return res.status(200).json({ ok: true, item });
    }

    if (req.method === "DELETE") {
      const { id, key } = req.query || {};
      if (!ADMIN_KEY || key !== ADMIN_KEY) return res.status(403).json({ error: "forbidden" });
      const [{ result }] = await redis(["LRANGE", LIST, 0, MAX_KEEP - 1]);
      const target = (result || []).find((s) => JSON.parse(s).id === id);
      if (target) await redis(["LREM", LIST, 0, target]);
      return res.status(200).json({ ok: true, removed: !!target });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "method" });
  } catch (e) {
    return res.status(500).json({ error: "server" });
  }
};
