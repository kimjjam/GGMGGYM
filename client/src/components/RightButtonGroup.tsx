import type { GroupProps } from './LeftButtonGroup';

type ButtonName = '일기' | '운동검색' | '체중계';

const buttonImageSrc: Record<ButtonName, string> = {
  '일기': '../images/diarybtn.png',
  '운동검색': '../images/searchbtn.png',
  '체중계': '../images/weightbtn.png',
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

  const sizeStyle: React.CSSProperties = {
    width: buttonSize,
    height: buttonSize,
    minWidth: minSize ? `${minSize}px` : undefined,
    minHeight: minSize ? `${minSize}px` : undefined,
    maxWidth: maxSize ? `${maxSize}px` : undefined,
    maxHeight: maxSize ? `${maxSize}px` : undefined,
    padding: 0,
    border: 'none', // 테두리 제거
    background: 'transparent', // 배경 제거
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column', // 세로 정렬
    alignItems: 'center',
    justifyContent: 'center',
  };

  const textStyle: React.CSSProperties = {
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
