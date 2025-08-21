// client/src/components/StretchingModal.tsx
import React from "react";
import { videosApi } from "../lib/api";

type UiVideo = {
  id: string;
  title: string;
  channelTitle?: string;
  thumb?: string;
  tags?: string[];
};

// DB가 비어 있을 때 임시로 보여줄 기본 3개
const FALLBACK_VIDEOS: UiVideo[] = [
  { id: "50WCSpZtdmA", title: "스트레칭" },
  { id: "BnNSjsXARjc", title: "레그익스텐션" },
  { id: "et370jWSmgk", title: "레그컬" },
];

const ytThumb = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

export default function StretchingModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [rightPos, setRightPos] = React.useState(0);

  const [dbItems, setDbItems] = React.useState<UiVideo[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // ADDED: 모바일 뷰인지 감지하는 상태
  const [isMobile, setIsMobile] = React.useState(false);

  // ADDED: 화면 크기가 변경될 때 isMobile 상태를 업데이트하는 useEffect
  React.useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768); // 768px을 모바일 기준으로 설정
    }
    handleResize(); // 컴포넌트 마운트 시 초기 실행
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 오른쪽 데코 위치
  React.useEffect(() => {
    function updatePosition() {
      const wndWidth = window.innerWidth;
      const modalMaxWidth = 960;
      const modalWidthVW = 94;
      const modalWidth = Math.min(modalMaxWidth, (wndWidth * modalWidthVW) / 100);
      const leftOfModal = (wndWidth - modalWidth) / 2;
      setRightPos(leftOfModal + modalWidth - 50);
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, []);

  // ESC 닫기
  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Esc") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // 서버에서 목록/검색 로드
  const loadFromDb = React.useCallback(async (q: string) => {
    setLoading(true);
    setErr(null);
    try {
      const params: any = { limit: 50, group: "stretching" }; // 원하면 group 제거
      if (q.trim()) params.q = q.trim();

      const { items } = await videosApi.list(params);
      const ui: UiVideo[] = (items || []).map((v: any) => ({
        id: v.youtubeId,
        title: v.title,
        channelTitle: v.channelTitle,
        tags: Array.isArray(v.tags) ? v.tags : undefined,
        thumb: v.thumb || ytThumb(v.youtubeId),
      }));
      setDbItems(ui);
    } catch (e: any) {
      setErr(e?.message || "목록을 불러오지 못했습니다.");
      setDbItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 모달 열릴 때 & 검색 변경 시(디바운스)
  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => loadFromDb(search), 200);
    return () => clearTimeout(t);
  }, [open, search, loadFromDb]);

  // DB가 비어있으면 폴백 사용
  const baseItems: UiVideo[] = React.useMemo(() => {
    if (dbItems.length > 0) return dbItems;
    if (!loading) {
      return FALLBACK_VIDEOS.map((v) => ({ ...v, thumb: ytThumb(v.id) }));
    }
    return [];
  }, [dbItems, loading]);

  // ✅ 클라이언트 부분일치 필터 (제목/채널/태그)
  const effectiveItems: UiVideo[] = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return baseItems;
    return baseItems.filter((v) => {
      const title = (v.title || "").toLowerCase();
      const ch = (v.channelTitle || "").toLowerCase();
      const tags = Array.isArray(v.tags) ? v.tags.join(" ").toLowerCase() : "";
      return title.includes(q) || ch.includes(q) || tags.includes(q);
    });
  }, [baseItems, search]);

  // 목록이 바뀌면 첫 영상 자동 선택
  React.useEffect(() => {
    if (effectiveItems.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !effectiveItems.some((v) => v.id === selectedId)) {
      setSelectedId(effectiveItems[0].id);
    }
  }, [effectiveItems, selectedId]);

  // 폴백을 DB에 업서트(시드)
  const handleSeedToServer = React.useCallback(async () => {
    try {
      const payload = FALLBACK_VIDEOS.map((v) => ({
        youtubeId: v.id,
        title: v.title,
        channelTitle: v.channelTitle,
        thumb: ytThumb(v.id),
        tags: ["스트레칭", "레그", "레그컬", "레그익스텐션"],
        groups: ["stretching"],
      }));
      await videosApi.bulk(payload);
      await loadFromDb("");
      alert("서버에 등록되었습니다.");
    } catch (e: any) {
      alert(e?.message || "서버 등록에 실패했습니다.");
    }
  }, [loadFromDb]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 3000,
        padding: 12,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* 오른쪽 데코 */}
      <img
        src="/images/mongleright.png"
        alt="스트레칭 모달 데코"
        style={{
          position: "absolute",
          left: rightPos,
          top: "50%",
          transform: "translateY(-50%)",
          width: "400px",
          height: "auto",
          pointerEvents: "none",
          zIndex: 2002,
          // CHANGED: 모바일일 때 숨김 처리
          display: isMobile ? "none" : "block",
        }}
      />

      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 22,
          width: "100%",
          maxWidth: 960,
          // CHANGED: 모바일에서 높이를 조절하고, 가로/세로 배열을 동적으로 변경
          height: isMobile ? "90vh" : "auto",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          boxShadow: "0 10px 24px rgba(0,0,0,.1)",
          overflow: "hidden",
        }}
      >
        {/* Left: Player */}
        <div
          style={{
            // CHANGED: 모바일 세로 배열에 맞게 flex 속성 조정
            flex: isMobile ? "0 0 40%" : "1 1 50%",
            minHeight: isMobile ? 220 : "auto", // 모바일에서 플레이어 최소 높이 확보
            backgroundColor: "#000",
            position: "relative",
          }}
        >
          {selectedId ? (
            <iframe
              key={selectedId}
              style={{ width: "100%", height: "100%", border: "none" }}
              src={`https://www.youtube.com/embed/${selectedId}?autoplay=1&mute=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="운동 영상"
            />
          ) : (
            <div
              style={{
                color: "#fff",
                fontSize: 18,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              {loading ? "불러오는 중…" : "검색 결과가 없습니다."}
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div
          style={{
            // CHANGED: 모바일 세로 배열에 맞게 flex 속성 조정 및 내부 스크롤을 위해 overflow 설정
            flex: isMobile ? "1 1 60%" : "1 1 50%",
            padding: 16,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden", // 이 div의 높이를 넘어가는 컨텐츠를 숨겨 자식에서 스크롤이 가능하게 함
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
            <input
              type="text"
              placeholder="운동 이름/키워드로 검색 (예: 레그, 스트레칭)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flexGrow: 1,
                padding: "8px 12px",
                borderRadius: 12,
                border: "2px solid #7E7058",
                fontSize: 16,
                fontFamily: "'BMJUA', sans-serif",
              }}
            />
            {/* ▼ X 버튼: 모달 닫기 전용 */}
            <button
              onClick={onClose}
              aria-label="모달 닫기"
              style={{
                backgroundColor: "#FFAE00",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "8px 16px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 16,
                fontFamily: "'BMJUA', sans-serif",
              }}
            >
              X
            </button>
          </div>

          {err && (
            <div style={{ marginBottom: 8, color: "crimson", fontSize: 13 }}>
              {err}
            </div>
          )}

          {/* 폴백만 노출 중이면 시드 버튼 보이기 */}
          {dbItems.length === 0 && !loading && !search.trim() && (
            <div style={{ marginBottom: 10, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleSeedToServer}
                style={{
                  border: "1px solid #ddd",
                  background: "#fff",
                  borderRadius: 10,
                  padding: "6px 10px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
                title="현재 기본 3개 영상을 서버 DB에 저장합니다."
              >
                기본 3개 서버에 등록
              </button>
            </div>
          )}

          {/* 리스트 */}
          <div
            style={{
              overflowY: "auto",
              flexGrow: 1,
              display: "grid",
              // CHANGED: 모바일에서는 2열 그리드로 표시하여 공간 활용도 높임
              gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr",
              gap: 12,
              paddingRight: isMobile ? 4 : 0, // 스크롤바 공간 확보
            }}
          >
            {effectiveItems.length === 0 && !loading && (
              <div
                style={{
                  textAlign: "center",
                  color: "#7E7058",
                  fontFamily: "'BMJUA', sans-serif",
                  // CHANGED: 모바일에서 그리드 전체 너비를 차지하도록 설정
                  gridColumn: isMobile ? "1 / -1" : "auto",
                }}
              >
                검색 결과 없음
              </div>
            )}

            {effectiveItems.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                style={{
                  cursor: "pointer",
                  border: v.id === selectedId ? "3px solid #FFAE00" : "3px solid transparent",
                  borderRadius: 14,
                  overflow: "hidden",
                  padding: 0,
                  background: "none",
                  boxShadow: v.id === selectedId ? "0 0 10px #FFAE00" : "none",
                }}
                aria-label={`재생할 영상 선택: ${v.title}`}
                title={v.title}
              >
                <img
                  src={v.thumb || ytThumb(v.id)}
                  alt={v.title}
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
