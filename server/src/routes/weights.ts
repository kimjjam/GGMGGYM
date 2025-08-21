import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middlewares/requireAuth";
import WeightEntry from "../models/WeightEntry";

const router = Router();
router.use(requireAuth);

// GET /api/weights?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/weights", async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const { from, to } = req.query as { from?: string; to?: string };
  const end = to ?? new Date().toISOString().slice(0,10);
  const start = from ?? new Date(Date.now() - 29*86400000).toISOString().slice(0,10);

  const items = await WeightEntry.find({
    userId,
    dateKey: { $gte: start, $lte: end },
  }).sort({ dateKey: 1 });

  res.json({ items });
});

// PUT /api/weights/:dateKey
router.put("/weights/:dateKey", async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const { dateKey } = req.params;
  const { weight, bodyFat, muscle, memo } = req.body ?? {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return res.status(400).json({ message: "dateKey must be YYYY-MM-DD" });
  }
  const update = {
    ...(weight !== undefined ? { weight } : {}),
    ...(bodyFat !== undefined ? { bodyFat } : {}),
    ...(muscle !== undefined ? { muscle } : {}),
    ...(memo !== undefined ? { memo } : {}),
    updatedAt: new Date(),
  };
  const doc = await WeightEntry.findOneAndUpdate(
    { userId, dateKey },
    { $set: update, $setOnInsert: { userId, dateKey } },
    { upsert: true, new: true }
  );
  res.json({ item: doc });
});

export default router;
