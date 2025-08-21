import React from "react";
import ExerciseCard, { RoutineItem } from "../components/workout/ExerciseCard";
import { C } from "./constants";

export const routineStyles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontWeight: 900,
    color: C.navy,
  },
  addBtn: {
    padding: "8px 16px",
    fontWeight: 700,
    fontSize: 14,
    background: C.primary,
    borderRadius: 999,
    color: C.white,
    cursor: "pointer",
    border: "none",
  },
  emptyMsg: {
    color: C.mute,
    fontSize: 14,
    textAlign: "center",
    padding: "16px 0",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
    gap: 16,
  },
};

type Props = {
  routine: RoutineItem[];
  setRoutine: React.Dispatch<React.SetStateAction<RoutineItem[]>>;
  mode: "my" | "explore";
  onOpenPicker: () => void;
};

export default function MyRoutine({ routine, setRoutine, mode, onOpenPicker }: Props) {
  return (
    <section>
      <div style={routineStyles.header}>
        <h2 style={routineStyles.title}>내 루틴</h2>
        {mode === "my" && (
          <button onClick={onOpenPicker} style={routineStyles.addBtn}>
            운동 추가
          </button>
        )}
      </div>

      {routine.length === 0 ? (
        <div style={routineStyles.emptyMsg}>
          {mode === "my"
            ? "추가된 운동이 없습니다. 운동 추가 버튼을 눌러보세요."
            : "추천 운동에서 원하는 운동을 담아보세요."}
        </div>
      ) : (
        <div style={routineStyles.grid}>
          {routine.map((item, i) => (
            <ExerciseCard
              key={`${item.id}-${i}`}
              item={item}
              onChange={(newItem) => setRoutine((rs) => rs.map((x, idx) => (idx === i ? newItem : x)))}
              onRemove={() => setRoutine((rs) => rs.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
      )}
    </section>
  );
}
