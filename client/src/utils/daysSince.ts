// client/src/utils/daysSince.ts

/** 1일(ms) */
const DAY_MS = 86_400_000;

/** 로컬 자정으로 내리는 함수 */
function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** "YYYY-MM-DD" → 로컬 자정 Date */
function parseYmdLocal(str: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1; // 0-based
  const da = Number(m[3]);
  return new Date(y, mo, da);  // 로컬 자정
}

/** 문자열/Date → Date (YYYY-MM-DD는 로컬 자정으로 파싱) */
function asLocalDate(input: string | Date): Date | null {
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  // YYYY-MM-DD 형식을 우선 로컬 자정으로 파싱
  const ymd = parseYmdLocal(input);
  if (ymd) return ymd;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * 회원가입일(자정 기준) ~ 기준일(자정 기준)까지 지난 '일 수'를 반환합니다.
 * - 가입 당일: 0 (D+0)
 * - 미래 날짜: 0 으로 클램프
 * @param dateISO 가입일(ISO 문자열 또는 Date)
 * @param now 기준 시각(기본값: 현재 시각)
 */
export function daysSince(dateISO: string | Date, now: Date = new Date()): number {
  const signup = asLocalDate(dateISO);
  if (!signup) return 0;

  const a = startOfLocalDay(signup);
  const b = startOfLocalDay(now);

  const diffMs = b.getTime() - a.getTime();
  const days = Math.floor(diffMs / DAY_MS);
  return Math.max(0, days); // 가입 당일 0, 미래면 0
}

/** Date/문자열을 "YYYY-MM-DD"로 포맷(로컬 기준) */
export function toYmd(dateLike: string | Date): string {
  const d = asLocalDate(dateLike) ?? new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
