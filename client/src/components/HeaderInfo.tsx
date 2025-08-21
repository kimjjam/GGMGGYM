import React, { useState, useEffect } from 'react';
import { useAuth } from '../store/auth';
import { daysSince } from '../utils/daysSince';

type HeaderInfoProps = {
  todayString: string;
  onLogout: () => void;
};

function HeaderInfo({ todayString, onLogout }: HeaderInfoProps) {
  const user = useAuth((s) => s.user);

  const signupDate =
    user?.createdAt ||
    (typeof window !== 'undefined' ? localStorage.getItem('signupDate') ?? undefined : undefined);

  const dday = signupDate ? daysSince(signupDate) : 0;

  // 모바일 여부 상태
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 600);
    }
    handleResize(); // 최초 설정
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 공통 스타일
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? 12 : 0,
    padding: isMobile ? '10px 20px' : undefined,
  };

  const sideStyle: React.CSSProperties = {
    minWidth: isMobile ? 'auto' : '120px',
    textAlign: isMobile ? 'center' : 'left',
  };

  const centerLogoStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  return (
    <div style={containerStyle}>
      <div style={{ ...sideStyle, minWidth: isMobile ? 'auto' : '120px' }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3bb741ff' }}>D+{dday}</div>
        <div style={{ fontSize: '0.98rem', marginTop: 2 }}>{todayString}</div>
      </div>

      <div style={centerLogoStyle}>
        <div style={{ fontSize: isMobile ? '2.8rem' : '4rem', fontWeight: 'bold', color: '#65CFC7' , fontFamily: 'GoryeongStrawberry'}}>
          정글몽글짐
        </div>
        <span
          style={{
            fontFamily: 'GoryeongStrawberry',
            fontSize: isMobile ? '1.2rem' : '1.8rem',
            color: '#ff8f80ff',
            fontWeight: 'bold',
            marginTop: 6,
          }}
        >
          오늘부터 득근↑
        </span>
      </div>

      <div style={{ ...sideStyle, minWidth: isMobile ? 'auto' : '120px', textAlign: isMobile ? 'center' : 'right' }}>
        <button
          onClick={onLogout}
          style={{
            padding: '6px 16px',
            borderRadius: 8,
            background: 'transparent',
            cursor: 'pointer',
            fontWeight: 'bold',
            color: '#3bb741ff',
            boxShadow: 'none',
            fontSize: isMobile ? 16 : 20,
          }}
          type="button"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}

export default HeaderInfo;
