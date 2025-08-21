import { Schema, model, type Document } from "mongoose";

export interface IVideo extends Document {
  youtubeId: string;           // 유튜브 영상 ID (예: "dQw4w9WgXcQ")
  title: string;
  channelTitle?: string;
  thumb?: string;
  tags?: string[];             // 검색 키워드
  groups?: string[];           // 카테고리(예: ["stretching"])
  durationSec?: number;
  language?: string;           // "ko" 등
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IVideo>(
  {
    youtubeId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    channelTitle: String,
    thumb: String,
    tags: { type: [String], default: [] },
    groups: { type: [String], default: [] },
    durationSec: Number,
    language: { type: String, default: "ko" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

// 간단 텍스트 검색
schema.index({ title: "text", tags: "text" });

schema.set("toJSON", {
  transform(_doc, ret: any) {
    ret.id = ret._id; delete ret._id;
    return ret;
  },
});

export default model<IVideo>("Video", schema);
