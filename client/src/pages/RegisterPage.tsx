// client/src/pages/RegisterPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function RegisterPage() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (password.length < 6) return setErr("비밀번호는 6자 이상이어야 합니다.");
    if (password !== confirm) return setErr("비밀번호가 일치하지 않습니다.");

    setLoading(true);
    try {
      // 회원가입 요청
      const res: any = await api.register({ name, email, password, confirm });

      // ✅ 가입일 저장 (응답에 createdAt이 있으면 그 값, 없으면 현재시각)
      const createdAtFromResponse =
        res?.data?.user?.createdAt ??
        res?.user?.createdAt ??
        res?.createdAt ??
        null;

      const createdAtISO = createdAtFromResponse
        ? new Date(createdAtFromResponse).toISOString()
        : new Date().toISOString();

      localStorage.setItem("signupDate", createdAtISO);

      // ✅ 자동 로그인 없이 로그인 페이지로 이동
      nav("/login", { replace: true /* , state: { justRegistered: true, email } */ });
    } catch (e: any) {
      setErr(e?.message || "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const dateText = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;

  return (
    <div style={styles.pageWrap}>
      <style>{`
        .diary-input::placeholder { color:#9ca3af; opacity:1; }
        .diary-input:-webkit-autofill,
        .diary-input:-webkit-autofill:hover,
        .diary-input:-webkit-autofill:focus {
          -webkit-text-fill-color:#111827;
          box-shadow: 0 0 0px 1000px #ffffff inset;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      <div style={styles.diaryCard}>
        {/* 장식 */}
        <div style={styles.decorTopLeft} aria-hidden />
        <div style={styles.decorBottomLeft} aria-hidden />
        <div style={styles.decorTopRight} aria-hidden />
        <div style={styles.decorBottomRight} aria-hidden />

        {/* 타이틀 */}
        <div style={styles.titleRow}>
          <h1 style={styles.titleText}>정글몽글짐</h1>
        </div>

        {/* 날짜 */}
        <div style={styles.infoRowSingle}>
          <span style={styles.infoPill}>{dateText}</span>
        </div>

        {/* 회원가입 카드 */}
        <div style={styles.centerArea}>
          <div style={styles.card}>
            <form onSubmit={onSubmit} style={styles.form}>
              <label style={styles.label}>닉네임</label>
              <input
                className="diary-input"
                style={styles.input}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="말랑이"
                required
              />

              <label style={styles.label}>이메일</label>
              <input
                className="diary-input"
                style={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                required
              />

              <label style={styles.label}>비밀번호</label>
              <input
                className="diary-input"
                style={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <label style={styles.label}>비밀번호 확인</label>
              <input
                className="diary-input"
                style={styles.input}
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="다시 입력"
                required
              />

              {err && <p style={styles.error}>{err}</p>}

              <button disabled={loading} type="submit" style={styles.submitBtn}>
                {loading ? "가입 중..." : "가입하기"}
              </button>

              <div style={styles.links}>
                <Link to="/login" style={styles.link}>이미 계정이 있어요</Link>
              </div>
            </form>
          </div>
        </div>

        {/* 제목 라인 */}
        <div style={styles.subjectRow}>
          제목 : <span style={{ opacity: 0.6 }}>정글몽글짐에 입성!</span>
        </div>
      </div>
    </div>
  );
}

/* ======= 스타일 ======= */
const baseFont = `'BMJUA', sans-serif`;

const styles: Record<string, React.CSSProperties> = {
  pageWrap: { minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", fontFamily: baseFont },
  diaryCard: {
    position: "relative", width: "min(780px, 95vw)", background: "#fff6c9",
    border: "6px solid #1f2937", borderRadius: 22, boxShadow: "0 22px 38px rgba(0,0,0,0.12)",
    padding: "22px 22px 26px", overflow: "hidden", fontFamily: baseFont,
  },
  decorTopLeft: { position: "absolute", top: 10, left: 14, width: 120, height: 60,
    background: "radial-gradient(circle at 0 100%, #ff8a8a 22px, transparent 23px), radial-gradient(circle at 0 100%, #ffd166 44px, transparent 45px), radial-gradient(circle at 0 100%, #7cc3ff 66px, transparent 67px)",
    opacity: 0.6, pointerEvents: "none" },
  decorBottomLeft: { position: "absolute", left: -8, bottom: -8, width: 160, height: 120,
    background: "radial-gradient(closest-side, #9de1ff, transparent 70%), radial-gradient(closest-side, #ffd1e6, transparent 70%)",
    filter: "blur(2px)", opacity: 0.7, pointerEvents: "none" },
  decorTopRight: { position: "absolute", top: 6, right: 12, width: 100, height: 70,
    background: "radial-gradient(closest-side, #ffadc7, transparent 70%), radial-gradient(closest-side, #c1f0b5, transparent 70%)",
    opacity: 0.7, pointerEvents: "none" },
  decorBottomRight: { position: "absolute", right: -10, bottom: -12, width: 120, height: 120,
    background: "radial-gradient(closest-side, #ffd166, transparent 70%), radial-gradient(closest-side, #a68cff, transparent 70%)",
    opacity: 0.7, pointerEvents: "none" },

  titleRow: { display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  titleText: { margin: 0, fontWeight: 900, fontSize: 36, color: "#0f172a", letterSpacing: "-0.3px", textAlign: "center" },

  infoRowSingle: {
    display: "flex", justifyContent: "center", alignItems: "center",
    background: "#fff", border: "3px solid #111827", borderRadius: 14, padding: "10px 12px", marginBottom: 14,
  },
  infoPill: {
    display: "inline-block", width: "92%", maxWidth: "640px", textAlign: "center",
    padding: "10px 20px", borderRadius: 12, border: "1.5px dashed #9ca3af",
    fontSize: 18, fontWeight: 900, color: "#1f2937", background: "#fafafa", letterSpacing: "0.2px",
  },

  centerArea: { display: "grid", placeItems: "center", margin: "8px 0 12px" },
  card: {
    width: "100%", maxWidth: 560, borderRadius: 18, border: "4px solid #111827", background: "#ffffff",
    boxShadow: "0 12px 20px rgba(0,0,0,0.12), inset 0 0 0 8px rgba(255,255,255,0.6)",
    padding: 20, overflow: "hidden", boxSizing: "border-box",
  },

  subjectRow: { borderTop: "3px solid #111827", borderBottom: "3px solid #111827", padding: "10px 6px", marginTop: 14, fontWeight: 800, color: "#1f2937", fontSize: 18 },

  form: { display: "grid", gridTemplateColumns: "1fr", gap: 10 },
  label: { fontSize: 15, color: "#374151", fontWeight: 900, background: "rgba(255,255,255,0.85)", width: "fit-content", padding: "3px 8px", borderRadius: 8, border: "1px solid #e5e7eb" },
  input: {
    width: "100%", boxSizing: "border-box", borderRadius: 12, border: "2px solid #1f2937",
    padding: "13px 14px", background: "#ffffff", outline: "none", fontSize: 16,
    boxShadow: "2px 2px 0 #1f2937", color: "#111827", caretColor: "#111827",
  },
  error: { marginTop: 4, color: "crimson", fontWeight: 800 },
  submitBtn: {
    marginTop: 6, padding: "13px 14px", borderRadius: 14, border: "2px solid #1f2937",
    background: "#111827", color: "#fff", fontWeight: 900, fontSize: 16,
    cursor: "pointer", boxShadow: "2px 2px 0 #1f2937",
  },
  links: { marginTop: 8, display: "flex", justifyContent: "center", fontSize: 15 },
  link: { color: "#4f46e5", textDecoration: "none", fontWeight: 800 },
};
