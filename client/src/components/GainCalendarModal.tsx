import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import {
  api,
  getWorkouts,
  workoutLogsApi,
  type Workout,
} from "../lib/api";
import { useAuth } from "../store/auth";

/** -------------------- 상수/유틸 -------------------- */
const REWARD_DAYS = 15;
const ymKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

// 칩으로 보여줄 메인 그룹
const MAIN_GROUPS: Array<Workout["group"]> = ["chest", "back", "legs"];

// 그룹 한글 라벨
const GROUP_LABEL: Record<Workout["group"], string> = {
  back: "등",
  shoulder: "어깨",
  chest: "가슴",
  arm: "팔",
  legs: "하체",
  cardio: "유산소",
};

// 제목 키워드로 보정 (월 요약이 labels만 줄 때 폴백)
function guessGroupFromTitle(t: string): Workout["group"] | undefined {
  const s = (t || "").toLowerCase();
  if (/(벤치|체스트|가슴|펙덱|푸쉬업|push ?up|bench|chest|pec)/i.test(s)) return "chest";
  if (/(랫|풀다운|로우|시티드 ?로우|풀업|턱걸이|데드리프트|등|back|row|pull ?down|pull ?up|deadlift)/i.test(s)) return "back";
  if (/(스쿼트|레그|런지|힙(쓰러스트)?|카프|하체|leg|squat|lunge|rdl|hip)/i.test(s)) return "legs";
  return undefined;
}

function buildTitleToGroupMap(all: Workout[] = []) {
  const map: Record<string, Workout["group"]> = {};
  (all || []).forEach((w) => {
    if (!map[w.title]) map[w.title] = w.group;
  });
  return map;
}

/** -------------------- 스타일 & 반응형 -------------------- */
const responsiveCSS = `
  .gc-grid {
    display:grid;
    grid-template-columns:repeat(7, minmax(0,1fr));
    grid-template-rows: repeat(6, 1fr);
    gap:4px;
    height:100%;
    min-height:0;
  }
  .gc-cell, .gc-empty { min-height:0; overflow:hidden; }
  .gc-check { width:24px; height:24px; right:8px; bottom:8px; font-size:14px; }
  @media (max-width: 900px){
    .gc-title { font-size: 18px !important; padding: 8px 14px !important; }
    .gc-weekday { padding: 6px 0 !important; }
  }
  @media (max-width: 640px){
    .gc-title { font-size: 16px !important; }
    .gc-weekday { padding: 4px 0 !important; }
    .gc-check { width:18px; height:18px; right:6px; bottom:6px; font-size:12px; }
  }
`;

const weekdayColors: string[] = [
  "#ED9090",
  "#f0bc81ff",
  "#ebe9a0ff",
  "#74b96cff",
  "#9290e7ff",
  "#c75fe7ff",
  "#d647a7ff",
];

