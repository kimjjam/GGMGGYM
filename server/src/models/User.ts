// server/src/models/User.ts
import { Schema, model, type Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  nickname: string;
  resetTokenHash?: string | null;
  resetTokenExp?: Date | null;
  exerciseStartDate?: Date;     // 가입일과 동일하게 기본값
  favoriteExercises: string[];  // 유저별 즐겨찾기 운동 ID 목록
  goalWeight?: number | null;   // ✅ 추가: 목표 체중(kg), 서버에 저장
  createdAt: Date;              // timestamps:true 기준
  updatedAt: Date;
}

const schema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    nickname: { type: String, required: true },
    resetTokenHash: { type: String, default: null },
    resetTokenExp: { type: Date, default: null },

    // 가입일(생성 시점)과 동일하게 기본값
    exerciseStartDate: {
      type: Date,
      default: function (this: any) {
        return this.createdAt || new Date();
      },
    },

    // 즐겨찾기 운동 ID 배열
    favoriteExercises: {
      type: [String],
      default: [],
    },

    // ✅ 추가: 목표 체중(kg). 입력 안 하면 null
    goalWeight: {
      type: Number,
      default: null,
      // 선택: 음수/비정상 값 방지 (필요 시 주석 해제)
      // min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false, // __v 숨김
  }
);

// 최초 저장 시 exerciseStartDate 보정
schema.pre("save", function (next) {
  // @ts-ignore
  if (!this.exerciseStartDate) {
    // @ts-ignore
    this.exerciseStartDate = this.createdAt || new Date();
  }
  next();
});

// 응답 직렬화: 민감정보 제거 + _id → id 변환
schema.set("toJSON", {
  transform(_doc, ret: any) {
    if (ret._id) {
      ret.id = ret._id;
      delete ret._id;
    }
    delete ret.passwordHash;
    delete ret.resetTokenHash;
    delete ret.resetTokenExp;
    return ret;
  },
});

export default model<IUser>("User", schema);
