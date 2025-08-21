import { Router } from "express";
import User from "../models/User";

// Update the import path if the file is located elsewhere, for example:
import { requireAuth, AuthedRequest } from "../middlewares/requireAuth"; // ✅ 이 경로
// Or, if the file does not exist, create 'server/src/middleware/auth.ts' with the required exports.


const router = Router();

// GET /user/favorites  → [ "bench-press", ... ]
router.get("/user/favorites", requireAuth, async (req: AuthedRequest, res) => {
  const user = await User.findById(req.userId).lean();
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user.favoriteExercises || []);
});

// PUT /user/favorites      body: { ids: string[] }  (전체 교체)
router.put("/user/favorites", requireAuth, async (req: AuthedRequest, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: { favoriteExercises: [...new Set(ids)] } },
    { new: true }
  ).lean();
  res.json(user?.favoriteExercises || []);
});

// POST /user/favorites/:id  (개별 추가)
router.post("/user/favorites/:id", requireAuth, async (req: AuthedRequest, res) => {
  const id = String(req.params.id);
  const user = await User.findByIdAndUpdate(
    req.userId,
    { $addToSet: { favoriteExercises: id } },
    { new: true }
  ).lean();
  res.json(user?.favoriteExercises || []);
});

// DELETE /user/favorites/:id  (개별 제거)
router.delete("/user/favorites/:id", requireAuth, async (req: AuthedRequest, res) => {
  const id = String(req.params.id);
  const user = await User.findByIdAndUpdate(
    req.userId,
    { $pull: { favoriteExercises: id } },
    { new: true }
  ).lean();
  res.json(user?.favoriteExercises || []);
});

// PATCH /user/favorites/:id/toggle  (토글)
router.patch("/user/favorites/:id/toggle", requireAuth, async (req: AuthedRequest, res) => {
  const id = String(req.params.id);
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const set = new Set(user.favoriteExercises || []);
  if (set.has(id)) set.delete(id); else set.add(id);
  user.favoriteExercises = [...set];
  await user.save();

  res.json(user.favoriteExercises);
});

export default router;
