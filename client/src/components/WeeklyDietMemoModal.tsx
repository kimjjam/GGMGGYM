import { useEffect, useRef, useState } from "react";
import { api, diaryApi } from "../lib/api";
import { useAuth } from "../store/auth";

const NAMES = ["일", "월", "화", "수", "목", "금", "토"];

const fmt = (y: number, m: number, d: number): string =>
  `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 일(0) 시작
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekDates(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from(
    { length: 7 },
    (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  );
}

type WeekDataItem = {
  date: string;   // 'YYYY-MM-DD' (로컬 기준)
  weekday: number;
  diet: string;
  memo: string;
};

// content(JSON 문자열) ↔ 객체
const parseContent = (s?: string) => {
  try {
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
};

type WeeklyDietMemoModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function WeeklyDietMemoModal({
  isOpen,
  onClose,
}: WeeklyDietMemoModalProps) {
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [weekData, setWeekData] = useState<WeekDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const token = useAuth((s) => s.token); // ✅ 토큰 준비 후만 API 호출

  const dates = weekDates(anchor);
  const rangeStr = `${fmt(
    dates[0].getFullYear(),
    dates[0].getMonth() + 1,
    dates[0].getDate()
  )} ~ ${fmt(
    dates[6].getFullYear(),
    dates[6].getMonth() + 1,
    dates[6].getDate()
  )}`;

  const todayKey = api.toYMD(new Date());

  // 최신 상태를 디바운스 타이머에서 안전하게 참조하기 위한 ref
  const weekDataRef = useRef<WeekDataItem[]>(weekData);
  useEffect(() => {
    weekDataRef.current = weekData;
  }, [weekData]);

  // 주간 데이터 로드
  useEffect(() => {
    if (!isOpen || !token) return;

    const keys = dates.map((d) => api.toYMD(d));
    const from = keys[0];
    const to = keys[keys.length - 1];

    let alive = true;
    (async () => {
      setLoading(true);
      try {
        // 서버에서 주간 범위 한번에 가져오기
        const list = await diaryApi.list(from, to); // [{ date, content, ... }, ...]
        if (!alive) return;

        // date → {diet,memo} 맵
        const map = new Map<string, { diet?: string; memo?: string }>();
        const arr = Array.isArray(list) ? list : [];
        for (const doc of arr) {
          const c = parseContent(doc?.content);
          map.set(doc.date, { diet: String(c?.diet ?? ""), memo: String(c?.memo ?? "") });
        }

        // 주간 7개 셀 채우기
        const next: WeekDataItem[] = dates.map((d) => {
          const key = api.toYMD(d);
          const base = map.get(key) || {};
          return {
            date: key,
            weekday: d.getDay(),
            diet: base.diet ?? "",
            memo: base.memo ?? "",
          };
        });

        setWeekData(next);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isOpen, token, anchor]); // 주간/열림/토큰이 바뀌면 재조회

  // 디바운스 저장 타이머
  const timers = useRef<Record<string, number>>({});

  // 입력 변경 + 저장
  const onChangeField = (
    index: number,
    field: keyof Pick<WeekDataItem, "diet" | "memo">,
    value: string
  ) => {
    // 1) 화면 즉시 반영
    setWeekData((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });

    // 2) 디바운스 저장
    const dayKey = weekDataRef.current[index]?.date || api.toYMD(dates[index]);
    if (timers.current[dayKey]) window.clearTimeout(timers.current[dayKey]);

    timers.current[dayKey] = window.setTimeout(async () => {
      try {
        const current = weekDataRef.current.find((x) => x.date === dayKey) || {
          diet: "",
          memo: "",
        };
        const payload = {
          title: "",
          content: JSON.stringify({
            diet: current.diet || "",
            memo: current.memo || "",
          }),
        };
        await diaryApi.save(dayKey, payload);
        // console.log("saved", dayKey, payload);
      } catch (err) {
        console.error("Diary save failed", err);
      }
    }, 400);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(2px)",
          zIndex: 3000,
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "#f3e1c1",
          borderRadius: 20,
          border: "4px solid #7e5a3e",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          padding: 24,
          maxWidth: 940,
          width: "90vw",
          maxHeight: "90vh",
          overflowY: "auto",
          zIndex: 3001,
          fontFamily: "'BMJUA', sans-serif",
          color: "#5b4027",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            padding: "0 16px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: "bold",
                backgroundColor: "#fcdcad",
                padding: "6px 14px",
                borderRadius: 12,
                border: "3px solid #7e5a3e",
                userSelect: "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              몽글이 일기장 {loading ? "· 불러오는 중…" : ""}
            </h2>
            <button
              aria-label="이전 주"
              onClick={() =>
                setAnchor((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7))
              }
              style={{
                border: "3px solid #7e5a3e",
                backgroundColor: "#fff7e8",
                borderRadius: 10,
                padding: "6px 12px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 16,
                color: "#5b4027",
              }}
            >
              ◀
            </button>
          </div>
          <div
            style={{
              flexGrow: 1,
              margin: "0 16px",
              border: "3px solid #7e5a3e",
              backgroundColor: "#fff7e8",
              padding: "6px 20px",
              borderRadius: 10,
              fontWeight: "bold",
              fontSize: 16,
              textAlign: "center",
              userSelect: "none",
              whiteSpace: "nowrap",
              minWidth: 170,
            }}
          >
            {rangeStr}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <button
              aria-label="다음 주"
              onClick={() =>
                setAnchor((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7))
              }
              style={{
                border: "3px solid #7e5a3e",
                backgroundColor: "#fff7e8",
                borderRadius: 10,
                padding: "6px 12px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 16,
                color: "#5b4027",
              }}
            >
              ▶
            </button>
            <button
              aria-label="이번 주로 이동"
              onClick={() => setAnchor(new Date())}
              style={{
                border: "3px solid #7e5a3e",
                backgroundColor: "#fff7e8",
                borderRadius: 10,
                padding: "6px 12px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 22,
                color: "#5b4027",
                marginRight: -20,
              }}
            >
              이번 주
            </button>
            <button
              onClick={onClose}
              aria-label="팝업 닫기"
              style={{
                position: "relative",
                left: 15,
                top: 2,
                width: 40,
                height: 40,
                background: "transparent",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
                color: "#7e5a3e",
                fontWeight: "bold",
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
        </div>



        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {dates.map((d, i) => {
          const key = api.toYMD(d);
          const isToday = key === todayKey;
          return (
            <section
              key={key}
              style={{
                border: "3px dashed #7e5a3e",
                borderRadius: 14,
                backgroundColor: "#fff7e8",
                padding: 12,
                minHeight: 210,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                userSelect: "text",
                marginRight: -5,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: 18,
                    padding: "4px 10px",
                    borderRadius: 12,
                    border: "3px solid #7e5a3e",
                    backgroundColor: isToday ? "#a4d9a4" : "#fcdcad",
                    color: "#5b4027",
                    userSelect: "none",
                  }}
                >
                  {NAMES[d.getDay()]}
                </div>
                <div style={{ fontWeight: "bold", opacity: 0.8, userSelect: "none" }}>
                  {fmt(d.getFullYear(), d.getMonth() + 1, d.getDate())}
                </div>
              </div>

              <div style={{ flexGrow: 1 }}>
                <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 6 }}>식단</div>
                <textarea
                  placeholder="예) 아침: 오트밀 · 점심: 닭가슴살샐러드 · 저녁: 연어덮밥"
                  value={weekData[i]?.diet || ""}
                  onChange={(e) => onChangeField(i, "diet", e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: 60,
                    resize: "vertical",
                    border: "1px solid #d5b895",
                    borderRadius: 8,
                    padding: 6,
                    fontFamily: "'BMJUA', cursive",
                    fontSize: 15,
                    lineHeight: 1.5,
                    backgroundColor: "#fffaf0",
                    color: "#5b4027",
                    marginLeft: "-6px",
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 6 }}>메모</div>
                <textarea
                  placeholder="간단한 메모를 적어보세요 :)"
                  value={weekData[i]?.memo || ""}
                  onChange={(e) => onChangeField(i, "memo", e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: 60,
                    resize: "vertical",
                    border: "1px solid #d5b895",
                    borderRadius: 8,
                    padding: 6,
                    fontFamily: "'BMJUA', cursive",
                    fontSize: 15,
                    lineHeight: 1.5,
                    backgroundColor: "#fffaf0",
                    color: "#5b4027",
                    marginLeft: "-6px",
                  }}
                />
              </div>
            </section>
          );
        })}

        {/* 마지막 칸 뒤에 mongleeat 이미지 추가 */}
        <div
          key="mongleeat"
          style={{
            backgroundColor: "transparent",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 210,
            padding: 12,
            userSelect: "none",
            cursor: "default",
          }}
        >
          <img
            src="../images/mongleeat.png"
            alt="몽글이 먹는 모습"
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
</>
);
}