import { Router } from "express";
import WorkoutLog from "../models/WorkoutLog";
import { requireAuth, AuthedRequest } from "../middlewares/requireAuth";

const r = Router();
r.use(requireAuth);

/**
 * GET /api/workout-logs?date=YYYY-MM-DD[&group=shoulder]
 * - group이 있으면 해당 부위의 entries/시간만 반환
 * - 없으면 하루 전체를 반환(기존과 동일)
 */
r.get("/workout-logs", async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const date = String(req.query.date || "");
  const group = req.query.group ? String(req.query.group) : "";

  if (!date) return res.status(400).json({ error: "date is required" });

  const doc = await WorkoutLog.findOne({ userId, date }).lean();

  if (!doc) {
    return res.json({
      userId, date,
      entries: [],
      durationSec: 0,
      createdAt: null, updatedAt: null,
    });
  }

  // 기본(전체)
  let entries = doc.entries || [];
  let durationSec = Number(doc.durationSec || 0);

  // 부위 필터 요청이면 해당 부위만
  if (group) {
    entries = entries.filter((e: any) => e.group === group);
    const by = (doc as any).durationByGroup || {};
    durationSec = Number(by?.[group] || 0);
  }

  return res.json({
    userId: doc.userId,
    date: doc.date,
    entries,
    durationSec,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
});

/**
 * PUT /api/workout-logs/:date[?group=shoulder]
 * - group이 없으면 하루 전체를 교체(기존 동작)
 * - group이 있으면 해당 부위 entries만 갈아끼움(다른 부위 보존)
 *   durationByGroup[group]도 함께 저장
 */
r.put("/workout-logs/:date", async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const date = String(req.params.date);
  const group = req.query.group ? String(req.query.group) : "";

  const {
    entries = [],
    durationSec = 0,
    startedAt = null,
    finishedAt = null,
  } = req.body || {};

  // 전체 교체
  if (!group) {
    const doc = await WorkoutLog.findOneAndUpdate(
      { userId, date },
      {
        $set: {
          entries,
          durationSec,
          startedAt,
          finishedAt,
        },
      },
      { upsert: true, new: true }
    ).lean();
    return res.json(doc);
  }

  // 특정 부위만 교체
  const prev = await WorkoutLog.findOne({ userId, date }).lean();

  const prevEntries = prev?.entries || [];
  const kept = prevEntries.filter((e: any) => e.group !== group);
  const nextEntries = [
    ...kept,
    ...entries.map((e: any) => ({ ...e, group })), // 안전하게 group 보장
  ];

  const update: any = {
    entries: nextEntries,
    startedAt,
    finishedAt,
    // 부위별 시간 맵 업데이트
    [`durationByGroup.${group}`]: Number(durationSec || 0),
  };

  const doc = await WorkoutLog.findOneAndUpdate(
    { userId, date },
    { $set: update, $setOnInsert: { durationSec: prev?.durationSec ?? 0 } },
    { upsert: true, new: true }
  ).lean();

  // 응답은 해당 부위의 부분만 돌려줌
  return res.json({
    userId: doc.userId,
    date: doc.date,
    entries,
    durationSec: Number(durationSec || 0),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
});

/**
 * GET /api/workout-logs/calendar?month=YYYY-MM
 * - 요약(날짜/개수/총시간)은 기존 문서 전체 기준(부위 합)으로 유지
 */
r.get("/workout-logs/calendar", async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const month = String(req.query.month || "");
  if (!month) return res.status(400).json({ error: "month is required" });

  const regex = new RegExp(`^${month}-\\d{2}$`);
  const list = await WorkoutLog.find(
    { userId, date: regex },
    { date: 1, durationSec: 1, entries: 1, durationByGroup: 1 }
  ).lean();

  const out = list.map((d) => {
    const base = Number(d.durationSec || 0);
    const by = (d as any).durationByGroup || {};
    const sumBy =
      base ||
      Object.values(by).reduce((s: number, v: any) => s + Number(v || 0), 0);

    return {
      date: d.date,
      count: (d.entries || []).length,
      sec: sumBy,
    };
  });

  res.json(out);
});

export default r;
