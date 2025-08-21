import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middlewares/requireAuth";
import DailyStatus from "../models/DailyStatus";

const router = Router();

function toKey(dateStr?: string) {
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

router.get("/daily/:date", requireAuth, async (req: AuthedRequest, res) => {
  const dateKey = toKey(req.params.date);
  const doc = await DailyStatus.findOne({ userId: req.userId, date: dateKey });
  res.json(
    doc || {
      userId: req.userId,
      date: dateKey,
      didWorkout: false,
      waterMl: 0,
      sleepHours: 0,
      mood: "soso",
      note: "",
    }
  );
});

router.put("/daily/:date", requireAuth, async (req: AuthedRequest, res) => {
  const dateKey = toKey(req.params.date);
  const payload = {
    didWorkout: !!req.body?.didWorkout,
    waterMl: Number(req.body?.waterMl) || 0,
    sleepHours: Number(req.body?.sleepHours) || 0,
    mood: ["good", "soso", "bad"].includes(req.body?.mood) ? req.body.mood : "soso",
    note: String(req.body?.note || ""),
  };
  const doc = await DailyStatus.findOneAndUpdate(
    { userId: req.userId, date: dateKey },
    { $set: payload },
    { new: true, upsert: true }
  );
  res.json(doc);
});

export default router;
