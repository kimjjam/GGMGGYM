// client/src/pages/WorkoutsPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ExerciseCard, { RoutineItem } from "../components/workout/ExerciseCard";
import ExercisePickerDrawer, { PickerItem } from "../components/workout/ExercisePickerDrawer";
import {
  api,
  getWorkouts,
  workoutApi,
  workoutLogsApi,
  type Workout,
  type Difficulty,
  type CalendarDaySummary,
} from "../lib/api";
import { toYmd, daysSince } from "../utils/daysSince";
import { useAuth, getExerciseStartDate } from "../store/auth";

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

const DIFF_LABEL: Record<Difficulty, string> = { easy: "살살", mid: "적당히", hard: "빡세게" };
const GROUP_LABEL: Record<Workout["group"], string> = {
  back: "등",
  shoulder: "어깨",
  chest: "가슴",
  arm: "팔",
  legs: "하체",
  cardio: "유산소",
};

// 캘린더에는 이 3개만 노출
const MAIN_GROUPS: Array<Workout["group"]> = ["chest", "back", "legs"];
// 서버 응답 파싱용 전체 그룹 목록
const ALL_GROUPS: Array<Workout["group"]> = ["chest", "back", "shoulder", "arm", "legs", "cardio"];

// 기본 세트(3x10)
const defaultSets = () =>
  Array.from({ length: 3 }, () => ({ weight: 0, reps: 10, done: false }));

// 페이지 내부에서 쓰는 확장 타입(완료표시용 done 필드만 추가)
type RoutineEx = RoutineItem & { done?: boolean };

