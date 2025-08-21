import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as crypto from "crypto";
import User from "../models/User";
import { sendMail } from "../utils/mailer";

const r = Router();
const JWT = process.env.JWT_SECRET || "change-me";

// ✅ 공통: 클라이언트로 돌려줄 user 직렬화( createdAt 포함 )
const toUserResponse = (user: any) => ({
  id: user._id,
  email: user.email,
  nickname: user.nickname,                // 기존 필드 유지
  name: user.nickname ?? user.name,       // 프론트에서 name 참조 가능하도록 보강
  createdAt: user.createdAt,              // ✅ 중요: D+ 계산용
});

/**
 * 회원가입
 * - 중복 이메일이면 409 + "이미 존재하는 계정입니다."
 * - 성공 시 201 + 토큰 반환
 */
r.post("/register", async (req, res, next) => {
  try {
    const { email, password, nickname } = req.body || {};
    if (!email || !password || !nickname) {
      return res.status(400).json({ message: "필수값 누락" });
    }

    const normEmail = String(email).trim().toLowerCase();
    const exists = await User.exists({ email: normEmail });
    if (exists) {
      return res.status(409).json({ message: "이미 존재하는 계정입니다." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email: normEmail, passwordHash, nickname });

    const token = jwt.sign({ id: user._id }, JWT, { expiresIn: "7d" });

    // ✅ createdAt 포함해서 응답
    return res.status(201).json({
      token,
      user: toUserResponse(user),
    });
  } catch (e: any) {
    if (e?.code === 11000) {
      return res.status(409).json({ message: "이미 존재하는 계정입니다." });
    }
    return next(e);
  }
});

/**
 * 로그인
 * - 자격증명 틀리면 401
 * - 성공 시 토큰 반환
 */
r.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "필수값 누락" });

  const user = await User.findOne({ email: String(email).trim().toLowerCase() });
  if (!user) return res.status(401).json({ message: "잘못된 자격증명" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "잘못된 자격증명" });

  const token = jwt.sign({ id: user._id }, JWT, { expiresIn: "7d" });

  // ✅ createdAt 포함해서 응답
  res.json({
    token,
    user: toUserResponse(user),
  });
});

/**
 * 비밀번호 찾기(리셋 메일 발송)
 * - 존재 여부는 숨기고 항상 200 반환
 * - SMTP 미설정 시 개발 편의를 위해 preview 링크도 함께 반환
 */
r.post("/forgot", async (req, res) => {
  const { email } = req.body || {};
  const normEmail = String(email || "").trim().toLowerCase();

  let preview: string | undefined;

  const user = await User.findOne({ email: normEmail });
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const ttlMin = Number(process.env.RESET_TOKEN_TTL_MIN || 60);

    user.resetTokenHash = tokenHash;
    user.resetTokenExp = new Date(Date.now() + ttlMin * 60 * 1000);
    await user.save();

    const appUrl = (process.env.APP_URL || "http://localhost:5173").replace(/\/+$/, "");
    const link = `${appUrl}/reset?token=${token}`;

    await sendMail(
      normEmail,
      "[말랑핏] 비밀번호 재설정 링크",
      `<p>비밀번호를 재설정하려면 아래 버튼을 눌러주세요(유효시간 ${ttlMin}분).</p>
       <p><a href="${link}" style="display:inline-block;padding:10px 16px;border:1px solid #333;border-radius:8px;text-decoration:none;">비밀번호 재설정</a></p>
       <p>직접 요청하지 않았다면 이 메일은 무시하셔도 됩니다.</p>`
    );

    if (!process.env.SMTP_HOST) {
      // SMTP가 없으면 개발용으로 바로 테스트할 수 있게 미리보기 링크 제공
      preview = link;
    }
  }

  return res.json({
    ok: true,
    message: "재설정 안내를 이메일로 보냈어요(등록된 경우).",
    preview, // 개발 환경에서만 채워짐
  });
});

/**
 * 비밀번호 재설정
 * - 토큰 검증(해시 비교 + 만료 확인)
 * - 성공 시 토큰 무효화 + 새 비번 저장 + JWT 발급(자동 로그인)
 */
r.post("/reset", async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ message: "필수값 누락" });

  const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
  const user = await User.findOne({
    resetTokenHash: tokenHash,
    resetTokenExp: { $gt: new Date() },
  });
  if (!user) return res.status(400).json({ message: "유효하지 않거나 만료된 토큰입니다." });

  user.passwordHash = await bcrypt.hash(String(password), 10);
  user.resetTokenHash = null;
  user.resetTokenExp = null;
  await user.save();

  const jwtToken = jwt.sign({ id: user._id }, JWT, { expiresIn: "7d" });

  // ✅ 재로그인 응답에도 createdAt 포함
  res.json({
    token: jwtToken,
    user: toUserResponse(user),
  });
});

export default r;
