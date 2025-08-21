import React, { useState, useEffect } from 'react';

export type BodyPart = '어깨' | '등' | '가슴' | '팔' | '하체';

type MonggleImageAreaProps = {
  handlePartClick: (part: BodyPart) => void;
};

function MonggleImageArea({ handlePartClick }: MonggleImageAreaProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 600);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        minHeight: isMobile ? "360px" : "480px",
        background: "transparent",
      }}
    >
      <img
        src="/monggle_cha.png"
        alt="몽글이 캐릭터"
        style={{
          width: isMobile ? "400px" : "500px",
          height: "auto",
          display: "block",
          margin: isMobile ? "180px 0 0 0" : "250px 0 0 0",
          background: "transparent",
          borderRadius: "35px",
          position: "absolute",
          zIndex: 0,
        }}
      />
      {/* 어깨 */}
      <button
        onClick={() => handlePartClick('어깨')}
        style={{
          position: "absolute", top: "75%", left: "-5%",
          display: "flex", alignItems: "center",
          background: "transparent", border: "none",
          padding: 0, margin: 0, cursor: "pointer", outline: "none", zIndex: 20
        }}
        aria-label="어깨"
        tabIndex={0}
      >
        <span style={{
          marginBottom: "20px", color: "#e74c3c", fontWeight: "bold",
          fontSize: "1.5rem", marginLeft: "10px", zIndex: 20
        }}>어깨</span>
        <div style={{
          marginLeft: "3px", marginBottom: "10px", width: "15px", height: "5px",
          transform: "rotate(25deg)", background: "#e74c3c", zIndex: 20
        }}></div>
        <div style={{
          width: "70px", height: "35px", borderRadius: "50%",
          background: "transparent", border: "4px solid #e74c3c",
          marginLeft: "-2px", zIndex: 20
        }}/>
      </button>
      {/* 등 */}
      <button
        onClick={() => handlePartClick('등')}
        style={{
          position: "absolute", top: "22%", left: "48%",
          display: "flex", alignItems: "center", flexDirection: "column",
          background: "transparent", border: "none", padding: 0, margin: 0,
          cursor: "pointer", outline: "none", zIndex: 20
        }}
        aria-label="등"
        tabIndex={0}
      >
        <span style={{
          marginBottom: "-6px", marginRight: "7px", color: "#e74c3c",
          fontWeight: "bold", fontSize: "1.5rem", zIndex: 20
        }}>등</span>
        <div style={{
          marginLeft: "5px", marginTop: "10px", width: "15px", height: "4px",
          transform: "rotate(70deg)", background: "#e74c3c", zIndex: 20
        }}></div>
      </button>
      {/* 가슴 */}
      <button
        onClick={() => handlePartClick('가슴')}
        style={{
          position: "absolute", top: "85%", left: "42%",
          display: "flex", alignItems: "center", background: "transparent",
          border: "none", padding: 0, margin: 0, cursor: "pointer", outline: "none", zIndex: 20
        }}
        aria-label="가슴"
        tabIndex={0}
      >
        <div style={{
          width: "60px", height: "30px", borderRadius: "50%",
          background: "transparent", border: "3px solid #e74c3c",
          marginRight: "-2px", zIndex: 20
        }}/>
        <div style={{
          marginRight: "2px", marginBottom: "20px", width: "25px", height: "3px",
          transform: "rotate(160deg)", background: "#e74c3c", zIndex: 20
        }}></div>
        <span style={{
          marginBottom: "30px", color: "#e74c3c", fontWeight: "bold",
          fontSize: "1.5rem", marginLeft: "4px", zIndex: 20
        }}>가슴</span>
      </button>
      {/* 팔 */}
      <button
        onClick={() => handlePartClick('팔')}
        style={{
          position: "absolute", top: "96%", left: "75%",
          display: "flex", alignItems: "center", background: "transparent", border: "none",
          padding: 0, margin: 0, cursor: "pointer", outline: "none", zIndex: 20
        }}
        aria-label="팔"
        tabIndex={0}
      >
        <div style={{
          width: "70px", height: "35px", borderRadius: "50%",
          background: "transparent", border: "4px solid #e74c3c",
          marginRight: "-2px", zIndex: 20
        }}/>
        <div style={{
          marginRight: "2px", marginTop: "10px", width: "18px", height: "4px",
          transform: "rotate(200deg)", background: "#e74c3c", zIndex: 20
        }}></div>
        <span style={{
          marginTop: "20px", color: "#e74c3c", fontWeight: "bold",
          fontSize: "1.5rem", marginLeft: "2px", zIndex: 20
        }}>팔</span>
      </button>
      {/* 하체 */}
      <button
        onClick={() => handlePartClick('하체')}
        style={{
          position: "absolute", top: "112%", left: "27%",
          display: "flex", alignItems: "center", flexDirection: "column",
          background: "transparent", border: "none", padding: 0, margin: 0,
          cursor: "pointer", outline: "none", zIndex: 20
        }}
        aria-label="하체"
        tabIndex={0}
      >
        <div style={{
          width: "70px", height: "35px", borderRadius: "50%",
          background: "transparent", border: "4px solid #e74c3c",
          marginBottom: "5px", zIndex: 20
        }}/>
        <div style={{
          marginLeft: "8px", width: "15px", height: "4px",
          transform: "rotate(70deg)", background: "#e74c3c", zIndex: 20
        }}></div>
        <span style={{
          marginTop: "8px", color: "#e74c3c", fontWeight: "bold",
          fontSize: "1.5rem", marginLeft: "15px", zIndex: 20
        }}>하체</span>
      </button>
    </div>
  );
}

export default MonggleImageArea;
