// client/src/components/collection/BadgeMiniModal.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './BadgeMiniModal.module.css';
import { useAuth, getExerciseStartDate } from '../store/auth';
import { daysSince, toYmd } from '../utils/daysSince';

type Badge = { need: number; img: string; name: string };
type Mini  = { id: string; name: string; img: string; photo?: string };

const BADGES: Badge[] = [
  { need: 7,   img: '/images/mongle7day-remove.png',   name: '7일 출석' },
  { need: 30,  img: '/images/mongle30day-remove.png',  name: '30일 출석' },
  { need: 100, img: '/images/mongle100day-remove.png', name: '100일 출석' },
  { need: 200, img: '/images/mongle200day-remove.png', name: '200일 출석' },
  { need: 300, img: '/images/mongle300day-remove.png', name: '300일 출석' },
  { need: 365, img: '/images/mongle1year-remove.png',  name: '1년 출석' },
  { need: 730, img: '/images/mongle2year-remove.png',  name: '2년 출석' },
];

const MINIS: Mini[] = [
  { id:'Babel',  name:'바벨',      img:'/images/바벨.png', photo:'/images/monglebarble.png' },
  { id:'Chest_fly', name:'체스트플라이', img:'/images/체스트플라이.png', photo:'/images/monglechest.png' },
  { id:'running_machine', name:'런닝머신', img:'/images/런닝머신.png', photo:'/images/monglerunning.png' },
  { id:'Hairband', name:'헤어밴드', img:'/images/헤어밴드.png', photo:'/images/monglehair.png' },
  { id:'Shoulder_Press', name:'숄더프레스', img:'/images/숄더프레스.png', photo:'/images/mongleshoulder.png' },
  { id:'Bench_press', name:'벤치프레스', img:'/images/벤치프레스.png', photo:'/images/monglebench.png' },
  { id:'cable_machine', name:'케이블머신', img:'/images/케이블머신.png', photo:'/images/monglecable.png' },
  { id:'sportswear', name:'운동복상의', img:'/images/운동복상의.png', photo:'/images/mongleup.png' },
  { id:'sportswearunder', name:'운동복하의', img:'/images/운동복하의.png', photo:'/images/mongledown.png' },
  { id:'leg_extension', name:'레그익스텐션', img:'/images/레그익스텐션.png', photo:'/images/monglelegex.png' },
  { id:'incline_bench', name:'인클라인 벤치', img:'/images/인클라인 벤치.png', photo:'/images/mongleincle.png' },
  { id:'Kettle_Bell', name:'케틀벨', img:'/images/케틀벨.png', photo:'/images/monglebell.png' },
  { id:'foam_roller', name:'폼롤러', img:'/images/폼롤러.png', photo:'/images/monglepoam.png' },
  { id:'bike', name:'자전거', img:'/images/자전거.png', photo:'/images/monglebike.png' },
  { id:'Tumbler', name:'텀블러', img:'/images/텀블러.png', photo:'/images/monglewater.png' },
  { id:'Sneakers', name:'운동화', img:'/images/운동화.png', photo:'/images/mongleshoe.png' },
  { id:'Twisted', name:'트위스트머신', img:'/images/트위스트머신.png', photo:'/images/mongletwist.png' },
  { id:'steps', name:'천국의 계단', img:'/images/천국의계단.png', photo:'/images/monglestair.png' },
  { id:'Sandbags', name:'샌드백', img:'/images/샌드백.png', photo:'/images/monglesend.png' },
  { id:'power', name:'스미스머신', img:'/images/스미스머신.png', photo:'/images/monglesmith.png' },
  { id:'inbody', name:'인바디기계', img:'/images/인바디기계.png', photo:'/images/mongleinbody.png' },
  { id:'wide', name:'와이드풀다운', img:'/images/와이드풀다운.png', photo:'/images/monglewide.png' },
  { id:'legpress', name:'레그프레스', img:'/images/레그프레스.png', photo:'/images/monglelegpress.png' },
  { id:'plate1', name:'원판2.5kg', img:'/images/원판2.5kg.png', photo:'/images/mongle2.5.png' },
  { id:'plate2', name:'원판5kg', img:'/images/원판5kg.png', photo:'/images/mongle5.png' },
  { id:'plate3', name:'원판10kg', img:'/images/원판10kg.png', photo:'/images/mongle10.png' },
  { id:'plate4', name:'원판15kg', img:'/images/원판15kg.png', photo:'/images/mongle15.png' },
  { id:'plate5', name:'원판20kg', img:'/images/원판20kg.png', photo:'/images/mongle20.png' },
];

