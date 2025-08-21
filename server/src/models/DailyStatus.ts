import { Schema, model, Types } from "mongoose";

const dailyStatusSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    // YYYY-MM-DD
    date: { type: String, required: true },
    didWorkout: { type: Boolean, default: false },
    waterMl: { type: Number, default: 0 },
    sleepHours: { type: Number, default: 0 },
    mood: { type: String, enum: ["good", "soso", "bad"], default: "soso" },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

dailyStatusSchema.index({ userId: 1, date: 1 }, { unique: true });

export type DailyStatusDoc = typeof dailyStatusSchema extends infer S
  ? S extends Schema<any> ? (S extends { obj: infer T } ? T : any) : any
  : any;

export default model("DailyStatus", dailyStatusSchema);