export default function WorkoutsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const startISO = useMemo(
    () => user?.exerciseStartDate || user?.createdAt || getExerciseStartDate() || null,
    [user]
  );
  const dplus = useMemo(() => (startISO ? daysSince(startISO) : 0), [startISO]);

  const [params] = useSearchParams();
  const group = (params.get("group") || undefined) as Workout["group"] | undefined;
  const difficulty = (params.get("difficulty") || undefined) as Difficulty | undefined;

  /** 날짜 상태 */
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateKey = useMemo(() => toYmd(selectedDate), [selectedDate]);
  const [calOpen, setCalOpen] = useState(false);

  /** 타이머 */
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

  useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      window.history.back(); // 브라우저 이전 페이지로 이동
    }
  };
  window.addEventListener("keydown", onKeyDown);
  return () => {
    window.removeEventListener("keydown", onKeyDown);
  };
}, []);


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

  /** 추천 */
  const [reco, setReco] = useState<Workout[]>([]);
  const [loadingReco, setLoadingReco] = useState(false);
  const showBlank = !!group && !difficulty;

  useEffect(() => {
    let ignore = false;
    if (!difficulty) {
      setReco([]);
      setLoadingReco(false);
      return;
    }
    setLoadingReco(true);
    getWorkouts({ group, difficulty })
      .then((res) => !ignore && setReco(res || []))
      .finally(() => !ignore && setLoadingReco(false));
    return () => {
      ignore = true;
    };
  }, [group, difficulty]);

  /** 전체 목록 (드로어용) */
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  useEffect(() => {
    let ignore = false;
    setLoadingAll(true);
    getWorkouts({ group })
      .then((res) => !ignore && setAllWorkouts(res || []))
      .finally(() => !ignore && setLoadingAll(false));
    return () => {
      ignore = true;
    };
  }, [group]);

  /** 내 루틴 */
  const [routine, setRoutine] = useState<RoutineEx[]>([]);

  /** 날짜 변경 시 서버에서 기록 로드 (그룹별 분리) */
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const log = await workoutLogsApi.get(dateKey, group);
        if (ignore || !log) {
          setRoutine([]);
          setElapsedSec(0);
          setIsRunning(false);
          setStartAt(null);
          return;
        }
        const entries = (log.entries || []).map((e: any) => ({
          id: e.exerciseId || e.id,
          title: e.title,
          group: e.group,
          sets: e.sets || defaultSets(),
          done: false,
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
  }, [dateKey, group]);

  /** 추천 접기/펼치기 */
  const [recoOpen, setRecoOpen] = useState(false);
  useEffect(() => {
    setRecoOpen(false);
  }, [group, difficulty]);

  /** 드로어 아이템 */
  const pickerItems: PickerItem[] = useMemo(() => {
    const baseSource: Workout[] = difficulty ? reco || [] : allWorkouts || [];
    const base = baseSource.map((r) => ({
      id: r.id,
      title: r.title,
      group: r.group,
      image: r.image,
    }));
    return base.length
      ? base
      : [
          { id: "bench-press", title: "벤치프레스", group: "chest" },
          { id: "lat-pulldown", title: "랫풀다운", group: "back" },
          { id: "db-lateral-raise", title: "덤벨 레터럴 레이즈", group: "shoulder" },
          { id: "barbell-curl", title: "바벨 컬", group: "arm" },
          { id: "leg-press", title: "레그 프레스", group: "legs" },
        ];
  }, [difficulty, reco, allWorkouts]);

  const subtitle = useMemo(() => {
    const parts = [toYmd(dateKey)];
    if (group) parts.push(GROUP_LABEL[group]);
    if (difficulty) parts.push(DIFF_LABEL[difficulty]);
    return parts.join(" · ");
  }, [group, difficulty]);

  /** 자동 저장(디바운스) — 그룹별로 나눠 저장 + 득근캘린더 연동 */
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
      const key = JSON.stringify({ dateKey, group, payload });
      if (key === lastSavedRef.current) return;
      try {
        // 1) 운동 로그 저장
        await workoutLogsApi.save(dateKey, payload, group);

        // 2) 득근캘린더 자동 연동
        const hasWorkout =
          (payload.durationSec ?? 0) > 0 ||
          (payload.entries ?? []).some((e) =>
            (e.sets ?? []).some(
              (s) => s?.done === true || (s?.reps ?? 0) > 0 || (s?.weight ?? 0) > 0
            )
          );
        await api.setDidWorkout(dateKey, hasWorkout);

        lastSavedRef.current = key;
      } catch {
        // no-op
      }
    }, 600);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [routine, elapsedSec, isRunning, dateKey, group]);

  /** 탭/창 닫힐 때 마지막 스냅샷(그룹 포함) */
  useEffect(() => {
    function onBeforeUnload() {
      const url = `/api/workout-logs/${encodeURIComponent(
        dateKey
      )}${group ? `?group=${encodeURIComponent(group)}` : ""}`;
      navigator.sendBeacon?.(
        url,
        new Blob(
          [
            JSON.stringify({
              entries: routine.map((r) => ({
                exerciseId: r.id,
                title: r.title,
                group: r.group,
                sets: r.sets,
              })),
              durationSec: elapsedSec,
            }),
          ],
          { type: "application/json" }
        )
      );
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [routine, elapsedSec, dateKey, group]);

  const [pickOpen, setPickOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const recoGridStyle = {
  ...S.recoGrid,
  gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
};

  const getRecoGridStyle = (isMobile: boolean): React.CSSProperties => ({
  display: "grid",
  gap: 12,
  gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
});

useEffect(() => {
  const onResize = () => setIsMobile(window.innerWidth < 600);
  onResize(); // 컴포넌트가 처음 마운트될 때 초기값 설정
  window.addEventListener("resize", onResize); // 창 크기 변경 감지
  return () => window.removeEventListener("resize", onResize); // 언마운트 시 이벤트 제거
}, []);

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
            오늘 루틴!!
          </div>
          <div
            style={{
              ...S.subTitle,
              fontSize: isMobile ? 12 : 13,
              marginTop: 4,
            }}
          >
            {subtitle}
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

        <div style={S.timerBar}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: C.navy,
              fontSize: 18,
            }}
          >
            ⏱ <strong style={{ fontSize: 22 }}>{fmtElapsed}</strong>
            <span style={{ color: C.mute, fontSize: 13 }}>({dateKey})</span>
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
  {/* 추천 운동 헤더 + 토글 */}
  <div style={S.sectionHeader}>
    <div style={S.sectionTitle}>추천 운동</div>
    <button
      type="button"
      onClick={() => setRecoOpen((v) => !v)}
      style={S.toggleBtn}
      aria-expanded={recoOpen}
    >
      <span
        style={{
          transform: `rotate(${recoOpen ? 180 : 0}deg)`,
          display: "inline-block",
          transition: "transform .2s",
        }}
      >
        ▾
      </span>
      <span style={{ marginLeft: 6 }}>{recoOpen ? "접기" : "펼치기"}</span>
    </button>
  </div>

  {recoOpen && (
    <>
      {showBlank && <EmptyState />}
      {!showBlank && (
        <>
          {loadingReco && difficulty && (
            <div style={{ color: C.mute }}>추천 불러오는 중…</div>
          )}
          {!loadingReco && difficulty && reco.length > 0 && (
            <div
              style={{
                ...S.recoGrid,
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
              }}
            >
              {reco.map((r) => (
                <div key={r.id} style={S.recoCard}>
                  <div style={S.recoThumb}>
                    {r.image ? (
                      <img src={r.image} alt="" style={S.img} />
                    ) : (
                      "🏋️"
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={S.recoTitle}>{r.title}</div>
                    <div style={S.recoMeta}>
                      {GROUP_LABEL[r.group]} · {DIFF_LABEL[r.difficulty]}
                    </div>
                  </div>
                  <button
                    style={S.addBtn}
                    onClick={() =>
                      setRoutine((rs) => [
                        ...rs,
                        {
                          id: r.id,
                          title: r.title,
                          group: r.group as RoutineItem["group"],
                          sets: defaultSets(),
                          done: false,
                        },
                      ])
                    }
                  >
                    + 담기
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )}
  
        {/* 내 루틴 (반응형 1열 or 2열) */}
        <div style={{ marginTop: 14 }}>
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
                  <div style={S.orderBadge} aria-hidden="true">
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
                      setRoutine((rs) => rs.map((x, i) => (i === idx ? { ...n, done: it.done } : x)))
                    }
                    onRemove={() => setRoutine((rs) => rs.filter((_, i) => i !== idx))}
                  />
                </div>
              );
            })}
          </div>
          {routine.length === 0 && (
            <div style={{ color: C.mute, padding: "8px 2px" }}>
              담긴 운동이 없어요. {difficulty ? "추천에서 담거나" : ""} 아래 “운동 추가”를 눌러보세요.
            </div>
          )}
        </div>
      </div>

      <footer style={S.footer}>
        <button
          style={S.primary}
          onClick={() => setPickOpen(true)}
          disabled={loadingAll && !difficulty}
        >
          운동 추가
        </button>
      </footer>

      <ExercisePickerDrawer
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        items={pickerItems}
        defaultGroup={group}
        onPick={(it) => {
          setRoutine((rs) => [
            ...rs,
            {
              id: it.id,
              title: it.title,
              group: it.group as RoutineItem["group"],
              sets: defaultSets(),
              done: false,
            },
          ]);
          setPickOpen(false);
        }}
      />

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

function EmptyState() {
  return (
    <div style={S.empty}>
      <div style={S.emptyBlob}>💡</div>
      <div style={{ fontWeight: 800, color: C.navy, marginBottom: 6 }}>
        난이도를 아직 고르지 않았어요
      </div>
      <div style={{ color: C.mute, marginBottom: 10 }}>
        난이도를 고르면 여기에 추천 운동이 나타나요!
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <span style={S.pill}>살살</span>
        <span style={S.pill}>적당히</span>
        <span style={S.pill}>빡세게</span>
      </div>
    </div>
  );
}

/** 캘린더 모달 — 날짜별로 '가슴/등/하체'만 칩으로 표시 */
function CalendarModal({
  date,
  onClose,
  onPick,
}: {
  date: Date;
  onClose: () => void;
  onPick: (d: Date) => void;
}) {
  const [view, setView] = useState(new Date(date.getFullYear(), date.getMonth(), 1));

  // 월 요약 응답 확장 타입 (groups/durationByGroup 옵션 대응)
  type DaySumEx = CalendarDaySummary & {
    groups?:
      | Array<{ group: Workout["group"]; count: number }>
      | Array<Workout["group"]>
      | Partial<Record<Workout["group"], number>>;
    durationByGroup?: Partial<Record<Workout["group"], number>>;
  };

  const [monthly, setMonthly] = useState<DaySumEx[]>([]);
  const [titleToGroup, setTitleToGroup] = useState<Record<string, Workout["group"]>>({});
  const monthKey = useMemo(
    () => `${view.getFullYear()}-${String(view.getMonth() + 1).padStart(2, "0")}`,
    [view]
  );

  // ✅ 월 요약: groups=1 로만 호출 (detail=1 금지)
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const list = await workoutLogsApi.monthly(monthKey, { groups: true });
        if (!ignore) setMonthly((list as DaySumEx[]) || []);
      } catch {
        if (!ignore) setMonthly([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [monthKey]);

  // 제목→부위 매핑: 구버전 응답(labels) 호환을 위한 폴백
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const all = await workoutApi.list(); // 전체
        if (ignore) return;
        const map: Record<string, Workout["group"]> = {};
        (all || []).forEach((w) => {
          if (!map[w.title]) map[w.title] = w.group;
        });
        setTitleToGroup(map);
      } catch {
        setTitleToGroup({});
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // 타입가드
  type GroupCount = { group: Workout["group"]; count: number };
  const isGroupCount = (v: unknown): v is GroupCount =>
    !!v && typeof v === "object" && "group" in (v as any);

  // 다양한 응답 형태에서 그룹 목록 추출
  function extractGroupsFromDay(sum: DaySumEx | undefined): Workout["group"][] {
    const out = new Set<Workout["group"]>();
    if (!sum) return [];

    // 1) groups: 배열 (문자열 배열 또는 객체 배열)
    if (Array.isArray(sum.groups)) {
      for (const item of sum.groups as Array<GroupCount | Workout["group"]>) {
        const name = isGroupCount(item) ? item.group : (item as Workout["group"]);
        const cnt = isGroupCount(item) ? (item.count ?? 0) : 1;
        if (ALL_GROUPS.includes(name) && cnt > 0) out.add(name);
      }
    }

    // 2) groups: 맵 { chest: n, back: n, ... }
    if (sum.groups && !Array.isArray(sum.groups) && typeof sum.groups === "object") {
      for (const k of ALL_GROUPS) {
        const v = Number((sum.groups as any)[k]);
        if (!Number.isNaN(v) && v > 0) out.add(k);
      }
    }

    // 3) durationByGroup: { chest: sec, ... }
    if (sum.durationByGroup && typeof sum.durationByGroup === "object") {
      for (const k of ALL_GROUPS) {
        const v = Number(sum.durationByGroup[k]);
        if (!Number.isNaN(v) && v > 0) out.add(k);
      }
    }

    // 4) fallback: labels[] → 제목 매핑
    if (out.size === 0 && Array.isArray(sum.labels)) {
      for (const t of sum.labels) {
        const g = titleToGroup[t];
        if (g && ALL_GROUPS.includes(g)) out.add(g);
      }
    }

    return Array.from(out);
  }

  const start = new Date(view);
  const firstDay = new Date(view.getFullYear(), view.getMonth(), 1);
  const startWeekday = firstDay.getDay();
  start.setDate(start.getDate() - startWeekday);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const byDate: Record<string, DaySumEx | undefined> = useMemo(() => {
    const map: Record<string, DaySumEx> = {};
    monthly.forEach((x) => (map[x.date] = x));
    return map;
  }, [monthly]);

  const isSelected = (d: Date) => toYmd(d) === toYmd(date);
  const isToday = (d: Date) => toYmd(d) === toYmd(new Date());
  
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
            const key = toYmd(d);
            const sum = byDate[key];
            const dayGroups = extractGroupsFromDay(sum);
            const marked =
              ((!!sum && (((sum as any).count ?? 0) > 0 || ((sum as any).sec ?? 0) > 0)) ||
                dayGroups.length > 0);
            const today = isToday(d);
            const selected = isSelected(d);

            const mainLabels: string[] = dayGroups
              .filter((g) => MAIN_GROUPS.includes(g))
              .map((g) => GROUP_LABEL[g]);

            return (
              <button
                key={i}
                onClick={() => onPick(d)}
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
                </div>

                {/* '가슴/등/하체'만 노출 */}
                {!!mainLabels.length && (
                  <div style={S.calLabelRow} aria-label="운동 부위 미리보기">
                    {mainLabels.map((t, idx) => (
                      <span key={idx} style={S.calLabel}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 10 }}>
          <button onClick={onClose} style={S.calClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

/** 스타일 */
const S: Record<string, React.CSSProperties> = {
  wrap: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "0 20px 130px",
    fontFamily: "'BMJUA', sans-serif",
    overflow: "hidden",
  },
  stickyWrap: { position: "sticky", top: 16, zIndex: 20, display: "grid", gap: 10 },
  header: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    gap: 16,
    alignItems: "center",
  },
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
    marginBottom: 6,
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

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    margin: "8px 0 6px",
  },
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

  // 추천 2열
  recoGrid: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
  recoCard: {
    display: "grid",
    gridTemplateColumns: "96px 1fr auto",
    gap: 14,
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    background: C.sky,
    border: `1px solid ${C.line}`,
  },
  recoThumb: {
    width: 96,
    height: 64,
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

  /** 내 루틴 2열 */
  routineGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },

  /** 운동 카드 래퍼(순서/완료 UI를 겹쳐서 표시) */
  exerciseWrap: {
    position: "relative",
    borderRadius: 18,
  },

  orderBadge: {
    position: "absolute",
    left: 8,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 999,
    background: C.peach,
    color: C.navy,
    fontWeight: 900,
    display: "grid",
    placeItems: "center",
    border: `1px solid ${C.line}`,
    boxShadow: "0 4px 10px rgba(0,0,0,.05)",
    zIndex: 2,
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

  footer: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 56,
    display: "flex",
    justifyContent: "center",
    pointerEvents: "none",
  },
  primary: {
    pointerEvents: "auto",
    padding: "12px 18px",
    borderRadius: 14,
    border: `1px solid ${C.primary}`,
    background: C.primary,
    color: C.white,
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 900,
    boxShadow: "0 8px 18px rgba(60,186,186,.25)",
  },

  empty: {
    borderRadius: 16,
    padding: 18,
    border: `1px dashed ${C.line}`,
    background: C.cream,
    display: "grid",
    placeItems: "center",
    textAlign: "center",
  },
  emptyBlob: {
    width: 56,
    height: 56,
    borderRadius: 20,
    background: C.peach,
    display: "grid",
    placeItems: "center",
    marginBottom: 8,
    boxShadow: "0 6px 18px rgba(0,0,0,.08)",
  },
  pill: {
    padding: "6px 10px",
    borderRadius: 999,
    background: C.white,
    border: `1px solid ${C.line}`,
    fontSize: 12,
  },

  /** 캘린더 */
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

  // 라벨을 넣기 위해 높이/레이아웃 조정
  calCell: {
    minHeight: 78,
    borderRadius: 14,
    border: `1px solid ${C.line}`,
    background: C.sky,
    cursor: "pointer",
    display: "grid",
    gridTemplateRows: "auto 1fr",
    alignItems: "start",
    justifyItems: "center",
    padding: "6px 6px 8px",
    fontWeight: 700,
    textAlign: "center",
  },
  calDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    background: C.primary,
    boxShadow: "0 0 0 3px rgba(60,186,186,.18)",
  },
  calLabelRow: {
    display: "flex",
    gap: 4,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 4,
  },
  calLabel: {
    maxWidth: 74,
    padding: "2px 6px",
    borderRadius: 999,
    background: C.white,
    border: `1px solid ${C.line}`,
    fontSize: 10,
    lineHeight: 1.4,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
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