const KEY_MINIS = 'jm_minis';

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 1600);
    return () => clearTimeout(t);
  }, [msg]);
  return { msg, show: (m: string) => setMsg(m) };
}

type Props = { open: boolean; onClose: () => void };

export default function BadgeMiniModal({ open, onClose }: Props) {
  const dlgRef = useRef<HTMLDivElement>(null);
  const { msg, show } = useToast();
  const { user } = useAuth();

  const startISO = useMemo(() => user?.exerciseStartDate || user?.createdAt || getExerciseStartDate() || null, [user]);

  const startDate: Date = useMemo(() => (startISO ? new Date(startISO) : new Date()), [startISO]);

  const [owned, setOwned] = useState<Set<string>>(() => {
    try {
      const arr = JSON.parse(localStorage.getItem(KEY_MINIS) || '[]') as string[];
      return new Set(arr);
    } catch {
      return new Set();
    }
  });

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const ownedIndexes = useMemo(() => MINIS.map((_, i) => i).filter(i => owned.has(MINIS[i].id)), [owned]);

  // 미니어처 이미지 소스 가져오기 ( photo 우선, 없으면 img )
  const getPreviewSrc = (m: Mini) => m.photo ?? m.img;

  // 미니어처 모달 열기
  const openViewer = (idx: number) => setViewerIndex(idx);
  const closeViewer = () => setViewerIndex(null);

  // 미니어처 뷰어 순서 조절 (앞/뒤)
  const stepViewer = (dir: 1 | -1) => {
    if (viewerIndex === null || ownedIndexes.length === 0) return;
    const p = ownedIndexes.indexOf(viewerIndex);
    if (p === -1) return;
    const np = (p + dir + ownedIndexes.length) % ownedIndexes.length; // 순환
    setViewerIndex(ownedIndexes[np]);
  };

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    dlgRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
      if (viewerIndex !== null) {
          setViewerIndex(null);
        } else {
          onClose();
        }
      }
      if (e.key === 'Tab') {
        const focusables = dlgRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

  document.addEventListener('keydown', onKey);
  return () => {
    document.removeEventListener('keydown', onKey);
    prev?.focus();
  };
}, [open, onClose, viewerIndex]);

  const dplus = useMemo(() => (startISO ? daysSince(startISO) : 0), [startISO]);

  const allOwned = owned.size === MINIS.length;

  // 미니어처 획득 처리
  const openCrate = () => {
    if (allOwned) {
      show('이미 전부 모았어요!');
      return;
    }
    const pool = MINIS.filter(m => !owned.has(m.id));
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const next = new Set(owned);
    next.add(pick.id);
    setOwned(next);
    localStorage.setItem(KEY_MINIS, JSON.stringify([...next]));
    show(`획득! ${pick.name}`);
  };

  // 미니어처 초기화 처리
  const resetMinis = () => {
    const ok = window.confirm('미니어처 획득 내역을 초기화할까요?');
    if (!ok) return;
    const next = new Set<string>();
    setOwned(next);
    localStorage.setItem(KEY_MINIS, JSON.stringify([]));
    show('초기화했습니다.');
  };

  // 뱃지 렌더함수
  const renderBadges = () => (
    <div className={styles.badgeGrid} role="list" aria-label="달성 뱃지 목록">
      {BADGES.map((b, i) => {
        const unlocked = dplus >= b.need;
        const remain = Math.max(0, b.need - dplus);
        const pct = Math.min(100, Math.floor((dplus / b.need) * 100));
        return (
          <div
            key={i}
            className={`${styles.badge} ${!unlocked ? styles.locked : ''}`}
            role="listitem"
            aria-label={`목표 ${b.need}일 ${unlocked ? '획득 완료' : `남은 ${remain}일`}`}
          >
            <div className={styles.thumb}>
              <img
                src={encodeURI(b.img)}
                alt="달성 뱃지"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.opacity = '0.15';
                  (e.currentTarget as HTMLImageElement).alt = '이미지 경로 확인';
                }}
              />
            </div>
              <div className={styles.hint}>
                {unlocked ? `획득 완료: ${b.name} 🎉` : `다음까지 ${remain}일`}
              </div>
            <div
              className={styles.progress}
              aria-label={`진행률 ${pct}%`}
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
            >
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );

  // 미니어처 렌더함수
  const renderMinis = () => (
    <>
      <div className={styles.miniToolbar}>
        <button type="button" onClick={openCrate} disabled={allOwned} aria-disabled={allOwned} aria-label="선물상자 열기">
          🎁 선물상자 열기
        </button>
        <div className={styles.pill} aria-live="polite">
          보유:&nbsp;<span>{owned.size}</span>&nbsp;/&nbsp;<span>{MINIS.length}</span>
        </div>
        <button type="button" onClick={resetMinis} title="획득 초기화">초기화</button>
      </div>

      <div className={styles.miniGrid} role="list" aria-label="미니어처 보유 현황">
        {MINIS.map((m, idx) => {
          const has = owned.has(m.id);
          return (
            <div
              key={m.id}
              className={`${styles.slot} ${!has ? styles.locked : ''}`}
              role="listitem"
              title={has ? m.name : ''}
              aria-label={has ? `${m.name} 보유` : `${m.name} 잠김`}
              onClick={() => has && openViewer(idx)}
              onKeyDown={(e) => {
                if (!has) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openViewer(idx);
                }
              }}
              tabIndex={has ? 0 : -1}
            >
              {has && (
                <img
                  src={encodeURI(m.img)}
                  alt={m.name}
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.15'; }}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-hidden={false}
    >
      {/* 기존 모달 */}
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="jm-modal-title"
        ref={dlgRef}
        tabIndex={-1}
      >
        <header className={styles.hero}>
          <h1 id="jm-modal-title" className={styles.h1}>정글몽글짐 뱃지함</h1>
          <div className={styles.meta}>
            <div className={styles.pill}>오늘:&nbsp;<span>{toYmd(new Date())}</span></div>
            <div className={styles.pill}>D+&nbsp;<span>{dplus}</span></div>
            <div className={styles.pill}>
              <label>운동 시작일</label>
              <span>{toYmd(startDate)}</span>
            </div>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
          </div>
        </header>

        <section className={styles.box} aria-label="달성 뱃지 구역">
          <h2 className={styles.h2}>달성 뱃지</h2>
          {renderBadges()}
        </section>

        <section className={styles.minis} aria-label="미니어처 구역">
          <h2 className={styles.h2}>미니어처</h2>
          {renderMinis()}
        </section>

        {/* Toast */}
        <div className={`${styles.toast} ${msg ? styles.show : ''}`} role="status" aria-live="polite">
          {msg}
        </div>
      </div>

      {/* 뷰어 모달 (modal 바깥) */}
      {viewerIndex !== null && (
        <div
          className={styles.viewerBackdrop}
          role="dialog"
          aria-modal="true"
          onClick={closeViewer}
          tabIndex={-1}
          aria-label="미니어처 사진 보기 모달"
          onKeyDown={(e) => {
            if (e.key === "Escape") closeViewer();
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1100,
          }}
        >
          <img
            className={styles.viewerImg}
            src={encodeURI(MINIS[viewerIndex].photo ?? MINIS[viewerIndex].img)}
            alt={`${MINIS[viewerIndex].name} 사진`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 20 }}
            onError={(e) => {
              console.error('PHOTO LOAD FAILED:', MINIS[viewerIndex].name, MINIS[viewerIndex].photo);
              (e.currentTarget as HTMLImageElement).alt = '사진을 불러오지 못했어요';
            }}
          />
          <button
            onClick={closeViewer}
            aria-label="닫기"
            type="button"
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              fontSize: 24,
              background: "transparent",
              border: "none",
              color: "white",
              cursor: "pointer",
              zIndex: 1200,
            }}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
