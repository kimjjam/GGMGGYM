import React, { useEffect, useMemo, useState, useRef } from "react";
import styles from "./WeightScale.module.css";
import { weightApi, meApi } from "../lib/api";
import { toYmd } from "../utils/daysSince";
import { useAuth } from "../store/auth";

type WeightScaleProps = {
  open: boolean;
  onClose: () => void;
  onDiffChange?: (diff: number | null) => void;
};

export default function WeightScale({ open, onClose, onDiffChange }: WeightScaleProps) {
  const { token } = useAuth();

  const [current, setCurrent] = useState<string>("");
  const [goal, setGoal] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const [topPos, setTopPos] = useState<number>(-90);

  // 모달 상단 데코 이미지 위치 계산
  useEffect(() => {
    if (!open) return;
    function updateTopPosition() {
      if (!modalRef.current) return;
      const modalHeight = modalRef.current.offsetHeight;
      const imageHeight = 180;
      const calculatedTop = -modalHeight / 2 - imageHeight / 2;
      setTopPos(calculatedTop);
    }
    updateTopPosition();
    window.addEventListener("resize", updateTopPosition);
    return () => window.removeEventListener("resize", updateTopPosition);
  }, [open]);

  // 열릴 때: 목표(goal)는 로컬→서버 순으로, 오늘 체중(current)은 서버에서 불러오기(없으면 로컬 백업)
  useEffect(() => {
    if (!open) return;

    // 1) 목표 체중: 로컬 표시
    const gLocal = localStorage.getItem("scale.goal");
    if (gLocal !== null) setGoal(gLocal);

    // 2) 서버에서 오늘 체중 / 목표 체중 불러오기
    (async () => {
      try {
        const todayKey = toYmd(new Date());

        if (token) {
          // 오늘 체중
          const res = await weightApi.list({ from: todayKey, to: todayKey });
          const items = (res?.items ?? []) as Array<{ dateKey: string; weight?: number }>;
          if (items.length > 0 && typeof items[0].weight === "number") {
            setCurrent(String(items[0].weight));
          } else {
            const c = localStorage.getItem("scale.current");
            if (c) setCurrent(c);
          }

          // 목표 체중
          try {
            const { goalWeight } = await meApi.getGoalWeight();
            if (goalWeight !== null && goalWeight !== undefined) {
              setGoal(String(goalWeight));
              localStorage.setItem("scale.goal", String(goalWeight)); // 로컬 백업 동기화
            }
          } catch {
            // 목표체중 API 실패 시에는 로컬 표시 유지
          }
        } else {
          // 미로그인: 로컬 백업만 사용
          const c = localStorage.getItem("scale.current");
          if (c) setCurrent(c);
        }
      } catch {
        // 네트워크/토큰 문제 시 로컬 백업값 표기
        const c = localStorage.getItem("scale.current");
        if (c) setCurrent(c);
      }
    })();
  }, [open, token]);

  // 목표(goal)는 로컬에 함께 저장 (서버 동기화는 저장 버튼에서 수행)
  useEffect(() => {
    if (goal !== "") localStorage.setItem("scale.goal", goal);
    else localStorage.removeItem("scale.goal");
  }, [goal]);

  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Esc") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // 숫자만 입력(소수 1점 포함), 정수부 최대 3자리
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const val = e.target.value;
    if (val === "") {
      setter("");
      return;
    }
    if (/^\d*\.?\d*$/.test(val)) {
      const integerPart = val.split(".")[0];
      if (integerPart.length > 3) return;
      setter(val);
    }
  };

  // diff = current - goal (양수면 감량 필요, 음수면 증량 필요)
  const diff = useMemo(() => {
    const numCurrent = parseFloat(current);
    const numGoal = parseFloat(goal);
    if (isNaN(numCurrent) || isNaN(numGoal)) return null;
    const d = numCurrent - numGoal;
    return Math.round(d * 10) / 10;
  }, [current, goal]);

  useEffect(() => {
    if (onDiffChange) onDiffChange(diff);
  }, [diff, onDiffChange]);

  const displayText = useMemo(() => {
    if (diff === null) return "0.0";
    const abs = Math.abs(diff).toFixed(1);
    if (diff > 0) return `-${abs}`;
    if (diff < 0) return `+${abs}`;
    return "0.0";
  }, [diff]);

  const helper = useMemo(() => {
    if (diff === null) return "현재/목표를 입력하세요";
    if (diff > 0) return `${diff.toFixed(1)}kg 감량 필요`;
    if (diff < 0) return `${Math.abs(diff).toFixed(1)}kg 증량 필요`;
    return "목표 달성!";
  }, [diff]);

  // 서버 저장 (오늘 날짜 upsert + 목표 체중 동시 저장)
  const handleSave = async () => {
    const todayKey = toYmd(new Date());
    try {
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }
      const w = current === "" ? NaN : parseFloat(current);
      if (isNaN(w)) {
        alert("현재 체중을 숫자로 입력하세요.");
        return;
      }
      setSaving(true);

      // 1) 오늘 체중 저장
      await weightApi.upsert(todayKey, { weight: w });
      localStorage.setItem("scale.current", String(w)); // 로컬 백업

      // 2) 목표 체중 저장/초기화
      const trimmed = goal.trim();
      if (trimmed === "") {
        await meApi.setGoalWeight(null);            // 서버 null 초기화
        localStorage.removeItem("scale.goal");
      } else {
        const gNum = parseFloat(trimmed);
        if (Number.isFinite(gNum)) {
          await meApi.setGoalWeight(gNum);          // 서버 저장
          localStorage.setItem("scale.goal", String(gNum));
        }
      }

      // ✅ 메인 배지 즉시 갱신 (GoalToGo 등에서 구독)
      window.dispatchEvent(new Event("metrics:changed"));

      alert("서버에 저장되었습니다.");
      onClose();
    } catch {
      // 오프라인/오류 시 로컬 임시 저장(체중). 목표체중은 다음 로그인 때 동기화 권장
      const payload = { weight: current === "" ? undefined : parseFloat(current) };
      const pending = JSON.parse(localStorage.getItem("pendingWeights") || "{}");
      pending[todayKey] = payload;
      localStorage.setItem("pendingWeights", JSON.stringify(pending));
      alert("네트워크/인증 오류로 로컬에 임시 저장했습니다. 로그인/네트워크 복구 후 동기화됩니다.");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.backdrop} onClick={onClose}>
        <div
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
          style={{ position: "relative" }}
          ref={modalRef}
        >
          {/* public 폴더 기준 경로 */}
          <img
            src="/images/mongletop.png"
            alt="몽글이 상단 데코"
            style={{
              position: "absolute",
              top: topPos,
              left: "50%",
              transform: "translateX(-50%)",
              width: 450,
              height: "auto",
              pointerEvents: "none",
              zIndex: 1000,
              userSelect: "none",
            }}
            draggable={false}
          />

          <h3 className={styles.title}>체중 목표 입력</h3>

          <label className={styles.row}>
            <span>현재 체중(kg)</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="예: 63.5"
              value={current}
              onChange={(e) => handleInputChange(e, setCurrent)}
            />
          </label>

          <label className={styles.row}>
            <span>목표 체중(kg)</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="예: 58"
              value={goal}
              onChange={(e) => handleInputChange(e, setGoal)}
            />
          </label>

          <div className={styles.resultBox}>
            <div className={styles.resultPrimary}>
              {diff === null ? "—" : displayText} kg
            </div>
            <div className={styles.resultSub}>{helper}</div>
          </div>

          <div className={styles.actions}>
            <button className={styles.primary} onClick={handleSave} disabled={saving}>
              {saving ? "저장 중…" : "저장"}
            </button>
            <button
              className={styles.ghost}
              onClick={() => {
                setCurrent("");
                setGoal("");
                localStorage.removeItem("scale.current");
                localStorage.removeItem("scale.goal");
              }}
              disabled={saving}
            >
              초기화
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
