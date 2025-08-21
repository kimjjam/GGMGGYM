import nodemailer from "nodemailer";

const hasSMTP = !!process.env.SMTP_HOST;
const from = process.env.FROM_EMAIL || "noreply@demomailtrap.co";

// 포트에 따라 secure 자동 결정 (465 = true, 그 외 false)
const PORT = Number(process.env.SMTP_PORT || 587);
const SECURE = PORT === 465;

// transporter: SMTP 설정이 있으면 실제 전송, 없으면 콘솔 출력 전용
export const transporter: nodemailer.Transporter = hasSMTP
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: PORT,
      secure: SECURE,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : nodemailer.createTransport({ jsonTransport: true });

// 서버 시작 시 연결 검증 로그
(async () => {
  try {
    if (hasSMTP) {
      await transporter.verify();
      console.log(`[MAIL] SMTP ready on ${process.env.SMTP_HOST}:${PORT} (secure=${SECURE})`);
    } else {
      console.log("[MAIL] SMTP not configured; using dev jsonTransport (console output)");
    }
  } catch (err: any) {
    console.error("[MAIL] SMTP verify failed:", err?.message || err);
  }
})();

// ✅ 단 하나의 sendMail 함수만 export (중복 선언 금지)
export async function sendMail(to: string, subject: string, html: string) {
  if (!hasSMTP) {
    // 개발용: 콘솔에 메일 내용 출력
    console.log("\n[MAIL:DEV]");
    console.log("TO   :", to);
    console.log("SUBJ :", subject);
    console.log("HTML :", html, "\n");
    return;
  }
  await transporter.sendMail({ from, to, subject, html });
}
