// client/src/lib/api.ts

/** =========================
 *  공통 Fetch 래퍼
 *  ========================= */
const RAW_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";
// BASE 뒤 슬래시 제거
const BASE = RAW_BASE.replace(/\/$/, "");

// 토큰 가져오기: 프로젝트별 저장 키가 다를 수 있어 보강
function getToken(): string | null {
  // 우선순위: token → accessToken → auth(JSON).token
  const direct =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken");
  if (direct) return direct;

  try {
    const authRaw = localStorage.getItem("auth");
    if (authRaw) {
      const parsed = JSON.parse(authRaw);
      if (parsed?.token) return String(parsed.token);
    }
  } catch {}
  return null;
}

// path 안전 결합
function joinUrl(path: string) {
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;

  if (!headers.has("Content-Type") && !isFormData && options.method && options.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // (선택) 타임아웃 12초
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), 12000);

  let res: Response;
  try {
    res = await fetch(joinUrl(path), { ...options, headers, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }

  const ctype = res.headers.get("content-type") || "";
  const isJson = ctype.includes("application/json");

  if (!res.ok) {
    try {
      const payload = isJson ? await res.json() : await res.text();
      const msg =
        (isJson ? (payload?.message || payload?.error || JSON.stringify(payload)) : payload) ||
        `HTTP ${res.status}`;
      throw new Error(msg);
    } catch (e: any) {
      throw new Error(e?.message || `HTTP ${res.status}`);
    }
  }

  return (isJson ? await res.json() : await res.text()) as unknown as T;
}

/** ---------- 공용 유틸 ---------- */
const toQuery = (obj: Record<string, any>) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    p.set(k, String(v));
  });
  const qs = p.toString();
  return qs ? `?${qs}` : "";
};

/** =========================
 *  Auth & Me
 *  ========================= */
