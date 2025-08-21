import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderInfo from '../components/HeaderInfo';
import LeftButtonGroup from '../components/LeftButtonGroup';
import RightButtonGroup from '../components/RightButtonGroup';
import MonggleImageArea from '../components/MonggleImageArea';
import DailyStatusButtons from '../components/DailyStatusButtons';
import GainCalendarModal from '../components/GainCalendarModal';
import WeeklyDietMemoModal from '../components/WeeklyDietMemoModal';
import WeightScale from '../components/WeightScale';
import BadgeMiniModal from '../components/BadgeMiniModal';
import StretchingModal from '../components/StretchingModal';  // 스트레칭 모달 추가
import { useAuth } from '../store/auth';
import type { BodyPart } from '../components/MonggleImageArea';

type Diff = 'easy' | 'mid' | 'hard' | null;

export default function MainPage() {
  const navigate = useNavigate();
  const { user, clear } = useAuth();

  const [difficulty, setDifficulty] = useState<Diff>(null);

  // 모달 상태 추가: 스트레칭 모달
  const [stretchingOpen, setStretchingOpen] = useState(false);
  const [showDiaryPopup, setShowDiaryPopup] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showWeightScale, setShowWeightScale] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);

  const [weightDiff, setWeightDiff] = useState<number | null>(null);

  const handleIconClick = (name: string): void => {
    if (name === '일기') {
      setShowDiaryPopup(true);
      setCalendarOpen(false);
      setShowWeightScale(false);
      setBadgeModalOpen(false);
      setStretchingOpen(false);
      return;
    }
    if (name === '득근캘린더') {
      setCalendarOpen(true);
      setShowDiaryPopup(false);
      setShowWeightScale(false);
      setBadgeModalOpen(false);
      setStretchingOpen(false);
      return;
    }
    if (name === '체중계') {
      setShowWeightScale(true);
      setShowDiaryPopup(false);
      setCalendarOpen(false);
      setBadgeModalOpen(false);
      setStretchingOpen(false);
      return;
    }
    if (name === '몽글이뱃지') {
      setBadgeModalOpen(true);
      setShowDiaryPopup(false);
      setCalendarOpen(false);
      setShowWeightScale(false);
      setStretchingOpen(false);
      return;
    }
    if (name === '운동검색') {   // 스트레칭 버튼명 맞게 변경
      setStretchingOpen(true);
      setShowDiaryPopup(false);
      setCalendarOpen(false);
      setShowWeightScale(false);
      setBadgeModalOpen(false);
      return;
    }

    const normalized = name.replace(/\s+/g, '').replace(/[!！?]+/g, '').toLowerCase();

    if (/살살|easy/.test(normalized)) {
      setDifficulty('easy');
      return;
    }
    if (/적당히|mid|중간|보통/.test(normalized)) {
      setDifficulty('mid');
      return;
    }
    if (/빡세게|hard|강하게|강도/.test(normalized)) {
      setDifficulty('hard');
      return;
    }
    if (normalized.includes('나만의운동') || normalized.includes('custom')) {
      navigate('/workouts/custom');
      return;
    }

    alert(`"${name}" 기능은 추후 연결됩니다!`);
  };

  useEffect(() => {
    if (showDiaryPopup || calendarOpen || showWeightScale || badgeModalOpen || stretchingOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showDiaryPopup, calendarOpen, showWeightScale, badgeModalOpen, stretchingOpen]);

  const handlePartClick = (part: BodyPart): void => {
    const groupMap: Record<string, 'back' | 'shoulder' | 'chest' | 'arm' | 'legs'> = {
      등: 'back',
      어깨: 'shoulder',
      가슴: 'chest',
      팔: 'arm',
      하체: 'legs',
    };

    const group = groupMap[String(part)] || undefined;
    const qs = new URLSearchParams();
    if (group) qs.set('group', group);
    if (difficulty) qs.set('difficulty', difficulty);

    navigate(`/workouts${qs.toString() ? `?${qs.toString()}` : ''}`);
  };

  function getTodayString(): string {
    const today = new Date();
    return `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  }
  const todayString = getTodayString();

  return (
    <div
      style={{
        maxWidth: "1500px",
        margin: "0 auto",
        padding: "28px 10px 10px 10px",
        textAlign: "center",
        position: "relative",
        minHeight: "90vh",
        fontFamily: "'BMJUA', sans-serif",
      }}
    >
      <HeaderInfo todayString={todayString} onLogout={clear} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          margin: "0px 0 22px",
          alignItems: "center",
          flexWrap: "nowrap",
        }}
      >
        <LeftButtonGroup onClick={handleIconClick} buttonSize="12vw" minSize={48} maxSize={80} />
        <MonggleImageArea handlePartClick={handlePartClick} />
        <RightButtonGroup onClick={handleIconClick} weightDiff={weightDiff} buttonSize="12vw" minSize={48} maxSize={80} />
      </div>

      <DailyStatusButtons handleIconClick={handleIconClick} />

      {difficulty && (
        <div style={{ marginTop: 0, color: "#0b5d5d", fontWeight: 700, fontSize: "1.5rem" }}>
          {difficulty === "easy" && "오늘은 몽글이랑 천천히 산책할까?"}
          {difficulty === "mid" && "오늘은 몽글이랑 최선을 다해보자!"}
          {difficulty === "hard" && "오늘은 몽글이랑 끝까지 가보자구!"}
        </div>
      )}

      <WeeklyDietMemoModal isOpen={showDiaryPopup} onClose={() => setShowDiaryPopup(false)} />
      <GainCalendarModal isOpen={calendarOpen} onClose={() => setCalendarOpen(false)} />
      <WeightScale open={showWeightScale} onClose={() => setShowWeightScale(false)} onDiffChange={setWeightDiff} />
      <BadgeMiniModal open={badgeModalOpen} onClose={() => setBadgeModalOpen(false)} />
      <StretchingModal open={stretchingOpen} onClose={() => setStretchingOpen(false)} />
    </div>
  );
}
