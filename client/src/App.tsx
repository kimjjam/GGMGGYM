// client/src/App.tsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./store/auth";
import Protected from "./components/Protected";

// 페이지
import MainPage from "./pages/MainPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPage from "./pages/ForgotPage";
import ResetPage from "./pages/ResetPage";
import WorkoutsPage from "./pages/WorkoutsPage";
import MyWorkoutsPage from "./pages/MyWorkoutsPage"; // ✅ 나만의 운동 페이지

export default function App() {
  const hydrate = useAuth((s) => s.hydrateFromStorage);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <Routes>
        {/* 메인 */}
        <Route
          path="/"
          element={
            <Protected>
              <MainPage />
            </Protected>
          }
        />

        {/* 운동 페이지 (난이도/부위 쿼리로 진입) */}
        <Route
          path="/workouts"
          element={
            <Protected>
              <WorkoutsPage />
            </Protected>
          }
        />

        {/* 나만의 운동: 추천 없이 전체에서 골라 루틴 구성 */}
        <Route
          path="/workouts/custom"
          element={
            <Protected>
              <MyWorkoutsPage />
            </Protected>
          }
        />

        {/* 인증 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot" element={<ForgotPage />} />
        <Route path="/reset" element={<ResetPage />} />

        {/* 404 */}
        <Route path="*" element={<div style={{ padding: 20 }}>페이지를 찾을 수 없습니다.</div>} />
      </Routes>
    </BrowserRouter>
  );
}
