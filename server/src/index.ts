// server/src/index.ts
import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";

import authRouter from "./routes/auth";
import meRouter from "./routes/me";
import dailyRouter from "./routes/daily";
import weightsRouter from "./routes/weights";
import dietMemoRouter from "./routes/dietMemo";
import diaryRouter from "./routes/diary";
import favoritesRouter from "./routes/favorites";
import workoutsRouter from "./routes/workouts";
import workoutLogsRouter from "./routes/workoutLogs";
import videosRouter from "./routes/videos";

// ✅ 텍스트 인덱스 설정 변경 반영을 위해 1회 동기화용
import Video from "./models/Video"; // (title/tags/channelTitle text index, default_language: "none")

const app = express();

/* =========================
   CORS
   ========================= */
const allowList = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowList.length ? allowList : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// app.set("trust proxy", 1); // 프록시 뒤에 있으면 사용

/* =========================
   Parsers & Logger
   ========================= */
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

/* =========================
   Health Check
   ========================= */
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

/* =========================
   Routers
   ========================= */
// Auth
app.use("/api/auth", authRouter);

// me(프로필/목표체중)
app.use("/api", meRouter);

// Core features
app.use("/api", diaryRouter);
app.use("/api", dailyRouter);
app.use("/api", weightsRouter);
app.use("/api", dietMemoRouter);
app.use("/api", favoritesRouter);
app.use("/api", videosRouter);

// Workouts
app.use("/api/workouts", workoutsRouter);
app.use("/api", workoutLogsRouter);

/* =========================
   404 for unknown /api
   ========================= */
app.use("/api", (_req, res) => {
  return res.status(404).json({ message: "Not Found" });
});

/* =========================
   Error Handler
   ========================= */
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("[ERROR]", err);
  const status = typeof (err as any)?.status === "number" ? (err as any).status : 500;
  res.status(status).json({
    message: (err as any)?.message ?? "Internal Server Error",
  });
};
app.use(errorHandler);

/* =========================
   Bootstrap
   ========================= */
const PORT = Number(process.env.PORT || 4000);

async function bootstrap() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }

  // mongoose.set("strictQuery", true); // 선택

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Mongo connected");

  // ✅ Video 컬렉션 인덱스 동기화(기존 text 인덱스 갱신/드롭 후 재생성)
  try {
    const r = await Video.syncIndexes();
    console.log("Video.syncIndexes() done:", r);
  } catch (e) {
    console.warn("Video.syncIndexes() failed:", (e as Error).message);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
    console.log("CORS allow list:", allowList);
  });
}

bootstrap().catch((e) => {
  console.error(e);
  process.exit(1);
});
