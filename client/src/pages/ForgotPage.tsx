import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export default function ForgotPage() {
  useEffect(() => {
    const id = "diary-font-poorstory";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Poor+Story&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      await api.forgot({ email });
      setMsg("재설정 메일을 보냈습니다. (등록된 이메일일 경우)");
    } catch {
      setMsg("재설정 메일을 보냈습니다. (등록된 이메일일 경우)");
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
        <div style={styles.decorTopLeft} aria-hidden />
        <div style={styles.decorBottomLeft} aria-hidden />
        <div style={styles.decorTopRight} aria-hidden />
        <div style={styles.decorBottomRight} aria-hidden />

        <div style={styles.titleRow}>
          <h1 style={styles.titleText}>정글몽글짐</h1>
        </div>

        <div style={styles.infoRowSingle}>
          <span style={styles.infoPill}>{dateText}</span>
        </div>

        <div style={styles.centerArea}>
          <div style={styles.card}>
            <form onSubmit={onSubmit} style={styles.form}>
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

              {msg && <p style={{ ...styles.info, color: "green" }}>{msg}</p>}

              <button disabled={loading} type="submit" style={styles.submitBtn}>
                {loading ? "요청 중..." : "재설정 메일 보내기"}
              </button>

              <div style={styles.links}>
                <Link to="/login" style={styles.link}>로그인으로 돌아가기</Link>
                <span style={{ width: 12 }} />
                <Link to="/register" style={styles.link}>회원가입</Link>
              </div>
            </form>
          </div>
        </div>

        <div style={styles.subjectRow}>
          제목 : <span style={{ opacity: 0.6 }}>비밀번호 재설정 안내</span>
        </div>
      </div>
    </div>
  );
}

const baseFont = `'BMJUA', sans-serif`;
const styles: Record<string, React.CSSProperties> = {
  pageWrap: { minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", fontFamily: baseFont },
  diaryCard: { position: "relative", width: "min(780px, 95vw)", background: "#fff6c9", border: "6px solid #1f2937", borderRadius: 22, boxShadow: "0 22px 38px rgba(0,0,0,0.12)", padding: "22px 22px 26px", overflow: "hidden", fontFamily: baseFont },
  decorTopLeft: { position: "absolute", top: 10, left: 14, width: 120, height: 60, background:"radial-gradient(circle at 0 100%, #ff8a8a 22px, transparent 23px), radial-gradient(circle at 0 100%, #ffd166 44px, transparent 45px), radial-gradient(circle at 0 100%, #7cc3ff 66px, transparent 67px)", opacity: 0.6, pointerEvents: "none" },
  decorBottomLeft: { position: "absolute", left: -8, bottom: -8, width: 160, height: 120, background:"radial-gradient(closest-side, #9de1ff, transparent 70%), radial-gradient(closest-side, #ffd1e6, transparent 70%)", filter: "blur(2px)", opacity: 0.7, pointerEvents: "none" },
  decorTopRight: { position: "absolute", top: 6, right: 12, width: 100, height: 70, background:"radial-gradient(closest-side, #ffadc7, transparent 70%), radial-gradient(closest-side, #c1f0b5, transparent 70%)", opacity: 0.7, pointerEvents: "none" },
  decorBottomRight: { position: "absolute", right: -10, bottom: -12, width: 120, height: 120, background:"radial-gradient(closest-side, #ffd166, transparent 70%), radial-gradient(closest-side, #a68cff, transparent 70%)", opacity: 0.7, pointerEvents: "none" },
  titleRow: { display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  titleText: { margin: 0, fontWeight: 900, fontSize: 36, color: "#0f172a", letterSpacing: "-0.3px", textAlign: "center" },
  infoRowSingle: { display: "flex", justifyContent: "center", alignItems: "center", background: "#fff", border: "3px solid #111827", borderRadius: 14, padding: "10px 12px", marginBottom: 14 },
  infoPill: { display: "inline-block", width: "92%", maxWidth: "640px", textAlign: "center", padding: "10px 20px", borderRadius: 12, border: "1.5px dashed #9ca3af", fontSize: 18, fontWeight: 900, color: "#1f2937", background: "#fafafa", letterSpacing: "0.2px" },
  centerArea: { display: "grid", placeItems: "center", margin: "8px 0 12px" },
  card: { width: "100%", maxWidth: 560, borderRadius: 18, border: "4px solid #111827", background: "#ffffff", boxShadow: "0 12px 20px rgba(0,0,0,0.12), inset 0 0 0 8px rgba(255,255,255,0.6)", padding: 20, overflow: "hidden", boxSizing: "border-box" },
  subjectRow: { borderTop: "3px solid #111827", borderBottom: "3px solid #111827", padding: "10px 6px", marginTop: 14, fontWeight: 800, color: "#1f2937", fontSize: 18 },
  form: { display: "grid", gridTemplateColumns: "1fr", gap: 10 },
  label: { fontSize: 15, color: "#374151", fontWeight: 900, background: "rgba(255,255,255,0.85)", width: "fit-content", padding: "3px 8px", borderRadius: 8, border: "1px solid #e5e7eb" },
  input: { width: "100%", boxSizing: "border-box", borderRadius: 12, border: "2px solid #1f2937", padding: "13px 14px", background: "#ffffff", outline: "none", fontSize: 16, boxShadow: "2px 2px 0 #1f2937", color: "#111827", caretColor: "#111827" },
  info: { marginTop: 4, fontWeight: 800 },
  submitBtn: { marginTop: 6, padding: "13px 14px", borderRadius: 14, border: "2px solid #1f2937", background: "#111827", color: "#fff", fontWeight: 900, fontSize: 16, cursor: "pointer", boxShadow: "2px 2px 0 #1f2937" },
  links: { marginTop: 8, display: "flex", justifyContent: "center", gap: 16, fontSize: 15 },
  link: { color: "#4f46e5", textDecoration: "none", fontWeight: 800 },
};
