// client/src/components/RightButtonGroup.tsx
import type { CSSProperties } from 'react';
import type { GroupProps } from './LeftButtonGroup';
import type { ButtonName } from "../constants";


const buttonImageSrc: Record<ButtonName, string> = {
  '일기': '../images/diarybtn.png',
  '운동검색': '../images/searchbtn.png',
  '체중계': '../images/weightbtn.png',
  '득근캘린더': '../images/calendarbtn.png', // Add appropriate image path
  '몽글이뱃지': '../images/badgebtn.png',    // Add appropriate image path
};

type RightButtonGroupProps = GroupProps & {
  weightDiff?: number | null;
  buttonSize?: string;
  minSize?: number;
  maxSize?: number;
};

export default function RightButtonGroup({
  onClick,
  weightDiff,
  buttonSize = '64px',
  minSize,
  maxSize,
}: RightButtonGroupProps) {
  const buttons: ButtonName[] = ['일기', '운동검색', '체중계'];

  const sizeStyle: CSSProperties = {
    width: buttonSize,
    height: buttonSize,
    minWidth: minSize ? `${minSize}px` : undefined,
    minHeight: minSize ? `${minSize}px` : undefined,
    maxWidth: maxSize ? `${maxSize}px` : undefined,
    maxHeight: maxSize ? `${maxSize}px` : undefined,
    padding: 0,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const textStyle: CSSProperties = {
    marginTop: 4,
    color: '#1F2F2C',
    fontWeight: 600,
    fontSize: 14,
    whiteSpace: 'nowrap',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        alignItems: 'center',
        zIndex: 10,
        position: 'relative',
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
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <img
            src={buttonImageSrc[name]}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
          <span style={textStyle}>{name}</span>
        </button>
      ))}

      {weightDiff !== null && weightDiff !== undefined && (
        <div
          style={{
            marginTop: -10,
            fontWeight: 'bold',
            fontSize: '1.2rem',
            color: '#3B726B',
            whiteSpace: 'nowrap',
          }}
        >
          목표까지
          <br /> {Math.abs(weightDiff).toFixed(1)}kg!
        </div>
      )}
    </div>
  );
}
