// server/src/middleware/requireAuth.ts
import type { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthedRequest extends Request {
  userId?: string;
}

type IdPayload = JwtPayload & { sub?: string; id?: string; _id?: string };

function extractToken(req: Request): string | undefined {
  // Authorization: Bearer <token>  (대소문자 무관)
  const auth = req.headers.authorization ?? "";
  if (typeof auth === "string") {
    const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
    if (m) return m[1];
  }
  // 보조 경로들 (선택)
  const x = req.headers["x-access-token"];
  if (typeof x === "string" && x) return x;
  if (typeof req.query?.token === "string" && req.query.token) return req.query.token;
  // 쿠키에 token이 있을 경우
  const anyReq = req as any;
  if (anyReq.cookies && typeof anyReq.cookies.token === "string") return anyReq.cookies.token;

  return undefined;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: "Unauthorized: no token" });

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("[requireAuth] Missing JWT_SECRET env");
    return res.status(500).json({ message: "Server misconfiguration" });
  }

  try {
    const payload = jwt.verify(token, secret) as IdPayload;
    const uid = (payload.sub || payload.id || payload._id) as string | undefined;
    if (!uid) return res.status(401).json({ message: "Unauthorized: invalid payload" });

    req.userId = uid;
    (res.locals as any).userId = uid; // 필요 시 라우터에서 사용
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized: invalid token" });
  }
}
