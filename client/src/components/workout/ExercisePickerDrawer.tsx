import { useEffect, useMemo, useState } from "react";
import { favApi } from "../../lib/api";

export type PickerItem = {
  id: string;
  title: string;
  group: "back" | "shoulder" | "chest" | "arm" | "legs" | "cardio";
  image?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  items: PickerItem[];
  defaultGroup?: PickerItem["group"];
  onPick: (item: PickerItem) => void;
};

const C = {
  primary: "#3cbaba",
  navy: "#163353",
  line: "#e8edf3",
  chipBg: "#eef8f7",
  white: "#fff",
  mute: "#6b7280",
};

const GROUP_LABEL: Record<PickerItem["group"], string> = {
  back: "등",
  chest: "가슴",
  shoulder: "어깨",
  arm: "팔",
  legs: "하체",
  cardio: "유산소",
};

type FilterKey = "fav" | "all" | PickerItem["group"];
const PILL_ORDER: FilterKey[] = ["fav", "all", "back", "chest", "shoulder", "arm", "legs", "cardio"];

export default function ExercisePickerDrawer({
  open,
  onClose,
  items,
  defaultGroup,
  onPick,
}: Props) {
  const [category, setCategory] = useState<FilterKey>("all");
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 600);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    favApi
      .list()
      .then((arr) => setFavs(new Set(arr)))
      .catch(() => setFavs(new Set()));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (defaultGroup) setCategory(defaultGroup as FilterKey);
    else setCategory("fav");
  }, [open, defaultGroup]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const toggleFav = (id: string) => {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    favApi
      .toggle(id)
      .then((arr) => setFavs(new Set(arr)))
      .catch(() => {
        favApi.list().then((arr) => setFavs(new Set(arr))).catch(() => {});
      });
  };

  const filtered = useMemo(() => {
    if (category === "fav") return items.filter((i) => favs.has(i.id));
    if (category === "all") return items;
    return items.filter((i) => i.group === category);
  }, [items, category, favs]);

  if (!open) return null;

  return (
    <div
      style={{
        ...S.backdrop,
        padding: isMobile ? 6 : 12,
      }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          ...S.sheet,
          width: isMobile ? "96vw" : "min(1024px, 98vw)",
          maxHeight: isMobile ? "80vh" : "60vh",
          overflowY: "auto",
          padding: isMobile ? "8px 12px" : undefined,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
      >
        <header style={S.header}>
          <div id="picker-title" style={{ ...S.hTitle, fontSize: isMobile ? 18 : undefined }}>
            운동 선택
          </div>
          <button aria-label="닫기" onClick={onClose} style={S.closeBtn}>
            {/* ✕ 대신 SVG로 정확히 중앙 배치 */}
            <svg viewBox="0 0 24 24" style={S.closeIcon} aria-hidden="true">
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </svg>
          </button>
        </header>

        {/* 카테고리 Pills */}
        <div
          style={{
            ...S.pills,
            gap: isMobile ? 6 : 8,
            padding: isMobile ? "8px 12px 4px 12px" : "12px 16px 4px 16px",
          }}
        >
          {PILL_ORDER.map((k) => {
            const label = k === "fav" ? "커스텀" : k === "all" ? "전체" : GROUP_LABEL[k as PickerItem["group"]];
            const selected = category === k;
            return (
              <button
                key={k}
                onClick={() => setCategory(k)}
                style={{
                  ...S.pill,
                  background: selected ? C.primary : C.white,
                  color: selected ? "#fff" : C.navy,
                  borderColor: selected ? C.primary : C.line,
                  fontSize: isMobile ? 12 : 13,
                  padding: isMobile ? "6px 10px" : "8px 14px",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* 리스트 */}
        <div
          style={{
            ...S.list,
            maxHeight: isMobile ? "calc(80vh - 140px)" : "60vh",
            padding: isMobile ? 8 : 12,
          }}
        >
          {filtered.map((it) => {
            const isFav = favs.has(it.id);
            return (
              <div
                key={it.id}
                style={{
                  ...S.item,
                  gridTemplateColumns: isMobile ? "48px 1fr 32px 28px" : S.item.gridTemplateColumns,
                  gap: isMobile ? 8 : 12,
                  padding: isMobile ? "8px 10px" : "12px 14px",
                  borderRadius: isMobile ? 12 : 14,
                }}
              >
                <div
                  style={{
                    ...S.thumb,
                    width: isMobile ? 48 : 56,
                    height: isMobile ? 48 : 56,
                    borderRadius: isMobile ? 10 : 12,
                  }}
                >
                  {it.image ? <img src={it.image} alt="" style={S.img} /> : "🏋️"}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...S.iTitle, fontSize: isMobile ? 14 : undefined }}>{it.title}</div>
                  <div style={{ ...S.iMeta, fontSize: isMobile ? 10 : undefined }}>{GROUP_LABEL[it.group]}</div>
                </div>

                {/* 즐겨찾기 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFav(it.id);
                  }}
                  title={isFav ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                  style={{
                    ...S.star,
                    color: isFav ? C.primary : C.mute,
                    borderColor: isFav ? C.primary : C.line,
                    width: isMobile ? 28 : 36,
                    height: isMobile ? 28 : 36,
                    minWidth: isMobile ? 28 : 36,
                    fontSize: isMobile ? 14 : 18,
                  }}
                  aria-pressed={isFav}
                >
                  {isFav ? "★" : "☆"}
                </button>

                {/* 담기 */}
                <button
                  style={{
                    ...S.plus,
                    width: isMobile ? 24 : 28,
                    height: isMobile ? 24 : 28,
                    minWidth: isMobile ? 24 : 28,
                    fontSize: isMobile ? 16 : 18,
                  }}
                  onClick={() => onPick(it)}
                  title="담기"
                  aria-label="담기"
                >
                  ＋
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ ...S.empty, fontSize: isMobile ? 14 : undefined }}>
              {category === "fav" ? "즐겨찾기한 운동이 없어요." : "해당 카테고리에 등록된 운동이 없어요."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.25)",
    display: "grid",
    placeItems: "end center",
    zIndex: 50,
    padding: 12,
  },
  sheet: {
    width: "min(1024px, 98vw)",
    maxWidth: "98vw",
    background: C.white,
    borderRadius: 18,
    border: `1px solid ${C.line}`,
    boxShadow: "0 20px 50px rgba(0,0,0,.18)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    overflowX: "hidden",
  },
  header: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom: `1px solid ${C.line}`,
    background: C.chipBg,
  },
  hTitle: { fontWeight: 900, color: C.navy },

  closeBtn: {
    width: 40,
    height: 40,
    minWidth: 40,
    borderRadius: 12,
    border: `1px solid ${C.line}`,
    background: C.white,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    padding: 0,
  },
  closeIcon: {
    width: 18,
    height: 18,
    stroke: C.navy,
    strokeWidth: 2,
    strokeLinecap: "round",
    pointerEvents: "none",
    display: "block",
  } as React.CSSProperties,

  pills: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    padding: "12px 16px 4px 16px",
    boxSizing: "border-box",
    maxWidth: "100%",
  },
  pill: {
    border: `1px solid ${C.line}`,
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 13,
    color: C.navy,
    background: C.white,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  list: {
    maxHeight: "60vh",
    overflowY: "auto",
    overflowX: "hidden",
    padding: 12,
    boxSizing: "border-box",
    maxWidth: "100%",
  },
  item: {
    display: "grid",
    gridTemplateColumns: "56px 1fr 36px 28px",
    alignItems: "center",
    gap: 12,
    width: "100%",
    maxWidth: "100%",
    overflow: "hidden",
    padding: "12px 14px",
    borderRadius: 14,
    border: `1px solid ${C.line}`,
    background: "#f8fafc",
    marginBottom: 10,
    boxSizing: "border-box",
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
    background: C.white,
    border: `1px solid ${C.line}`,
  },
  img: { width: "100%", height: "100%", objectFit: "cover" } as React.CSSProperties,
  iTitle: {
    fontWeight: 800,
    color: C.navy,
    lineHeight: 1.1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  iMeta: { color: C.mute, fontSize: 12, marginTop: 2 },

  star: {
    justifySelf: "end",
    width: 36,
    height: 36,
    minWidth: 36,
    borderRadius: 10,
    border: `1px solid ${C.line}`,
    background: C.white,
    cursor: "pointer",
    fontSize: 18,
    display: "grid",
    placeItems: "center",
    padding: 0,
  },
  plus: {
    justifySelf: "end",
    width: 28,
    height: 28,
    minWidth: 28,
    borderRadius: 9,
    border: `1px solid ${C.line}`,
    background: C.white,
    cursor: "pointer",
    color: C.navy,
    fontSize: 18,
    display: "grid",
    placeItems: "center",
    padding: 0,
  },

  empty: {
    padding: 18,
    color: C.mute,
    textAlign: "center",
  },
};
