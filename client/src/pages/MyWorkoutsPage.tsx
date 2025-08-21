// client/src/pages/MyWorkoutsPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ExerciseCard, { RoutineItem } from "../components/workout/ExerciseCard";
import { workoutApi, workoutLogsApi, type Workout } from "../lib/api";
import { useAuth, getExerciseStartDate } from "../store/auth";
import { toYmd, daysSince } from "../utils/daysSince";

const C = {
  primary: "#3cbaba",
  navy: "#163353",
  pink: "#ffb7c5",
  peach: "#ffd8b5",
  cream: "#fff7ec",
  sky: "#e9f7f6",
  line: "#e8edf3",
  text: "#23384d",
  mute: "#6b7280",
  white: "#fff",
};

const GROUPS: Array<Workout["group"]> = ["back", "shoulder", "chest", "arm", "legs", "cardio"];
const GROUP_LABEL: Record<Workout["group"], string> = {
  back: "등",
  shoulder: "어깨",
  chest: "가슴",
  arm: "팔",
  legs: "하체",
  cardio: "유산소",
};

const defaultSets = () =>
  Array.from({ length: 3 }, () => ({ weight: 0, reps: 10, done: false }));

// ✅ 완료표시용 확장 타입
type RoutineEx = RoutineItem & { done?: boolean };

