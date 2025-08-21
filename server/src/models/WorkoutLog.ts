// server/src/models/WorkoutLog.ts
import { Schema, model, Document, Types } from "mongoose";

export type Group = "back" | "shoulder" | "chest" | "arm" | "legs" | "cardio";

export type SetRow = { weight: number; reps: number; done: boolean };

export type Entry = {
  exerciseId: string;           // workouts.id 스냅샷
  title: string;
  group: Group;
  sets: SetRow[];
  note?: string;
};

export interface IWorkoutLog extends Document {
  userId: Types.ObjectId;       // 사용자
  date: string;                 // YYYY-MM-DD (ex. 2025-08-20)
  entries: Entry[];             // 하루 전체 엔트리(부위 섞여 있을 수 있음)
  durationSec: number;          // 전체(하루) 누적 경과초 (옵션으로 계속 유지)
  /** 부위별 누적 경과초(부분 저장/조회용) — r.put/get 에서 group 별로 사용 */
  durationByGroup?: Record<string, number>;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SetSchema = new Schema<SetRow>(
  {
    weight: Number,
    reps: Number,
    done: Boolean,
  },
  { _id: false }
);

const EntrySchema = new Schema<Entry>(
  {
    exerciseId: { type: String, required: true },
    title: { type: String, required: true },
    group: {
      type: String,
      required: true,
      enum: ["back", "shoulder", "chest", "arm", "legs", "cardio"],
    },
    sets: { type: [SetSchema], default: [] },
    note: String,
  },
  { _id: false }
);

const schema = new Schema<IWorkoutLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    date: { type: String, required: true, index: true }, // ex) '2025-08-20'
    entries: { type: [EntrySchema], default: [] },

    // 하루 전체 누적 시간(기존 호환)
    durationSec: { type: Number, default: 0 },

    // ✅ 부위별 누적 시간(부분 저장/조회에 사용, 선택 필드)
    //  { shoulder: 1200, arm: 800, ... }
    durationByGroup: { type: Schema.Types.Mixed, default: undefined },

    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// 같은 사용자 + 같은 날짜는 1문서만 유지
schema.index({ userId: 1, date: 1 }, { unique: true });

export default model<IWorkoutLog>("WorkoutLog", schema);
