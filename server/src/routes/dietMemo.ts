import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middlewares/requireAuth";
import DietMemo from "../models/DietMemo";

const router = Router();

function isKey(s?: string) {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

router.get("/diet-memo/:weekStart", requireAuth, async (req: AuthedRequest, res) => {
  const weekStart = req.params.weekStart;
  if (!isKey(weekStart)) return res.status(400).json({ message: "Invalid weekStart" });

  const doc = await DietMemo.findOne({ userId: req.userId, weekStart });
  res.json(
    doc || {
      userId: req.userId,
      weekStart,
      content: "",
      meals: [],
    }
  );
});

router.put("/diet-memo/:weekStart", requireAuth, async (req: AuthedRequest, res) => {
  const weekStart = req.params.weekStart;
  if (!isKey(weekStart)) return res.status(400).json({ message: "Invalid weekStart" });

  const payload = {
    content: String(req.body?.content || ""),
    meals: Array.isArray(req.body?.meals)
      ? req.body.meals.map((m: any) => ({ date: String(m?.date || ""), text: String(m?.text || "") }))
      : [],
  };

  const doc = await DietMemo.findOneAndUpdate(
    { userId: req.userId, weekStart },
    { $set: payload },
    { new: true, upsert: true }
  );
  res.json(doc);
});

export default router;
