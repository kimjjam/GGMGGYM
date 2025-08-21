// server/src/routes/me.ts
import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middlewares/requireAuth";
import User from "../models/User";

const router = Router();

// 모든 /me* 라우트는 인증 필요
router.use(requireAuth);

/**
 * GET /api/me
 * 내 프로필 조회
 */
router.get("/me", async (req: AuthedRequest, res) => {
  try {
    const user = await User.findById(req.userId).select("-password -passwordHash");
    if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    res.json(user);
  } catch {
    res.status(500).json({ message: "서버 오류" });
  }
});

/**
 * GET /api/me/goal-weight
 * 목표 체중 조회 (없으면 null)
 */
router.get("/me/goal-weight", async (req: AuthedRequest, res) => {
  try {
    const user = await User.findById(req.userId).select("goalWeight");
    if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    res.json({ goalWeight: user.goalWeight ?? null });
  } catch {
    res.status(500).json({ message: "서버 오류" });
  }
});

/**
 * PUT /api/me/goal-weight
 * 목표 체중 저장/초기화
 * body: { goalWeight: number | null }  // 빈 문자열/undefined는 null로 처리
 */
router.put("/me/goal-weight", async (req: AuthedRequest, res) => {
  try {
    let { goalWeight } = req.body as { goalWeight?: number | string | null };

    // "" 또는 undefined -> null 로 처리
    if (goalWeight === "" || goalWeight === undefined) goalWeight = null;

    if (goalWeight !== null) {
      const n = typeof goalWeight === "string" ? Number(goalWeight) : goalWeight;
      if (!Number.isFinite(n)) {
        return res.status(400).json({ message: "goalWeight는 숫자 또는 null 이어야 합니다." });
      }
      // 안전 범위 검증(원하면 조정)
      if (n <= 0 || n > 500) {
        return res.status(400).json({ message: "goalWeight는 1~500kg 사이여야 합니다." });
      }
      goalWeight = n;
    }

    const updated = await User.findByIdAndUpdate(
      req.userId,
      { $set: { goalWeight } },
      { new: true, select: "goalWeight" }
    );

    if (!updated) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

    res.json({ ok: true, goalWeight: updated.goalWeight ?? null });
  } catch {
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router;
