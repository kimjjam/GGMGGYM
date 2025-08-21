import { useEffect, useMemo, useState } from "react";
import { favApi } from "../../lib/api";

export type SetRow = { weight: number; reps: number; done: boolean };
export type RoutineItem = {
  id: string;
  title: string;
  group: "back" | "shoulder" | "chest" | "arm" | "legs" | "cardio";
  sets: SetRow[];
};

const C = {
  primary: "#3cbaba",
  navy: "#163353",
  line: "#e8edf3",
  chip: "#eef8f7",
  panel: "#f6f8fb",
  inputBg: "#fff", // pill 느낌 살리기 위해 white
  white: "#fff",
  mute: "#6b7280",
  danger: "#ef4444",
};

function summary(sets: SetRow[]) {
  const totalReps = sets.reduce((s, x) => s + (x.reps || 0), 0);
  const totalKg = sets.reduce((s, x) => s + (x.weight || 0) * (x.reps || 0), 0);
  const maxKg = sets.reduce((m, x) => Math.max(m, x.weight || 0), 0);
  return { totalReps, totalKg, maxKg };
}

type Props = {
  item: RoutineItem;
  onChange: (next: RoutineItem) => void;
  onRemove?: () => void; // 카드 자체 삭제
};

export default function ExerciseCard({ item, onChange, onRemove }: Props) {
  const [local, setLocal] = useState(item);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => setLocal(item), [item.id, item.title, item.group, item.sets.length]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 600);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const sum = useMemo(() => summary(local.sets), [local.sets]);

  // 즐겨찾기(서버 동기화)
  const [isFav, setIsFav] = useState(false);
  useEffect(() => {
    let ignore = false;
    favApi
      .list()
      .then((arr) => !ignore && setIsFav(arr.includes(local.id)))
      .catch(() => !ignore && setIsFav(false));
    return () => {
      ignore = true;
    };
  }, [local.id]);

  const toggleFav = () => {
    setIsFav((v) => !v);
    favApi
      .toggle(local.id)
      .then((arr) => setIsFav(arr.includes(local.id)))
      .catch(() => setIsFav((v) => !v));
  };

  const mutate = (fn: (draft: RoutineItem) => void) => {
    const n = structuredClone(local) as RoutineItem;
    fn(n);
    setLocal(n);
    onChange(n);
  };

  const removeSet = (idx: number) => mutate((d) => d.sets.splice(idx, 1));

  return (
    <div
      style={{
        ...S.card,
        padding: isMobile ? 8 : 14,
        fontSize: isMobile ? 14 : 16,
      }}
    >
      <style>{`
        .jm-input { color: ${C.navy} !important; caret-color: ${C.navy}; }
        .jm-input::placeholder { color: ${C.mute}; opacity: 1; }
        .jm-input:-ms-input-placeholder { color: ${C.mute}; }
        .jm-input::-ms-input-placeholder { color: ${C.mute}; }

        /* 기본 number 스핀 제거 */
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; appearance: textfield; }
      `}</style>

      {/* 헤더 */}
      <div
        style={{
          ...S.cardHeader,
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 8 : 12,
        }}
      >
        <div style={S.titleWrap}>
          <button
            onClick={toggleFav}
            title={isFav ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            aria-pressed={isFav}
            style={{
              ...S.starBtn,
              color: isFav ? C.primary : C.mute,
              borderColor: isFav ? C.primary : C.line,
              width: isMobile ? 30 : 36,
              height: isMobile ? 30 : 36,
              minWidth: isMobile ? 30 : 36,
              fontSize: isMobile ? 14 : 18,
            }}
          >
            {isFav ? "★" : "☆"}
          </button>
          <div style={S.title}>{local.title}</div>
        </div>

        <div style={S.actions}>
          <div style={{ ...S.chips, gap: isMobile ? 4 : 6 }}>
            <span style={{ ...S.chip, fontSize: isMobile ? 10 : 12 }}>{local.sets.length}세트</span>
            <span style={{ ...S.chip, fontSize: isMobile ? 10 : 12 }}>{sum.totalKg.toLocaleString()}kg</span>
            <span style={{ ...S.chip, fontSize: isMobile ? 10 : 12 }}>최대 {sum.maxKg}kg</span>
            <span style={{ ...S.chip, fontSize: isMobile ? 10 : 12 }}>{sum.totalReps}회</span>
          </div>

          {onRemove && (
            <button
              onClick={onRemove}
              title="운동 삭제"
              aria-label="운동 삭제"
              style={{
                ...S.removeCardBtn,
                width: isMobile ? 30 : 36,
                height: isMobile ? 30 : 36,
                minWidth: isMobile ? 30 : 36,
                fontSize: isMobile ? 14 : 16,
              }}
            >
              🗑
            </button>
          )}
        </div>
      </div>

      {/* 세트 입력 */}
      <div style={S.panel}>
        {local.sets.map((s, i) => (
          <div
            key={i}
            style={{
              ...S.setRow,
              opacity: s.done ? 0.9 : 1,
              gap: 12, // ✅ 항상 동일 간격
              padding: isMobile ? "10px 0" : "8px 0",
            }}
          >
            <div style={{ ...S.setIdx, minWidth: 60 }}>{i + 1}세트</div>

            {/* 중량 */}
            <div style={{ ...S.field, flex: 1, minWidth: 120 }}>
              <input
                className="jm-input"
                aria-label="중량"
                inputMode="numeric"
                type="number"
                min={0}
                value={s.weight}
                onChange={(e) =>
                  mutate((d) => {
                    d.sets[i].weight = Number(e.target.value || 0);
                  })
                }
                placeholder="중량"
                style={{ ...S.input, height: isMobile ? 38 : 40 }}
              />
              <div style={S.stepperWrap}>
                <button
                  type="button"
                  title="중량 증가"
                  aria-label="중량 증가"
                  style={S.stepperBtn}
                  onClick={() => mutate((d) => (d.sets[i].weight = (d.sets[i].weight || 0) + 1))}
                >
                  ▲
                </button>
                <button
                  type="button"
                  title="중량 감소"
                  aria-label="중량 감소"
                  style={S.stepperBtn}
                  onClick={() => mutate((d) => (d.sets[i].weight = Math.max(0, (d.sets[i].weight || 0) - 1)))}
                >
                  ▼
                </button>
              </div>
              <span style={S.unit}>kg</span>
            </div>

            {/* 반복 */}
            <div style={{ ...S.field, flex: 1, minWidth: 120 }}>
              <input
                className="jm-input"
                aria-label="반복"
                inputMode="numeric"
                type="number"
                min={0}
                value={s.reps}
                onChange={(e) =>
                  mutate((d) => {
                    d.sets[i].reps = Number(e.target.value || 0);
                  })
                }
                placeholder="반복"
                style={{ ...S.input, height: isMobile ? 38 : 40 }}
              />
              <div style={S.stepperWrap}>
                <button
                  type="button"
                  title="횟수 증가"
                  aria-label="횟수 증가"
                  style={S.stepperBtn}
                  onClick={() => mutate((d) => (d.sets[i].reps = (d.sets[i].reps || 0) + 1))}
                >
                  ▲
                </button>
                <button
                  type="button"
                  title="횟수 감소"
                  aria-label="횟수 감소"
                  style={S.stepperBtn}
                  onClick={() => mutate((d) => (d.sets[i].reps = Math.max(0, (d.sets[i].reps || 0) - 1)))}
                >
                  ▼
                </button>
              </div>
              <span style={S.unit}>회</span>
            </div>

            {/* 완료 토글 (원형) */}
            <button
              onClick={() => mutate((d) => (d.sets[i].done = !d.sets[i].done))}
              style={{
                ...S.circleBtn,
                background: s.done ? C.primary : C.white,
                color: s.done ? "#fff" : C.navy,
                borderColor: s.done ? C.primary : C.line,
              }}
              aria-pressed={s.done}
              title={s.done ? "완료 취소" : "완료"}
            >
              ✓
            </button>

            {/* 세트 삭제 (원형) */}
            <button
              onClick={() => removeSet(i)}
              style={{ ...S.circleBtn, color: C.danger }}
              title="세트 삭제"
              aria-label={`세트 ${i + 1} 삭제`}
            >
              🗑️
            </button>
          </div>
        ))}

        <button type="button" onClick={() => mutate((d) => d.sets.push({ weight: 0, reps: 0, done: false }))} style={S.addSet}>
          + 세트 추가
        </button>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  card: {
    background: C.white,
    borderRadius: 18,
    border: `1px solid ${C.line}`,
    boxShadow: "0 8px 20px rgba(0,0,0,.05)",
    padding: 14,
    margin: "14px 0",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 8,
  },
  titleWrap: { display: "flex", alignItems: "center", gap: 8 },
  actions: { display: "flex", alignItems: "center", gap: 8 },

  starBtn: {
    width: 36,
    height: 36,
    minWidth: 36,
    borderRadius: 10,
    border: `1px solid ${C.line}`,
    background: C.white,
    cursor: "pointer",
    fontSize: 18,
    display: "grid",
    placeItems: "center",
    padding: 0,
  },

  title: { fontWeight: 900, color: C.navy, lineHeight: 1.1 },

  chips: { display: "flex", gap: 6, flexWrap: "wrap" },
  chip: {
    background: C.chip,
    border: `1px solid ${C.line}`,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    color: C.navy,
  },

  removeCardBtn: {
    width: 36,
    height: 36,
    minWidth: 36,
    borderRadius: 10,
    border: `1px solid ${C.line}`,
    background: C.white,
    cursor: "pointer",
    color: C.danger,
    display: "grid",
    placeItems: "center",
    padding: 0,
    fontSize: 16,
  },

  panel: { background: C.panel, borderRadius: 14, padding: 12, marginTop: 8 },

  /** 세트행: | 인덱스 | weight pill | reps pill | ✓ | 🗑 | */
  setRow: {
    display: "grid",
    gridTemplateColumns: "70px minmax(0,1fr) minmax(0,1fr) 44px 44px",
    gap: 12, // ✅ 컬럼 간격 고정
    alignItems: "center",
    padding: "8px 0",
    borderBottom: `1px dashed ${C.line}`,
  },

  setIdx: { fontWeight: 800, color: C.navy },

  field: { position: "relative" },

  /** pill 입력칸 */
  input: {
    width: "100%",
    height: 40,
    borderRadius: 999, // ✅ pill
    border: `1px solid ${C.line}`,
    padding: "0 88px 0 14", // 단위+스테퍼 공간 여유
    background: C.inputBg,
    outline: "none",
    color: C.navy,
    fontWeight: 800,
  },

  /** 스테퍼(▲▼) - 입력칸 내부 오른쪽 */
  stepperWrap: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    display: "grid",
    gridTemplateRows: "1fr 1fr",
    gap: 4,
  },
  stepperBtn: {
    width: 22,
    height: 16,
    borderRadius: 999,
    border: `1px solid ${C.line}`,
    background: C.white,
    color: C.navy,
    fontSize: 10,
    lineHeight: "14px",
    cursor: "pointer",
    padding: 0,
  } as React.CSSProperties,

  /** 단위(kg/회) - 스테퍼 왼쪽에 고정 */
  unit: {
    position: "absolute",
    right: 44, // (스테퍼 22 + gap 10 + 여유)
    top: "50%",
    transform: "translateY(-50%)",
    color: C.mute,
    fontSize: 12,
    fontWeight: 800,
  },

  /** 원형 버튼 공통(완료/삭제) */
  circleBtn: {
    width: 40,
    height: 40,
    minWidth: 40,
    display: "grid",
    placeItems: "center",
    borderRadius: 999,
    border: `1px solid ${C.line}`,
    background: C.white,
    cursor: "pointer",
    padding: 0,
    fontSize: 18,
    marginLeft: 8, // ✅ 반복 입력칸과 체크 버튼 사이 간격 추가
  },

  addSet: {
    width: "100%",
    height: 40,
    borderRadius: 12,
    border: `1px dashed ${C.line}`,
    background: C.white,
    cursor: "pointer",
    marginTop: 8,
    color: C.navy,
    fontWeight: 700,
  },
};
