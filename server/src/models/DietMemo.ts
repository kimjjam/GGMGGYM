import { Schema, model, Types } from "mongoose";

const dietMemoSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    // 해당 주의 시작일(예: 월요일) YYYY-MM-DD
    weekStart: { type: String, required: true },
    content: { type: String, default: "" },
    meals: [{ date: String, text: String }], // 선택
  },
  { timestamps: true }
);

dietMemoSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export default model("DietMemo", dietMemoSchema);
