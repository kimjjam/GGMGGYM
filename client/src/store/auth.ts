// client/src/store/auth.ts
import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import { favApi } from "../lib/api"; // ✅ 즐겨찾기 프리패치용 (실패 무시)

// MongoDB ObjectId → ISO 날짜 추정 (앞 8자: seconds since epoch)
const oidToISO = (id?: string) => {
  if (!id || id.length < 8) return null;
  const ts = parseInt(id.slice(0, 8), 16);
  return Number.isNaN(ts) ? null : new Date(ts * 1000).toISOString();
};

export type User = {
  _id?: string;
  id?: string;
  email: string;
  name?: string;
  nickname?: string;
  createdAt?: string;            // 가입일
  exerciseStartDate?: string;    // 운동 시작일(=가입일과 동일 정책)
  favoriteExercises?: string[];  // ✅ 유저별 즐겨찾기(옵션)
  [k: string]: any;
};

type JWTPayload = {
  sub?: string;
  email?: string;
  name?: string;
  nickname?: string;
  createdAt?: string;
  exerciseStartDate?: string;
  favoriteExercises?: string[];
  iat?: number;
  exp?: number;
  [k: string]: any;
};

type AuthState = {
  user: User | null;
  token: string | null;
  setAuth: (token: string, user?: User | null) => void;
  clear: () => void;
  hydrateFromStorage: () => void;
};

const LS_TOKEN = "token";
const LS_USER = "user";
const LS_SIGNUP = "signupDate";               // 호환성 유지
const LS_EX_START = "exerciseStartDate";      // 명시적 키
const LS_FAV = "favoriteExercises";           // ✅ 즐겨찾기 캐시(선택)

// 운동 시작일(=가입일) 후보를 우선순위로 산출
const pickStartDate = (u?: User | null): string | null => {
  if (!u) return null;
  return u.exerciseStartDate || u.createdAt || oidToISO(u._id || u.id) || null;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,

  setAuth: (token, user) => {
    localStorage.setItem(LS_TOKEN, token);

    // 1) 기본 사용자 정보 구성 (파라미터 우선, 없으면 JWT에서 복원)
    let u: User | null = user || null;
    try {
      const payload = jwtDecode<JWTPayload>(token);
      if (!u) {
        u = {
          id: payload.sub,
          email: payload.email || "",
          name: payload.name ?? payload.nickname,
          nickname: payload.nickname ?? payload.name,
          createdAt: payload.createdAt,
          exerciseStartDate: payload.exerciseStartDate || payload.createdAt,
          favoriteExercises: payload.favoriteExercises, // 있을 수도, 없을 수도
        };
      } else {
        // 파라미터로 받은 user에 빠진 필드 보강
        u.createdAt = u.createdAt ?? payload.createdAt;
        u.exerciseStartDate =
          u.exerciseStartDate ?? payload.exerciseStartDate ?? u.createdAt;
        if (!u.nickname && payload.nickname) u.nickname = payload.nickname;
        if (!u.name && payload.name) u.name = payload.name;
        if (!u.favoriteExercises && payload.favoriteExercises) {
          u.favoriteExercises = payload.favoriteExercises;
        }
      }
    } catch {
      /* ignore decode error */
    }

    if (u) {
      // 2) 운동 시작일(=가입일) 결정 & 로컬스토리지 저장
      const start = pickStartDate(u);
      if (start) {
        localStorage.setItem(LS_SIGNUP, start);   // 기존 키 유지
        localStorage.setItem(LS_EX_START, start); // 새 키 추가
        u.exerciseStartDate = u.exerciseStartDate || start;
        u.createdAt = u.createdAt || start;
      }

      // 3) 즐겨찾기 캐시(선택) — 토큰 유효 시 백엔드에서 프리패치 (실패시 무시)
      favApi
        .list()
        .then((ids) => {
          localStorage.setItem(LS_FAV, JSON.stringify(ids));
          // 메모리 User에도 반영(있다면)
          if (u) {
            u.favoriteExercises = ids;
            localStorage.setItem(LS_USER, JSON.stringify(u));
          }
        })
        .catch(() => {
          // 백엔드 연결 안 되어도 앱 동작에는 영향 없음
        });

      localStorage.setItem(LS_USER, JSON.stringify(u));
    }

    set({ token, user: u || null });
  },

  clear: () => {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_SIGNUP);
    localStorage.removeItem(LS_EX_START);
    localStorage.removeItem(LS_FAV); // ✅ 즐겨찾기 캐시 제거
    set({ token: null, user: null });
  },

  hydrateFromStorage: () => {
    const token = localStorage.getItem(LS_TOKEN);
    const userRaw = localStorage.getItem(LS_USER);
    const u = userRaw ? (JSON.parse(userRaw) as User) : null;

    // 운동 시작일(=가입일) 키들이 비어 있으면 채운다
    const existingStart =
      localStorage.getItem(LS_EX_START) ||
      localStorage.getItem(LS_SIGNUP) ||
      null;

    if (!existingStart && u) {
      const start = pickStartDate(u);
      if (start) {
        localStorage.setItem(LS_SIGNUP, start);
        localStorage.setItem(LS_EX_START, start);
        if (!u.exerciseStartDate) u.exerciseStartDate = start;
        if (!u.createdAt) u.createdAt = start;
        localStorage.setItem(LS_USER, JSON.stringify(u));
      }
    } else if (existingStart && u) {
      // 메모리 상 User 객체에도 동기화
      if (!u.exerciseStartDate) u.exerciseStartDate = existingStart;
      if (!u.createdAt) u.createdAt = existingStart;
      localStorage.setItem(LS_USER, JSON.stringify(u));
    }

    // 즐겨찾기 캐시가 있고, user.favoriteExercises 비어있다면 보강
    const favRaw = localStorage.getItem(LS_FAV);
    if (u && favRaw && !u.favoriteExercises) {
      try {
        u.favoriteExercises = JSON.parse(favRaw);
        localStorage.setItem(LS_USER, JSON.stringify(u));
      } catch {
        /* ignore */
      }
    }

    set({ token, user: u });
  },
}));

// 운동 시작일(=가입일) 읽기
export const getExerciseStartDate = (): string | null => {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(LS_EX_START) ||
    localStorage.getItem(LS_SIGNUP) ||
    useAuth.getState().user?.exerciseStartDate ||
    useAuth.getState().user?.createdAt ||
    null
  );
};

// 기존 호환 함수
export const getSignupDate = (): string | null => getExerciseStartDate();

// (선택) 즐겨찾기 캐시 읽기 헬퍼
export const getFavoriteExerciseIds = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_FAV);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};
