import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type DailyStatusButtonsProps = {
  handleIconClick: (cardType: string) => void;
};

const borderColors: Record<string, string> = {
  "#FFF8E7": "#cdbd81",
  "#FFD680": "#bfa332",
  "#B3C0E4": "#7a8bbf",
  "#65CFC7": "#3a8b86",
};

const shadowColors: Record<string, string> = {
  "#FFF8E7": "rgba(205,189,129,0.4)",
  "#FFD680": "rgba(191,163,50,0.4)",
  "#B3C0E4": "rgba(122,139,191,0.4)",
  "#65CFC7": "rgba(58,139,134,0.4)",
};

const buttonImageSrc: Record<string, string> = {
  "오늘은 살살": "../images/grade1.png",
  "오늘은 적당히": "../images/grade2.png",
  "오늘은 빡세게": "../images/grade3.png",
  "나만의 운동": "../images/minebtn.png",
};

function useResponsiveStyles() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 600);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const cardMobile: CSSProperties = {
    fontFamily: "'BMJUA', sans-serif",
    width: "96px",
    height: "96px", // 키와 너비 동일해서 이미지 넣기 좋아짐
    borderRadius: "24px", // 둥글게
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    cursor: "pointer",
    userSelect: "none",
    transition: "transform 0.08s ease",
    border: "3px solid transparent",
    padding: 0,
  };

  const cardDesktop: CSSProperties = {
    fontFamily: "'BMJUA', sans-serif",
    width: "120px",
    height: "120px", // 넉넉히 이미지랑 텍스트 둘 다 가능
    borderRadius: "28px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
    cursor: "pointer",
    userSelect: "none",
    transition: "transform 0.08s ease",
    border: "3px solid transparent",
    padding: 0,
  };

  const wrapperMobile: CSSProperties = {
    display: "flex",
    justifyContent: "center",
    gap: "18px",
    margin: "150px 0 10px 0",
    flexWrap: "wrap",
  };

  const wrapperDesktop: CSSProperties = {
    display: "flex",
    justifyContent: "space-around",
    gap: "14px",
    margin: "170px 0 10px 0",
    flexWrap: "wrap",
  };

  return {
    card: isMobile ? cardMobile : cardDesktop,
    wrapper: isMobile ? wrapperMobile : wrapperDesktop,
    font: isMobile
      ? { fontWeight: "bold", fontSize: "0.95rem", marginTop: 6 }
      : { fontWeight: "bold", fontSize: "1.03rem", marginTop: 8 },
  };
}

function DailyStatusButtons({ handleIconClick }: DailyStatusButtonsProps) {
  const { card, wrapper, font } = useResponsiveStyles();

  const buttons = [
    { name: "오늘은 살살", background: "#FFF8E7" },
    { name: "오늘은 적당히", background: "#FFD680" },
    { name: "오늘은 빡세게", background: "#B3C0E4" },
    { name: "나만의 운동", background: "#65CFC7" },
  ];

  return (
    <div style={wrapper}>
      {buttons.map(({ name, background }) => {
        const borderColor = borderColors[background] || "transparent";
        const shadowColor = shadowColors[background] || "rgba(0,0,0,0.1)";
        return (
          <div
            key={name}
            style={{
              ...card,
              backgroundColor: background,
              border: `3px solid ${borderColor}`,
              boxShadow: `0 4px 12px ${shadowColor}`,
              flexDirection: "column",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => handleIconClick(name)}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "scale(0.98)";
              e.currentTarget.style.boxShadow = `0 6px 20px ${shadowColor}`;
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = `0 4px 12px ${shadowColor}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = `0 4px 12px ${shadowColor}`;
            }}
            aria-label={name}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === "Enter" || e.key === " ") handleIconClick(name);
            }}
          >
            <img
              src={buttonImageSrc[name]}
              alt={name}
              style={{ width: "48px", height: "48px", objectFit: "contain" }}
            />
            <span style={{ ...font, color: "#3B3B3B", userSelect: "none" }}>
              {name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default DailyStatusButtons;
