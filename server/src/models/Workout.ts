// server/src/models/Workout.ts
import { Schema, model, type Document } from "mongoose";

export type Group =
  | "back"
  | "shoulder"
  | "chest"
  | "legs"
  | "arm"
  | "cardio"; // 필요시 유지 (현재 시드는 arm 사용)

export type Difficulty = "easy" | "mid" | "hard";

export interface IWorkout extends Document {
  id: string;              // 고유 슬러그 (unique)
  title: string;
  group: Group;
  difficulty: Difficulty;
  cues?: string[];
}

const GROUPS: Group[] = ["back", "shoulder", "chest", "legs", "arm", "cardio"];
const DIFFS: Difficulty[] = ["easy", "mid", "hard"];

const schema = new Schema<IWorkout>(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    group: { type: String, required: true, enum: GROUPS, index: true },
    difficulty: { type: String, required: true, enum: DIFFS, index: true },
    cues: { type: [String], default: [] },
  },
  {
    versionKey: false,
    // timestamps: true, // 필요 시 주석 해제
  }
);

// 자주 쓰는 쿼리 최적화
schema.index({ group: 1, difficulty: 1, title: 1 });

// 응답에서 _id 제거
schema.set("toJSON", {
  transform(_doc, ret: any) {
    delete ret._id;
    return ret;
  },
});

export default model<IWorkout>("Workout", schema);
