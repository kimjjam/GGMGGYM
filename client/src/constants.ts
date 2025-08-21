// 색상 팔레트
export const C = {
  primary: "#3B726B",
  navy: "#1F2F2C",
  white: "#FFFFFF",
  mute: "#8EA3A0",
} as const;

// 공통 타입
export type ButtonName =
  | "일기"
  | "운동검색"
  | "체중계"
  | "득근캘린더"
  | "몽글이뱃지";

export type TextAlign = "left" | "center" | "right" | "justify";
