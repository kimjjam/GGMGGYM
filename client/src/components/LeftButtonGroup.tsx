// client/src/components/LeftButtonGroup.tsx
import React from "react";
import type { ButtonName } from "../constants";


export type GroupProps = {
  onClick: (name: ButtonName) => void;
  buttonSize?: string; // e.g. '64px'
  minSize?: number;
  maxSize?: number;
};

const buttonImageSrc: Record<ButtonName, string> = {
  "득근캘린더": "../images/calendarbtn.png",
  "몽글이뱃지": "../images/badgebtn.png",
  "일기": "../images/diarybtn.png",
  "운동검색": "../images/searchbtn.png",
  "체중계": "../images/scalebtn.png",
};

export default function LeftButtonGroup({
  onClick,
  buttonSize = "64px",
  minSize,
  maxSize,
}: GroupProps) {
  const buttons: ButtonName[] = ["득근캘린더", "몽글이뱃지"];

  const sizeStyle: React.CSSProperties = {
    width: buttonSize,
    height: buttonSize,
    minWidth: minSize ? `${minSize}px` : undefined,
    minHeight: minSize ? `${minSize}px` : undefined,
    maxWidth: maxSize ? `${maxSize}px` : undefined,
    maxHeight: maxSize ? `${maxSize}px` : undefined,
    padding: 0,
    border: "none", // 테두리 제거
    background: "transparent", // 배경색 제거
    cursor: "pointer",
    display: "flex",
    flexDirection: "column", // 세로 정렬
    alignItems: "center",
    justifyContent: "center",
  };

  const textStyle: React.CSSProperties = {
    marginTop: 4,
    color: "#3B3B3B",
    fontWeight: 600,
    fontSize: 14,
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        alignItems: "center",
        zIndex: 10,
        position: "relative",
        marginTop: 150,
      }}
    >
      {buttons.map((name) => (
        <button
          key={name}
          onClick={() => onClick(name)}
          aria-label={name}
          type="button"
          style={sizeStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          <img
            src={buttonImageSrc[name]}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
          <span style={textStyle}>{name}</span>
        </button>
      ))}
    </div>
  );
}