export const api = {
  register: (body: { name: string; email: string; password: string; confirm?: string }) => {
    const payload = {
      email: body.email,
      password: body.password,
      passwordConfirm: body.confirm ?? body.password,
      name: body.name,
      nickname: body.name,
      username: body.name,
      displayName: body.name,
    };
    return req<{ token?: string; user?: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  login: (body: { email: string; password: string }) =>
    req<{ token: string; user?: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  forgot: (body: { email: string }) =>
    req<{ ok: boolean }>("/auth/forgot", { method: "POST", body: JSON.stringify(body) }),

  reset: (body: { token: string; password: string }) =>
    req<{ ok: boolean }>("/auth/reset", { method: "POST", body: JSON.stringify(body) }),

  // (기존 호환) 서버에 /auth/me 가 아니라 /me 로만 있는 경우도 있으니 meApi.profile() 사용 권장
  me: () => req<any>("/auth/me", { method: "GET" }),

  // GainCalendar 등에서 사용
  toYMD: (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  },

  getDaily: (dateKey: string) => req(`/daily/${dateKey}`, { method: "GET" }),
  setDidWorkout: (dateKey: string, didWorkout: boolean) =>
    req(`/daily/${dateKey}`, { method: "PUT", body: JSON.stringify({ didWorkout }) }),
};

/** ---------- Me 전용 API (프로필/목표체중) ---------- */
export const meApi = {
  // 서버가 /api/me 를 제공하는 경우 사용
  profile: () => req<any>("/me", { method: "GET" }),

  // 목표 체중
  getGoalWeight: () =>
    req<{ goalWeight: number | null }>("/me/goal-weight", { method: "GET" }),
  setGoalWeight: (goalWeight: number | null) =>
    req<{ ok: boolean; goalWeight: number | null }>("/me/goal-weight", {
      method: "PUT",
      body: JSON.stringify({ goalWeight }),
    }),
};

/** ---------- Raw Daily API (기존 유지) ---------- */
export const dailyApi = {
  get: (dateKey: string) => req(`/daily/${dateKey}`, { method: "GET" }),
  save: (dateKey: string, body: any) =>
    req(`/daily/${dateKey}`, { method: "PUT", body: JSON.stringify(body) }),
};

/** =========================
 *  Weights
 *  ========================= */
export const weightApi = {
  list: (params?: { from?: string; to?: string }) => {
    const qs = toQuery(params || {});
    return req<{ items: any[] }>(`/weights${qs}`, { method: "GET" });
  },
  upsert: (
    dateKey: string,
    payload: { weight?: number; bodyFat?: number; muscle?: number; memo?: string }
  ) =>
    req<{ item: any }>(`/weights/${encodeURIComponent(dateKey)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};

/** =========================
 *  Diet Memo
 *  ========================= */
export const dietMemoApi = {
  get: (weekStart: string) => req(`/diet-memo/${weekStart}`, { method: "GET" }),
  save: (weekStart: string, body: any) =>
    req(`/diet-memo/${weekStart}`, { method: "PUT", body: JSON.stringify(body) }),
};

/** =========================
 *  Diary
 *  ========================= */
export const diaryApi = {
  get: (dateKey: string) => req(`/diary/${dateKey}`, { method: "GET" }),
  save: (dateKey: string, body: { title?: string; content: string }) =>
    req(`/diary/${dateKey}`, { method: "PUT", body: JSON.stringify(body) }),
  list: (from?: string, to?: string) => {
    const qs = toQuery({ from, to });
    return req(`/diary${qs}`, { method: "GET" });
  },
};

/** =========================
 *  Workouts (카탈로그)
 *  ========================= */
export type Difficulty = "easy" | "mid" | "hard";
export type Group = "back" | "shoulder" | "chest" | "arm" | "legs" | "cardio";

export type Workout = {
  id: string;
  title: string;
  group: Group;
  difficulty: Difficulty;
  cues?: string[];
  image?: string;
};

export const workoutApi = {
  list: (params?: { group?: Group; difficulty?: Difficulty; q?: string }) => {
    const qs = toQuery(params || {});
    return req<Workout[]>(`/workouts${qs}`, { method: "GET" });
  },
};

// 과거 호환
export const getWorkouts = (params?: { group?: Group; difficulty?: Difficulty; q?: string }) =>
  workoutApi.list(params);

/** =========================
 *  Favorites
 *  ========================= */
export const favApi = {
  list: () => req<string[]>("/user/favorites", { method: "GET" }),
  setAll: (ids: string[]) =>
    req<string[]>("/user/favorites", { method: "PUT", body: JSON.stringify({ ids }) }),
  add: (id: string) =>
    req<string[]>(`/user/favorites/${encodeURIComponent(id)}`, { method: "POST" }),
  remove: (id: string) =>
    req<string[]>(`/user/favorites/${encodeURIComponent(id)}`, { method: "DELETE" }),
  toggle: (id: string) =>
    req<string[]>(`/user/favorites/${encodeURIComponent(id)}/toggle`, { method: "PATCH" }),
};

/** =========================
 *  Workout Logs (운동 기록)
 *  ========================= */
export type LogSet = { weight: number; reps: number; done: boolean };
export type LogEntry = {
  exerciseId: string;
  title: string;
  group: Group;
  sets: LogSet[];
  note?: string;
};
export type WorkoutLogDoc = {
  userId?: string;
  date: string; // YYYY-MM-DD
  entries: LogEntry[];
  durationSec: number;
  durationByGroup?: Record<string, number>;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CalendarDaySummary = {
  date: string;
  count: number;
  sec: number;
  labels?: string[];
  more?: number;
  groups?: Group[];
};

export const workoutLogsApi = {
  get: (dateKey: string, group?: Group) => {
    const qs = toQuery({ date: dateKey, group });
    return req<WorkoutLogDoc | null>(`/workout-logs${qs}`, { method: "GET" });
  },

  save: (dateKey: string, body: Partial<WorkoutLogDoc>, group?: Group) => {
    const qs = toQuery({ group });
    return req<WorkoutLogDoc>(`/workout-logs/${encodeURIComponent(dateKey)}${qs}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  monthly: (monthYYYYMM: string, opts?: { detail?: boolean; groups?: boolean }) => {
    const params: Record<string, any> = { month: monthYYYYMM };
    if (opts?.detail) params.detail = 1;
    if (opts?.groups) params.groups = 1;
    const qs = toQuery(params);
    return req<CalendarDaySummary[]>(`/workout-logs/calendar${qs}`, { method: "GET" });
  },
};

// 별칭(호환)
export const workoutLogApi = workoutLogsApi;
export const getWorkoutLog = (dateKey: string, group?: Group) =>
  workoutLogsApi.get(dateKey, group);
export const putWorkoutLog = (dateKey: string, body: Partial<WorkoutLogDoc>, group?: Group) =>
  workoutLogsApi.save(dateKey, body, group);
/** @deprecated */
export const getCalendarMonth = (monthYYYYMM: string, detail = false, groups = false) =>
  workoutLogsApi.monthly(monthYYYYMM, { detail, groups });

/** =========================
 *  내부 Video 컬렉션(Mongo)
 *  ========================= */
export type VideoDoc = {
  id: string;
  youtubeId: string;
  title: string;
  channelTitle?: string;
  thumb?: string;
  tags?: string[];
  groups?: string[];
  durationSec?: number;
  language?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export const videosApi = {
  list: (params?: { q?: string; group?: string; limit?: number; skip?: number }) => {
    const qs = toQuery(params || {});
    return req<{ items: VideoDoc[] }>(`/videos${qs}`, { method: "GET" });
  },
  add: (item: Partial<VideoDoc> & { youtubeId: string; title: string }) =>
    req<{ item: VideoDoc }>(`/videos`, { method: "POST", body: JSON.stringify(item) }),
  bulk: (items: Array<Partial<VideoDoc> & { youtubeId: string; title: string }>) =>
    req<{ ok: boolean; result?: unknown }>(`/videos/bulk`, {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
};