export default function MyWorkoutsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const startISO = useMemo(
    () => user?.exerciseStartDate || user?.createdAt || getExerciseStartDate() || null,
    [user]
  );
  const dplus = useMemo(() => (startISO ? daysSince(startISO) : 0), [startISO]);

  // URL 쿼리로 부위 필터와 검색어 유지
  const [params, setParams] = useSearchParams();
  const group = (params.get("group") || "all") as "all" | Workout["group"];
  const q = params.get("q") || "";

  // ⬇️ 한글 IME 안전 입력 (조합 중에는 쿼리 반영 지연)
  const [qInput, setQInput] = useState(q);
  const composingRef = useRef(false);
  useEffect(() => {
    if (!composingRef.current) setQInput(q);
  }, [q]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 600);
    };
    onResize(); // 초기값 설정
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 날짜/타이머
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateKey = useMemo(() => toYmd(selectedDate), [selectedDate]);
  const [calOpen, setCalOpen] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    if (!isRunning || !startAt) return;
    const id = setInterval(() => {
      setElapsedSec(Math.max(0, Math.floor((Date.now() - startAt) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, startAt]);
  const fmtElapsed = useMemo(() => {
    const m = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
    const s = String(elapsedSec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [elapsedSec]);
  const handleStart = () => {
    setElapsedSec(0);
    setStartAt(Date.now());
    setIsRunning(true);
  };
  const handleStop = () => {
    setIsRunning(false);
    setStartAt(null);
  };

  // 전체 운동 라이브러리
  const [all, setAll] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(false);
  const [libOpen, setLibOpen] = useState(true); // 라이브러리 접기/펼치기

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    workoutApi
      .list({ group: group === "all" ? undefined : group, q: q || undefined })
      .then((res) => !ignore && setAll(res || []))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [group, q]);

  // 내 루틴
  const [routine, setRoutine] = useState<RoutineEx[]>([]);

  // 날짜 변경 시 기록 로드
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const log = await workoutLogsApi.get(dateKey);
        if (ignore || !log) {
          setRoutine([]);
          setElapsedSec(0);
          setIsRunning(false);
          setStartAt(null);
          return;
        }
        const entries = (log.entries || []).map((e: any) => ({
          id: e.id || e.exerciseId,
          title: e.title,
          group: e.group,
          sets: e.sets || defaultSets(),
          done: false, // ✅ 초기 로딩 시 완료 플래그 기본값
        })) as RoutineEx[];
        setRoutine(entries);
        setElapsedSec(Number(log.durationSec || 0));
        setIsRunning(false);
        setStartAt(null);
      } catch {
        setRoutine([]);
        setElapsedSec(0);
        setIsRunning(false);
        setStartAt(null);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [dateKey]);

  // esc 뒤로가기 (열렸을 때만)
  useEffect(() => {
    if (!calOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        window.history.back();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [calOpen]);

  // 자동 저장(디바운스) — 타이머 멈춰 있을 때만
  const saveTimer = useRef<number | null>(null);
  const lastSavedRef = useRef<string>("");
  useEffect(() => {
    if (isRunning) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      const payload = {
        entries: routine.map((r) => ({
          exerciseId: r.id,
          title: r.title,
          group: r.group,
          sets: r.sets,
        })),
        durationSec: elapsedSec,
        startedAt: null as string | null,
        finishedAt: null as string | null,
      };
      const key = JSON.stringify({ dateKey, payload });
      if (key === lastSavedRef.current) return;
      try {
        await workoutLogsApi.save(dateKey, payload);
        lastSavedRef.current = key;
      } catch {
        // no-op
      }
    }, 600);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [routine, elapsedSec, isRunning, dateKey]);

  // 검색/필터 핸들러
  const setQuery = (nextQ: string) => {
    const np = new URLSearchParams(params);
    if (nextQ) np.set("q", nextQ);
    else np.delete("q");
    setParams(np, { replace: true });
  };
  const setGroup = (g: "all" | Workout["group"]) => {
    const np = new URLSearchParams(params);
    if (g === "all") np.delete("group");
    else np.set("group", g);
    setParams(np, { replace: true });
  };

  // ⬇️ IME 안전 입력 이벤트
  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.currentTarget.value;
    setQInput(v);
    if (!composingRef.current) setQuery(v);
  };
  const onCompositionStart = () => {
    composingRef.current = true;
  };
  const onCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    composingRef.current = false;
    const v = (e.target as HTMLInputElement).value;
    setQInput(v);
    setQuery(v);
  };
  const onSearchBlur = () => {
    if (!composingRef.current) setQuery(qInput);
  };

  return (
    <section style={S.wrap}>
      {/* 상단 고정 */}
      <div style={S.stickyWrap}>
        <header
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            padding: 16,
            gap: isMobile ? 8 : 0,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              ...S.backBtn,
              width: isMobile ? 36 : 44,
              height: isMobile ? 36 : 44,
              minWidth: isMobile ? 36 : 44,
              minHeight: isMobile ? 36 : 44,
              fontSize: isMobile ? 16 : 18,
            }}
            aria-label="뒤로"
          >
            ←
          </button>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: isMobile ? "flex-start" : "center",
            }}
          >
            <div
              style={{
                ...S.title,
                fontSize: isMobile ? 20 : 24,
              }}
            >
              나만의 운동
            </div>
            <div
              style={{
                ...S.subTitle,
                fontSize: isMobile ? 12 : 13,
                marginTop: 4,
              }}
            >
              {dateKey}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: isMobile ? 12 : 0,
            }}
          >
            <button
              style={{
                ...S.calendarBtn,
                padding: isMobile ? "6px 12px" : "8px 10px",
                fontSize: isMobile ? 14 : 16,
              }}
              onClick={() => setCalOpen(true)}
              aria-label="캘린더"
            >
              📅 기록
            </button>
            <div style={S.chips}>
              <span style={S.chip}>오늘 {toYmd(new Date())}</span>
              <span style={{ ...S.chip, background: C.primary, color: C.white }}>
                D+{dplus}
              </span>
            </div>
          </div>
        </header>

        {/* 타이머 */}
        <div style={S.timerBar}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: C.navy, fontSize: 18 }}>
            ⏱ <strong style={{ fontSize: 22 }}>{fmtElapsed}</strong>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {!isRunning ? (
              <button style={S.cta} onClick={handleStart}>
                운동 시작
              </button>
            ) : (
              <button style={S.ctaDanger} onClick={handleStop}>
                운동 종료
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div style={S.content}>
        {/* 운동 라이브러리 (전체) + 토글 */}
        <div style={S.sectionHeader}>
          <div style={S.sectionTitle}>운동 라이브러리</div>
          <button
            type="button"
            onClick={() => setLibOpen((v) => !v)}
            aria-expanded={libOpen}
            style={S.toggleBtn}
          >
            <span
              style={{
                transform: `rotate(${libOpen ? 180 : 0}deg)`,
                display: "inline-block",
                transition: "transform .2s",
              }}
            >
              ▾
            </span>
            <span style={{ marginLeft: 6 }}>{libOpen ? "접기" : "펼치기"}</span>
          </button>
        </div>

        {/* 필터/검색 + 카드 목록 (접힘 처리) */}
        {libOpen && (
          <>
            {/* 필터/검색 */}
            <div style={S.filters}>
              <div style={S.groupChips}>
                <button
                  onClick={() => setGroup("all")}
                  style={{ ...S.groupChip, ...(group === "all" ? S.groupChipOn : {}) }}
                >
                  전체
                </button>
                {GROUPS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGroup(g)}
                    style={{ ...S.groupChip, ...(group === g ? S.groupChipOn : {}) }}
                  >
                    {GROUP_LABEL[g]}
                  </button>
                ))}
              </div>

              <input
                value={qInput}
                onChange={onSearchChange}
                onCompositionStart={onCompositionStart}
                onCompositionEnd={onCompositionEnd}
                onBlur={onSearchBlur}
                placeholder="운동명 검색"
                style={S.search}
                aria-label="운동 검색"
              />
            </div>

            {/* 카드 목록 (responsive grid 적용) */}
            <div
              style={{
                ...S.recoGrid,
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
              }}
            >
              {loading && <div style={{ color: C.mute }}>불러오는 중…</div>}
              {!loading &&
                all.map((w) => (
                  <div key={w.id} style={S.recoCard}>
                    <div style={S.recoThumb}>
                      {w.image ? <img src={w.image} alt="" style={S.img} /> : "🏋️"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={S.recoTitle}>{w.title}</div>
                      <div style={S.recoMeta}>{GROUP_LABEL[w.group]}</div>
                    </div>
                    <button
                      style={S.addBtn}
                      onClick={() =>
                        setRoutine((rs) => [
                          ...rs,
                          {
                            id: w.id,
                            title: w.title,
                            group: w.group as RoutineItem["group"],
                            sets: defaultSets(),
                            done: false, // 새로 담길 때 기본 미완료
                          },
                        ])
                      }
                    >
                      + 담기
                    </button>
                  </div>
                ))}
              {!loading && all.length === 0 && (
                <div style={{ color: C.mute }}>검색 결과가 없어요.</div>
              )}
            </div>
          </>
        )}

        {/* 내 루틴 (responsive grid 적용) */}
        <div style={{ marginTop: 16 }}>
          <div style={S.sectionTitle}>내 루틴</div>
          <div
            style={{
              ...S.routineGrid,
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
            }}
          >
            {routine.map((it, idx) => {
              const allSetsDone = it.sets.length > 0 && it.sets.every((s) => s.done);
              const cardDone = !!it.done || allSetsDone;

              return (
                <div
                  key={`${it.id}-${idx}`}
                  style={{
                    ...S.exerciseWrap,
                    outline: cardDone ? `2px solid ${C.primary}` : `2px solid transparent`,
                    opacity: cardDone ? 0.96 : 1,
                  }}
                >
                  {/* 순서 뱃지 */}
                  <div style={S.orderBadge} aria-hidden>
                    {idx + 1}
                  </div>

                  {/* 완료 토글 */}
                  <button
                    title={cardDone ? "완료 해제" : "운동 완료"}
                    aria-pressed={cardDone}
                    onClick={() =>
                      setRoutine((rs) =>
                        rs.map((x, i) => (i === idx ? { ...x, done: !cardDone } : x))
                      )
                    }
                    style={{
                      ...S.doneToggle,
                      background: cardDone ? C.primary : C.white,
                      color: cardDone ? "#fff" : C.navy,
                      borderColor: cardDone ? C.primary : C.line,
                    }}
                  >
                    ✓
                  </button>

                  <ExerciseCard
                    item={it}
                    onChange={(n) =>
                      setRoutine((rs) =>
                        rs.map((x, i) => (i === idx ? { ...n, done: it.done } : x)) // done 유지
                      )
                    }
                    onRemove={() => setRoutine((rs) => rs.filter((_, i) => i !== idx))}
                  />
                </div>
              );
            })}
          </div>
          {routine.length === 0 && (
            <div style={{ color: C.mute, padding: "8px 2px" }}>
              담긴 운동이 없어요. {libOpen ? "위에서 원하는 운동을 검색해서" : "운동 라이브러리를 펼친 뒤"} “+ 담기” 해보세요.
            </div>
          )}
        </div>
      </div>

      {/* 캘린더 모달 */}
      {calOpen && (
        <CalendarModal
          date={selectedDate}
          onClose={() => setCalOpen(false)}
          onPick={(d) => {
            setSelectedDate(d);
            setCalOpen(false);
            setIsRunning(false);
            setStartAt(null);
          }}
        />
      )}
    </section>
  );
}