const styles: { [key: string]: CSSProperties } = {
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "#898989cc",
    backdropFilter: "blur(2px)",
    zIndex: 2000,
  },
  modal: {
    position: "fixed",
    inset: 0,
    margin: "auto",
    width: "min(960px,94vw)",
    height: "min(92vh,940px)",
    background: "#FAF4E4",
    borderRadius: 18,
    outline: "5px solid #7e5a3e",
    boxShadow: "0 10px 28px rgba(218, 209, 196, 0.12)",
    zIndex: 2001,
    display: "grid",
    gridTemplateRows: "auto auto 1fr auto",
    gap: 8,
    padding: 12,
    overflow: "hidden",
  },
  header: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto auto auto",
    alignItems: "center",
    gap: 8,
  },
  title: {
    textAlign: "center",
    background: "#FFFBE8",
    padding: "8px 16px",
    fontWeight: 800,
    fontSize: 20,
    borderRadius: 14,
    border: "5px solid #7e5a3e",
    textShadow: "0 1px rgba(255,255,255,0.4)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  navBtn: {
    border: "4px solid #7e5a3e",
    background: "#FAF4E4",
    borderRadius: 12,
    padding: "8px 12px",
    cursor: "pointer",
    color: "#7e5a3e",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: "9999px",
    background: "#FAF4E4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    lineHeight: 1,
  },
  closeGlyph: {
    fontWeight: 900,
    fontSize: 20,
    color: "#7e5a3e",
    marginTop: 5,
  },
  weekdayGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7,1fr)",
    gap: 4,
    marginBottom: 0,
    minHeight: 36,
  },
  weekdayCell: {
    textAlign: "center",
    padding: "8px 0",
    borderRadius: 12,
    border: "4px solid #7e5a3e",
    background: "#fffbe8",
    fontWeight: 800,
    fontSize: 17,
    color: "#a99e7e",
    textShadow: `
    -1px -1px 0 #000000ff,
     1px -1px 0 #000000ff,
    -1px  1px 0 #000000ff,
     1px  1px 0 #000000ff
  `,
  },
  daysWrap: { minHeight: 0, height: "100%" },
  cell: {
    position: "relative",
    borderRadius: 16,
    border: "4px solid #7e5a3e",
    background: "linear-gradient(180deg, #fffbe8 85%, #f7e8c5 100%)",
    display: "grid",
    gridTemplateRows: "auto auto 1fr", // 날짜 / 칩 / 여백
    alignItems: "start",
    justifyItems: "start",
    rowGap: 6,
    padding: 12,
    cursor: "pointer",
    overflow: "hidden",
  },
  cellEmpty: {
    border: "4px dashed #e9dcc8",
    borderRadius: 14,
    opacity: 0.45,
    background: "#fdf6e3",
  },
  dayNumber: {
    fontWeight: 800,
    color: "#b49a7f",
    fontSize: 20,
  },
  labelRow: {
    display: "flex",
    gap: 4,
    flexWrap: "wrap",
    alignItems: "center",
    maxWidth: "100%",
  },
  labelChip: {
    maxWidth: 78,
    padding: "2px 6px",
    borderRadius: 999,
    background: "#ffffff",
    border: "1px solid #e9dcc8",
    fontSize: 10,
    lineHeight: 1.4,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: "#7e5a3e",
    boxShadow: "0 1px 0 rgba(0,0,0,.06)",
  },
  checkBtn: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 24,
    height: 24,
    border: "1px solid #e9dcc8",
    borderRadius: "50%",
    background: "#fffbe8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    lineHeight: 1,
    color: "#ffe384",
  },
  checkedBtn: {
    background: "#ed7d7d63",
    boxShadow: "inset 0 0.1px 0 rgba(0,0,0,0.08)",
    color: "#ffe384",
  },
  todayOutline: {
    outline: "7px dashed #84e587ff",
    outlineOffset: -10,
  },
  footer: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  progressBarContainer: {
    flex: 1,
    height: 10,
    border: "4px solid #e9dcc8",
    borderRadius: 12,
    background: "#fffbe8",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    background: "linear-gradient(90deg, #d8d81eff 0%, #ff8e8e 100%)",
    transition: "width 0.25s ease",
  },
  giftBox: {
    width: 50,
    height: 50,
    border: "5px solid #ffe384",
    borderRadius: 14,
    background: "#ffb1b1",
    position: "relative",
  },
  giftLocked: {
    filter: "saturate(0.1) opacity(0.7)",
  },
  giftActive: {
    animation: "twinkle 1.15s infinite ease-in-out",
    cursor: "pointer",
  },
};

function buildCells(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const arr: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) arr.push(null);
  for (let d = 1; d <= daysInMonth; d++) arr.push(d);
  while (arr.length < 42) arr.push(null);
  return arr.slice(0, 42);
}

type GainCalendarModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function GainCalendarModal({ isOpen, onClose }: GainCalendarModalProps) {
  const [viewDate, setViewDate] = useState<Date>(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  // 출석 체크 상태
  const [checksByMonth, setChecksByMonth] = useState<Record<string, Set<number>>>({});
  const [monthLoading, setMonthLoading] = useState(false);

  // 제목→그룹 매핑, 날짜별 라벨(가슴/등/하체)
  const [titleToGroup, setTitleToGroup] = useState<Record<string, Workout["group"]>>({});
  const [labelsByYmd, setLabelsByYmd] = useState<Record<string, string[]>>({});

  const token = useAuth((s) => s.token);

  useEffect(() => {
    if (isOpen) {
      const n = new Date();
      setViewDate(new Date(n.getFullYear(), n.getMonth(), 1));
    }
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Esc") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);
  
  const key = ymKey(viewDate);
  const monthSet = checksByMonth[key] ?? new Set();
  const cells = buildCells(viewDate.getFullYear(), viewDate.getMonth());
  /*leftpos 정의 */
  const [leftPos, setLeftPos] = useState(0);
  useEffect(() => {
    function updatePosition() {
      const wndWidth = window.innerWidth;
      const modalMaxWidth = 960;
      const modalWidthVW = 94;
      const modalWidth = Math.min(modalMaxWidth, (wndWidth * modalWidthVW) / 100);
      const leftOfModal = (wndWidth - modalWidth) / 2;
      setLeftPos(leftOfModal - 350);
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, []);
  /** 1) 출석 체크 로딩 (병렬) */
  useEffect(() => {
    if (!isOpen || !token) return;
    let canceled = false;
    const run = async () => {
      setMonthLoading(true);
      try {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const ymds = days.map((d) => api.toYMD(new Date(year, month, d)));

        type DailyResponse = { didWorkout?: boolean };

        const res = await Promise.all(
          ymds.map((ymd) =>
            api.getDaily(ymd).catch(() => ({ didWorkout: false } as DailyResponse))
          )
        );
        if (canceled) return;

        const set = new Set<number>();
        (res as DailyResponse[]).forEach((r, idx) => {
          if (r?.didWorkout) set.add(days[idx]);
        });

        setChecksByMonth((prev) => ({ ...prev, [key]: set }));
      } finally {
        if (!canceled) setMonthLoading(false);
      }
    };
    run();
    return () => {
      canceled = true;
    };
  }, [key, token, isOpen, viewDate]);

  /** 2) 전체 운동 목록→제목→그룹 매핑 */
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const all = await getWorkouts();
        if (!ignore) setTitleToGroup(buildTitleToGroupMap(all || []));
      } catch {
        if (!ignore) setTitleToGroup({});
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  /** 3) 월별 라벨 계산: ✅ 월 요약 한 번 호출 (groups=1), detail=1 금지 */
  useEffect(() => {
    if (!isOpen) return;
    let canceled = false;
    (async () => {
      try {
        const monthKey = ymKey(viewDate);
        // 핵심: 그룹별 집계 포함 월 요약만 호출
        const list = (await workoutLogsApi.monthly(monthKey, { groups: true })) as Array<
          {
            date: string;
            sec?: number;
            count?: number;
            groups?: Workout["group"][]; // groups is an array of group names (strings)
            labels?: string[];
          } | undefined
        >;

        if (canceled) return;

        const result: Record<string, string[]> = {};
        (list || []).forEach((d) => {
          if (!d) return;
          // 1) 권장: groups 응답에서 메인 그룹 추출
          let gs: Workout["group"][] =
            (d.groups?.filter(Boolean) as Workout["group"][]) ?? [];

          // 2) 폴백: labels만 온 경우 제목→그룹 매핑/추론
          if (!gs?.length && d.labels?.length) {
            const inferred = Array.from(
              new Set(
                d.labels
                  .map((t) => titleToGroup[t] || guessGroupFromTitle(t))
                  .filter(Boolean)
              )
            ) as Workout["group"][];
            gs = inferred;
          }

          const main = (gs || [])
            .filter((g) => MAIN_GROUPS.includes(g))
            .map((g) => GROUP_LABEL[g]);

          if (main.length) result[d.date] = main;
        });

        setLabelsByYmd(result);
      } catch {
        if (!canceled) setLabelsByYmd({});
      }
    })();
    return () => {
      canceled = true;
    };
  }, [isOpen, viewDate, titleToGroup]);

  const toggleDay = async (day: number | null) => {
    if (day == null) return;
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    const ymd = api.toYMD(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
    setChecksByMonth((prev) => {
      const copy = { ...prev };
      const cur = new Set(copy[key] ?? []);
      if (cur.has(day)) cur.delete(day);
      else cur.add(day);
      copy[key] = cur;
      return copy;
    });
    try {
      const willBe = !monthSet.has(day);
      await api.setDidWorkout(ymd, willBe);
    } catch {
      setChecksByMonth((prev) => {
        const copy = { ...prev };
        const cur = new Set(copy[key] ?? []);
        if (cur.has(day)) cur.delete(day);
        else cur.add(day);
        copy[key] = cur;
        return copy;
      });
    }
  };

  const prevMonth = (): void =>
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = (): void =>
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToToday = (): void => {
    const n = new Date();
    setViewDate(new Date(n.getFullYear(), n.getMonth(), 1));
  };

  const progressPercent = Math.min((monthSet.size / REWARD_DAYS) * 100, 100);
  const isGiftActive = monthSet.size >= REWARD_DAYS;

  if (!isOpen) return null;

  return (
    <>
      <style>{responsiveCSS}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* 왼쪽 데코 */}
        <img
          src="../../public/images/mongleleft.png"
          alt="캘린더 모달 데코"
          style={{
            position: "absolute",
            left: leftPos,
            top: "50%",
            transform: "translateY(-50%)",
            width: "400px",
            height: "auto",
            pointerEvents: "none",
            zIndex: 2002,
          }}
        />

        {/* 오버레이 */}
        <div style={styles.modalOverlay} onClick={onClose} />

        {/* 모달 */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gain-calendar-title"
          tabIndex={-1}
          style={styles.modal}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div style={styles.header}>
            <button aria-label="이전 달" onClick={prevMonth} style={styles.navBtn}>
              ◀
            </button>
            <div id="gain-calendar-title" className="gc-title" style={styles.title}>
              {viewDate.getFullYear()}.{String(viewDate.getMonth() + 1).padStart(2, "0")} 득근 캘린더
              {monthLoading ? " · 불러오는 중..." : ""}
            </div>
            <button aria-label="다음 달" onClick={nextMonth} style={styles.navBtn}>
              ▶
            </button>
            <button aria-label="오늘로 이동" onClick={goToToday} style={styles.navBtn}>
              오늘
            </button>
            <button
              type="button"
              aria-label="닫기"
              onClick={onClose}
              style={styles.closeBtn}
              title="닫기"
            >
              <span style={styles.closeGlyph}>×</span>
            </button>
          </div>

          {/* 요일 */}
          <div style={styles.weekdayGrid}>
            {["일", "월", "화", "수", "목", "금", "토"].map((d, idx) => (
              <div
                key={d}
                className="gc-weekday"
                style={{
                  ...styles.weekdayCell,
                  color: weekdayColors[idx],
                  borderColor: weekdayColors[idx],
                  background: "#FAF4E4",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* 날짜 */}
          <div style={styles.daysWrap}>
            <div className="gc-grid" role="grid" aria-label="득근 캘린더 날짜">
              {cells.map((day, i) => {
                if (day == null) {
                  return (
                    <div
                      key={i}
                      className="gc-empty"
                      style={styles.cellEmpty}
                      aria-hidden="true"
                    />
                  );
                }
                const cellDate = new Date(
                  viewDate.getFullYear(),
                  viewDate.getMonth(),
                  day
                );
                const ymd = api.toYMD(cellDate);
                const labels = labelsByYmd[ymd] || [];

                const t = new Date();
                const isToday =
                  day === t.getDate() &&
                  viewDate.getMonth() === t.getMonth() &&
                  viewDate.getFullYear() === t.getFullYear();
                const checked = monthSet.has(day);

                return (
                  <div
                    key={i}
                    className="gc-cell"
                    role="gridcell"
                    tabIndex={0}
                    aria-checked={checked}
                    onClick={() => toggleDay(day)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") toggleDay(day);
                    }}
                    style={{ ...styles.cell, ...(isToday ? styles.todayOutline : {}) }}
                  >
                    <span style={styles.dayNumber}>{day}</span>

                    {/* 가슴/등/하체 칩 */}
                    {!!labels.length && (
                      <div style={styles.labelRow} aria-label="운동 부위">
                        {labels.map((t, idx) => (
                          <span key={idx} style={styles.labelChip}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      className="gc-check"
                      aria-label={`${day}일 출석 체크`}
                      style={{
                        ...styles.checkBtn,
                        ...(checked ? styles.checkedBtn : {}),
                      }}
                    >
                      ★
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 푸터 */}
          <div style={styles.footer}>
            <div style={styles.progressBarContainer} aria-hidden="true">
              <div
                style={{
                  ...styles.progressBar,
                  width: `${progressPercent}%`,
                }}
              />
            </div>
            <span aria-live="polite">출석 {monthSet.size}/{REWARD_DAYS}</span>
            <div
              role="button"
              aria-label={
                isGiftActive ? "선물 오픈 가능" : `한 달 ${REWARD_DAYS}일 이상 출석 시 선물 오픈`
              }
              tabIndex={0}
              style={{
                width: 50,
                height: 50,
                border: "5px solid #ffe384",
                borderRadius: 14,
                background: "#ffb1b1",
                position: "relative",
                ...(isGiftActive
                  ? { animation: "twinkle 1.15s infinite ease-in-out", cursor: "pointer" }
                  : { filter: "saturate(0.1) opacity(0.7)" }),
              }}
              onClick={() => {
                if (isGiftActive) alert("짠! 선물 상자 쿠폰 획득!");
              }}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && isGiftActive)
                  alert("짠! 선물 상자 쿠폰 획득");
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
