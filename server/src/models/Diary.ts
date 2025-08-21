import { Schema, model, Types, Document } from "mongoose";

export interface IDiary extends Document {
  userId: Types.ObjectId;
  date: string;      // 'YYYY-MM-DD'
  title?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const diarySchema = new Schema<IDiary>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    title: { type: String, default: "" },
    content: { type: String, default: "" },
  },
  { timestamps: true }
);

// 유저+날짜 1개만
diarySchema.index({ userId: 1, date: 1 }, { unique: true });

export default model<IDiary>("Diary", diarySchema);
