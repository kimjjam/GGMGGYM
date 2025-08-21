import React, { useCallback, useEffect, useState } from "react";
import { meApi, weightApi } from "../lib/api";
import { useAuth } from "../store/auth";
import { toYmd } from "../utils/daysSince";

type Props = { className?: string };

export default function GoalToGo({ className }: Props) {
  const { token } = useAuth();
  const [text, setText] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setText(null);
      return;
    }

    const todayKey = toYmd(new Date());

    // 1) 서버에서 우선 가져오기
    let goal: number | null = null;
    let current: number | null = null;

    try {
      const { goalWeight } = await meApi.getGoalWeight();
      if (typeof goalWeight === "number") goal = goalWeight;
    } catch {}

    try {
      const { items } = await weightApi.list({ from: todayKey, to: todayKey });
      const w = items?.[0]?.weight;
      if (typeof w === "number") current = w;
    } catch {}

    // 2) 없으면 로컬 백업 사용
    if (goal == null) {
      const g = parseFloat(localStorage.getItem("scale.goal") || "");
      if (!Number.isNaN(g)) goal = g;
    }
    if (current == null) {
      const c = parseFloat(localStorage.getItem("scale.current") || "");
      if (!Number.isNaN(c)) current = c;
    }

    if (goal == null || current == null) {
      setText("현재/목표를 입력하세요");
      return;
    }

    const diff = Math.round(Math.abs(current - goal) * 10) / 10;
    setText(diff === 0 ? "목표 달성!" : `목표까지 ${diff.toFixed(1)}kg!`);
  }, [token]);

  // 로그인 직후/새로고침 때 자동 표시
  useEffect(() => { refresh(); }, [refresh]);

  // 모달에서 저장 후 갱신되도록 커스텀 이벤트 구독
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("metrics:changed", handler);
    return () => window.removeEventListener("metrics:changed", handler);
  }, [refresh]);

  return (
    <div
      className={className}
      style={{ fontWeight: 700, color: "#1f7a5a", fontSize: 14, textAlign: "center" }}
    >
      {text ?? ""}
    </div>
  );
}
