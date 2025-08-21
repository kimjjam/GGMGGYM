import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middlewares/requireAuth";
import Diary from "../models/Diary";

const router = Router();

function toKey(dateStr?: string) {
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// 인증 필수
router.use(requireAuth);

/**
 * GET /api/diary/:date
 * 해당 날짜 일기 1건 조회 (없으면 기본값 반환)
 */
router.get("/diary/:date", async (req: AuthedRequest, res) => {
  const dateKey = toKey(req.params.date);
  const doc = await Diary.findOne({ userId: req.userId, date: dateKey }).lean();
  if (!doc) {
    return res.json({
      userId: req.userId,
      date: dateKey,
      title: "",
      content: "",
    });
  }
  return res.json(doc);
});

/**
 * PUT /api/diary/:date
 * body: { title?:string, content:string }
 * upsert 저장
 */
router.put("/diary/:date", async (req: AuthedRequest, res) => {
  const dateKey = toKey(req.params.date);
  const payload = {
    title: typeof req.body?.title === "string" ? req.body.title : "",
    content: String(req.body?.content ?? ""),
  };

  const doc = await Diary.findOneAndUpdate(
    { userId: req.userId, date: dateKey },
    { $set: payload },
    { new: true, upsert: true }
  ).lean();

  return res.json(doc);
});

/**
 * GET /api/diary?from=YYYY-MM-DD&to=YYYY-MM-DD
 * 범위 조회(옵션) — 월간 뷰 등에서 사용
 */
router.get("/diary", async (req: AuthedRequest, res) => {
  const from = toKey(req.query.from as string | undefined);
  const to = toKey(req.query.to as string | undefined);
  const q: any = { userId: req.userId };
  if (req.query.from || req.query.to) q.date = { $gte: from, $lte: to };
  const list = await Diary.find(q).sort({ date: 1 }).lean();
  return res.json(list);
});

export default router;
