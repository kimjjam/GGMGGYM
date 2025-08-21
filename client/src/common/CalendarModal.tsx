// client/src/components/common/CalendarModal.tsx
import { useEffect, useMemo, useState } from "react";
import { workoutLogsApi, type Workout, type CalendarDaySummary } from "../../lib/api";

type Group = Workout["group"]; // "back" | "shoulder" | "chest" | "arm" | "legs" | "cardio"

type Props = {
  open: boolean;
  value: string;              // YYYY-MM-DD (선택된 날짜)
  onChange: (dateKey: string) => void;
  onClose: () => void;
};

const C = {
  white: "#fff",
  line: "#e8edf3",
  navy: "#163353",
  primary: "#3cbaba",
  mute: "#6b7280",
  cream: "#fff7ec",
  sky: "#f8fafc",
};

const GROUP_LABEL: Record<Group, string> = {
  back: "등",
  shoulder: "어깨",
  chest: "가슴",
  arm: "팔",
  legs: "하체",
  cardio: "유산소",
};

export default function CalendarModal({ open, value, onChange, onClose }: Props) {
  if (!open) return null;

  // 선택된 날짜 기준 월 뷰
  const [month, setMonth] = useState(() => {
    const [y, m] = value.split("-").map(Number);
    return new Date(y, (m || 1) - 1, 1);
  });

  const [monthly, setMonthly] = useState<CalendarDaySummary[]>([]);
  const monthKey = useMemo(
    () => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
    [month]
  );

  // ✅ 날짜별 그룹 요약 가져오기 (운동명 X, 그룹만)
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const list = await workoutLogsApi.monthly(monthKey, { groups: true });
        if (!ignore) setMonthly(list || []);
      } catch {
        if (!ignore) setMonthly([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [monthKey]);

  // 달력 셀(6주, 42칸)
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(start.getDate() - first.getDay()); // 일요일 시작
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  // 빠른 조회용 맵
  const byDate: Record<string, CalendarDaySummary | undefined> = useMemo(() => {
    const map: Record<string, CalendarDaySummary> = {};
    monthly.forEach((x) => (map[x.date] = x));
    return map;
  }, [monthly]);

  const selectedKey = value;
  const todayKey = toYmd(new Date());

  const handlePick = (d: Date) => {
    onChange(toYmd(d));
    onClose();
  };

  return (
    <div style={S.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.sheet} role="dialog" aria-modal="true" aria-labelledby="cal-title">
        {/* 헤더 */}
        <div style={S.calHeader}>
          <button
            style={S.navBtn}
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            aria-label="이전 달"
          >
            ◀
          </button>
          <div id="cal-title" style={{ fontWeight: 900, color: C.navy }}>
            {month.getFullYear()}년 {String(month.getMonth() + 1).padStart(2, "0")}월
          </div>
          <button
            style={S.navBtn}
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            aria-label="다음 달"
          >
            ▶
          </button>
        </div>

        {/* 요일 */}
        <div style={S.weekdayRow}>
          {["일","월","화","수","목","금","토"].map((w) => (
            <div key={w} style={S.weekdayCell}>{w}</div>
          ))}
        </div>

        {/* 그리드 */}
        <div style={S.grid}>
          {cells.map((d, i) => {
            const key = toYmd(d);
            const inThisMonth = d.getMonth() === month.getMonth();
            const sum = byDate[key];
            const hasAny = !!sum && (sum.count > 0 || sum.sec > 0 || (sum.groups?.length ?? 0) > 0);

            // 부위 라벨 (중복 제거 후 최대 3개)
            const uniq: string[] = [];
            (sum?.groups || []).forEach((g) => {
              const t = GROUP_LABEL[g as Group];
              if (t && !uniq.includes(t)) uniq.push(t);
            });

            return (
              <button
                key={i}
                onClick={() => handlePick(d)}
                title={
                  uniq.length ? `${key} · ${uniq.join(" · ")}` : key
                }
                style={{
                  ...S.cell,
                  ...(inThisMonth ? S.cellThis : S.cellOther),
                  ...(selectedKey === key ? S.cellActive : {}),
                  ...(todayKey === key ? { borderColor: "#8fdede" } : {}),
                }}
              >
                <div style={{ display: "grid", gap: 6, justifyItems: "center" }}>
                  <div style={S.cellDay}>{d.getDate()}</div>
                  {hasAny && <span style={S.calDot} aria-hidden="true" />}
                  {!!uniq.length && (
                    <div style={S.groupsRow} aria-label="운동 부위 미리보기">
                      {uniq.slice(0, 3).map((t, idx) => (
                        <span key={idx} style={S.pill}>{t}</span>
                      ))}
                      {uniq.length > 3 && (
                        <span style={S.more}>+{uniq.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 액션 */}
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 10 }}>
          <button onClick={onClose} style={S.secondary}>닫기</button>
        </div>
      </div>
    </div>
  );
}

/* Utilities */
function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* Styles */
const S: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.45)",
    display: "grid",
    placeItems: "center",
    zIndex: 60,
    padding: 12,
  },
  sheet: {
    width: "min(560px, 96vw)",
    background: C.cream,
    borderRadius: 20,
    border: `1px solid ${C.line}`,
    boxShadow: "0 30px 80px rgba(0,0,0,.25)",
    padding: 16,
  },
  calHeader: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: 10,
    background: C.sky,
    borderRadius: 14,
    padding: "10px 12px",
  },
  navBtn: {
    padding: "6px 10px",
    borderRadius: 10,
    border: `1px solid ${C.line}`,
    background: C.white,
    cursor: "pointer",
    color: C.navy,
    fontWeight: 900,
  },
  weekdayRow: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    textAlign: "center",
    fontSize: 12,
    color: C.mute,
    padding: "0 4px",
  },
  weekdayCell: { padding: "4px 0" },
  grid: { marginTop: 8, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 },
  cell: {
    minHeight: 86,
    borderRadius: 14,
    border: `1px solid ${C.line}`,
    background: C.sky,
    cursor: "pointer",
    padding: 8,
    textAlign: "center",
  },
  cellThis: { background: C.cream },
  cellOther: { background: "#f2f4f7", opacity: 0.65 },
  cellActive: { outline: `2px solid ${C.primary}` },
  cellDay: { fontSize: 12, fontWeight: 800, color: C.navy },
  calDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    background: C.primary,
    boxShadow: "0 0 0 3px rgba(60,186,186,.18)",
  },
  groupsRow: {
    display: "flex",
    gap: 4,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  pill: {
    padding: "2px 6px",
    borderRadius: 999,
    background: "#fff",
    border: `1px solid ${C.line}`,
    fontSize: 10,
    lineHeight: 1.4,
    color: C.navy,
    fontWeight: 800,
  },
  more: {
    padding: "2px 6px",
    borderRadius: 999,
    background: C.primary,
    color: "#fff",
    fontSize: 10,
    lineHeight: 1.4,
    fontWeight: 800,
  },
  secondary: {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${C.line}`,
    background: C.white,
    color: C.navy,
    cursor: "pointer",
    fontWeight: 800,
  },
};