/** 캘린더 모달 (월간 뷰 / 기록 도트 + 대표 부위 1개 칩) */
function CalendarModal({
  date,
  onClose,
  onPick,
}: {
  date: Date;
  onClose: () => void;
  onPick: (d: Date) => void;
}) {
  // 대표 우선순위(가슴 → 등 → 하체)
  const MAIN_GROUPS: Workout["group"][] = ["chest", "back", "legs"];

  const [view, setView] = useState(new Date(date.getFullYear(), date.getMonth(), 1));
  const [monthly, setMonthly] = useState<any[]>([]);
  const [dailyGroups, setDailyGroups] = useState<Record<string, Array<Workout["group"]>>>({});

  const monthKey = useMemo(
    () => `${view.getFullYear()}-${String(view.getMonth() + 1).padStart(2, "0")}`,
    [view]
  );

  // ✅ 월별 집계 + 날짜별 그룹 요약을 한 번에 가져오기 (중요: { groups: true })
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const list: any[] = await workoutLogsApi.monthly(monthKey, { groups: true });
        if (!ignore) {
          setMonthly(list || []);
          const map: Record<string, Array<Workout["group"]>> = {};
          (list || []).forEach((d) => {
            if (d?.date) map[d.date] = (d.groups || []).slice(0, 8);
          });
          setDailyGroups(map);
        }
      } catch {
        if (!ignore) {
          setMonthly([]);
          setDailyGroups({});
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [monthKey]);

  const start = new Date(view);
  const firstDay = new Date(view.getFullYear(), view.getMonth(), 1);
  const startWeekday = firstDay.getDay();
  start.setDate(start.getDate() - startWeekday);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const groupsOf = (d: Date) => dailyGroups[toYmd(d)] || [];
  const hasLog = (d: Date) => {
    const ymd = toYmd(d);
    if (dailyGroups[ymd]?.length) return true;
    return monthly.some((x) => x.date === ymd && (x.count > 0 || x.sec > 0));
  };
  const isSelected = (d: Date) => toYmd(d) === toYmd(date);
  const isToday = (d: Date) => toYmd(d) === toYmd(new Date());

  const pickOne = (groups: Workout["group"][]): Workout["group"] | null => {
    for (const g of MAIN_GROUPS) if (groups.includes(g)) return g;
    return groups[0] ?? null;
  };

  return (
    <div style={S.calBackdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.calSheet} role="dialog" aria-modal="true" aria-label="운동 기록 캘린더">
        <div style={S.calHeader}>
          <button
            style={S.calNav}
            onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          >
            ←
          </button>
          <div style={{ fontWeight: 900, color: C.navy }}>
            {view.getFullYear()}년 {view.getMonth() + 1}월
          </div>
          <button
            style={S.calNav}
            onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          >
            →
          </button>
        </div>

        <div style={S.calWeekRow}>
          {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
            <div key={w} style={{ fontWeight: 800, color: C.mute }}>
              {w}
            </div>
          ))}
        </div>

        <div style={S.calGrid}>
          {cells.map((d, i) => {
            const inMonth = d.getMonth() === view.getMonth();
            const gs = groupsOf(d);
            const marked = hasLog(d);
            const today = isToday(d);
            const selected = isSelected(d);
            const chosen = pickOne(gs);

            return (
              <button
                key={i}
                onClick={() => onPick(d)}
                title={gs.length ? `${toYmd(d)} · ${gs.map((g) => GROUP_LABEL[g]).join(", ")}` : toYmd(d)}
                style={{
                  ...S.calCell,
                  opacity: inMonth ? 1 : 0.45,
                  background: C.sky,
                  borderColor: selected ? C.primary : today ? "#8fdede" : C.line,
                  boxShadow: selected ? "0 0 0 2px rgba(60,186,186,.25) inset" : "none",
                  color: C.navy,
                }}
              >
                <div style={{ display: "grid", placeItems: "center", gap: 4 }}>
                  <span style={{ fontWeight: 900 }}>{d.getDate()}</span>
                  {marked && <span style={S.calDot} aria-hidden="true" />}
                  {chosen && (
                    <div style={S.pillWrap}>
                      <span style={S.pill}>{GROUP_LABEL[chosen]}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 10 }}>
          <button onClick={onClose} style={S.calClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- 스타일 --------------------------- */
const S: Record<string, React.CSSProperties> = {
  wrap: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "0 20px 40px",
    fontFamily: "'BMJUA', sans-serif",
    overflow: "hidden",
  },
  stickyWrap: { position: "sticky", top: 16, zIndex: 20, display: "grid", gap: 10 },
  header: { display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "center" },
  backBtn: {
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 14,
    border: "none",
    background: C.pink,
    color: C.white,
    cursor: "pointer",
    fontSize: 18,
    boxShadow: "0 4px 10px rgba(0,0,0,.08)",
    display: "grid",
    placeItems: "center",
    padding: 0,
  },
  titleBox: { display: "flex", flexDirection: "column", alignItems: "center" },
  title: { fontWeight: 900, color: C.navy, fontSize: 24, lineHeight: 1.1 },
  subTitle: { color: C.mute, fontSize: 13, marginTop: 2 },

  rightHeader: { display: "flex", gap: 8, alignItems: "center" },
  calendarBtn: {
    padding: "8px 10px",
    borderRadius: 12,
    border: `1px solid ${C.line}`,
    background: C.white,
    color: C.navy,
    cursor: "pointer",
    fontWeight: 800,
  },

  chips: { display: "flex", gap: 8, alignItems: "center" },
  chip: {
    background: C.cream,
    color: C.text,
    padding: "8px 12px",
    borderRadius: 999,
    border: `1px solid ${C.line}`,
    fontSize: 12,
  },
  timerBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    border: `1px solid ${C.line}`,
    borderRadius: 16,
    background: C.white,
    boxShadow: "0 8px 16px rgba(0,0,0,.06)",
  },
  cta: {
    padding: "12px 18px",
    borderRadius: 14,
    border: `1px solid ${C.primary}`,
    background: C.primary,
    color: C.white,
    cursor: "pointer",
    fontSize: 16,
  },
  ctaDanger: {
    padding: "12px 18px",
    borderRadius: 14,
    border: "1px solid #ef4444",
    background: "#ef4444",
    color: C.white,
    cursor: "pointer",
    fontSize: 16,
  },

  content: { marginTop: 16, paddingTop: 0 },

  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", margin: "8px 0 6px" },
  sectionTitle: { fontWeight: 900, color: C.navy, fontSize: 18 },

  toggleBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 2,
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${C.line}`,
    background: C.white,
    color: C.navy,
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 13,
  },

  /* 필터/검색 */
  filters: {
    display: "grid",
    gap: 10,
    marginBottom: 8,
  },
  groupChips: { display: "flex", flexWrap: "wrap", gap: 6 },
  groupChip: {
    padding: "8px 12px",
    borderRadius: 999,
    border: `1px solid ${C.line}`,
    background: C.white,
    color: C.navy,
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 13,
  },
  groupChipOn: {
    background: C.primary,
    color: C.white,
    borderColor: C.primary,
  },
  search: {
    height: 40,
    borderRadius: 12,
    border: `1px solid ${C.line}`,
    background: C.white,
    outline: "none",
    padding: "0 12px",
    color: C.navy,
    fontWeight: 700,
  },

  /* 2열 고정 라이브러리 */
  recoGrid: { display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
  recoCard: {
    display: "grid",
    gridTemplateColumns: "72px 1fr auto",
    gap: 10,
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    background: C.sky,
    border: `1px solid ${C.line}`,
  },
  recoThumb: {
    width: 72,
    height: 52,
    borderRadius: 12,
    background: C.white,
    border: `1px solid ${C.line}`,
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
  },
  img: { width: "100%", height: "100%", objectFit: "cover" } as React.CSSProperties,
  recoTitle: { fontWeight: 800, color: C.text, fontSize: 16 },
  recoMeta: { color: C.mute, fontSize: 13 },
  addBtn: {
    height: 40,
    padding: "0 14px",
    borderRadius: 12,
    border: `1px solid ${C.navy}`,
    background: C.white,
    color: C.navy,
    cursor: "pointer",
    fontWeight: 800,
  },

  /* 내 루틴 (2열) + 순서 뱃지 */
  routineGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 },
  orderBadge: {
    position: "absolute",
    left: 8,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 999,
    background: C.primary,
    color: C.white,
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    boxShadow: "0 3px 10px rgba(60,186,186,.3)",
    zIndex: 1,
  },

  /* ✅ 완료표시용 래퍼/토글 추가 */
  exerciseWrap: {
    position: "relative",
    borderRadius: 18,
  },
  doneToggle: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 34,
    height: 34,
    minWidth: 34,
    borderRadius: 999,
    border: `1px solid ${C.line}`,
    background: C.white,
    cursor: "pointer",
    fontWeight: 900,
    boxShadow: "0 4px 10px rgba(0,0,0,.05)",
    zIndex: 2,
  } as React.CSSProperties,

  /** 캘린더 스타일 */
  calBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.45)",
    display: "grid",
    placeItems: "center",
    zIndex: 60,
    padding: 12,
  },
  calSheet: {
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
  calNav: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: `1px solid ${C.line}`,
    background: C.white,
    cursor: "pointer",
    color: C.navy,
    fontWeight: 900,
  },
  calWeekRow: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    textAlign: "center",
    fontSize: 12,
    color: C.mute,
    padding: "0 4px",
  },
  calGrid: { marginTop: 8, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 },
  calCell: {
    minHeight: 78,
    borderRadius: 14,
    border: `1px solid ${C.line}`,
    background: C.sky,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    fontWeight: 700,
    padding: 6,
  },
  calDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    background: C.primary,
    boxShadow: "0 0 0 3px rgba(60,186,186,.18)",
  },
  pillWrap: { marginTop: 2, display: "flex", justifyContent: "center" },
  pill: {
    padding: "2px 8px",
    borderRadius: 999,
    background: "#fff",
    border: `1px solid ${C.line}`,
    fontSize: 11,
    fontWeight: 800,
    color: C.navy,
    lineHeight: 1.3,
  },
  calClose: {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${C.line}`,
    background: C.white,
    color: C.navy,
    cursor: "pointer",
    fontWeight: 800,
  },
};
