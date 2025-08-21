// client/src/components/common/CalendarModal.tsx
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  value: string; // YYYY-MM-DD
  onChange: (dateKey: string) => void;
  onClose: () => void;
};

const C = {
  white: "#fff",
  line: "#e8edf3",
  navy: "#163353",
  primary: "#3cbaba",
};

export default function CalendarModal({ open, value, onChange, onClose }: Props) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  if (!open) return null;

  return (
    <div style={S.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.sheet} role="dialog" aria-modal="true" aria-labelledby="cal-title">
        <header style={S.header}>
          <div id="cal-title" style={{ fontWeight: 900, color: C.navy }}>날짜 선택</div>
          <button onClick={onClose} aria-label="닫기" style={S.close}>✕</button>
        </header>

        <div style={{ padding: 16 }}>
          <input
            type="date"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            style={S.input}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
            <button onClick={() => setLocal(today())} style={S.secondary}>오늘</button>
            <button
              onClick={() => {
                onChange(local);
                onClose();
              }}
              style={S.primary}
            >
              이동
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const S: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.25)",
    display: "grid",
    placeItems: "center",
    zIndex: 50,
    padding: 12,
  },
  sheet: {
    width: "min(420px, 96vw)",
    background: C.white,
    borderRadius: 16,
    border: `1px solid ${C.line}`,
    boxShadow: "0 20px 50px rgba(0,0,0,.18)",
    overflow: "hidden",
  },
  header: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    padding: "12px 14px",
    borderBottom: `1px solid ${C.line}`,
    background: "#f6fbfa",
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: `1px solid ${C.line}`,
    background: C.white,
    cursor: "pointer",
  },
  input: {
    width: "100%",
    height: 40,
    borderRadius: 10,
    border: `1px solid ${C.line}`,
    padding: "0 12px",
    color: C.navy,
    outline: "none",
  },
  primary: {
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${C.primary}`,
    background: C.primary,
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
  },
  secondary: {
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${C.line}`,
    background: "#fff",
    color: C.navy,
    cursor: "pointer",
    fontWeight: 800,
  },
};
