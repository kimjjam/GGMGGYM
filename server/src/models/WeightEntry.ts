import { Schema, model, Types, Document, Model } from "mongoose";

export interface IWeightEntry {
  userId: Types.ObjectId;
  dateKey: string;     // 'YYYY-MM-DD'
  weight?: number;     // kg
  bodyFat?: number;    // %
  muscle?: number;     // kg or %
  memo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WeightEntryDocument extends IWeightEntry, Document {}
type WeightEntryModel = Model<WeightEntryDocument>;

const WeightEntrySchema = new Schema<WeightEntryDocument, WeightEntryModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dateKey: { type: String, required: true }, // YYYY-MM-DD
    weight: { type: Number },
    bodyFat: { type: Number },
    muscle: { type: Number },
    memo: { type: String },
  },
  {
    timestamps: true,         // createdAt, updatedAt 자동 관리
    versionKey: false,        // __v 제거
  }
);

// 같은 유저/같은 날짜는 1건만
WeightEntrySchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export default model<WeightEntryDocument, WeightEntryModel>(
  "WeightEntry",
  WeightEntrySchema
);
