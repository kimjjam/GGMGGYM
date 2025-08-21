import { Router } from "express";
import Video from "../models/Video";
import { requireAuth, AuthedRequest } from "../middlewares/requireAuth";

const router = Router();

/** 목록/검색 */
router.get("/videos", async (req, res) => {
  const { q, group, limit = "12", skip = "0" } = req.query as any;
  const lim = Math.min(parseInt(limit, 10) || 12, 50);
  const sk = parseInt(skip, 10) || 0;

  const cond: any = { isActive: true };
  if (group) cond.groups = group;

  let cursor;
  if (q) {
    cursor = Video.find({ ...cond, $text: { $search: String(q) } }, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .skip(sk).limit(lim);
  } else {
    cursor = Video.find(cond).sort({ createdAt: -1 }).skip(sk).limit(lim);
  }

  const items = await cursor.lean();
  res.json({ items });
});

/** 벌크 시드(초기 이관용) — 로그인 필요 */
router.post("/videos/bulk", requireAuth, async (req: AuthedRequest, res) => {
  const items = (req.body?.items || []) as any[];
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items 배열 필요" });
  }
  const ops = items.map(v => ({
    updateOne: {
      filter: { youtubeId: v.youtubeId },
      update: { $set: { ...v, isActive: true } },
      upsert: true,
    }
  }));
  const r = await Video.bulkWrite(ops);
  res.json({ ok: true, result: r });
});

export default router;
