// client/src/utils/workoutGroups.ts
import type { Workout, CalendarDaySummary } from "../lib/api";

export const MAIN_GROUPS: Array<Workout["group"]> = ["chest", "back", "legs"];

export const GROUP_LABEL: Record<Workout["group"], string> = {
  back: "등",
  shoulder: "어깨",
  chest: "가슴",
  arm: "팔",
  legs: "하체",
  cardio: "유산소",
};

export function guessGroupFromTitle(t: string): Workout["group"] | undefined {
  const s = t.toLowerCase();
  if (/(벤치|체스트|가슴|펙덱|푸쉬업|pushup|bench|chest|pec)/i.test(t)) return "chest";
  if (/(랫|풀다운|로우|시티드 ?로우|풀업|턱걸이|데드리프트|등|back|row|pulldown|pullup|deadlift)/i.test(t))
    return "back";
  if (/(스쿼트|레그|런지|힙(쓰러스트)?|카프|하체|leg|squat|lunge|rdl|hip)/i.test(t)) return "legs";
  return undefined;
}

export function buildTitleToGroupMap(all: Workout[] = []) {
  const map: Record<string, Workout["group"]> = {};
  all.forEach((w) => {
    if (!map[w.title]) map[w.title] = w.group;
  });
  return map;
}

/** 월 요약 한 칸에서 '가슴/등/하체' 그룹만 뽑아내기 */
export function extractMainGroups(
  sum: CalendarDaySummary | undefined,
  titleToGroup: Record<string, Workout["group"]> = {}
): Workout["group"][] {
  if (!sum) return [];
  const fromServer = Array.isArray((sum as any).groups) ? ((sum as any).groups as Workout["group"][]) : [];

  const fromTitles = (sum.labels || [])
    .map((t) => titleToGroup[t] || guessGroupFromTitle(t))
    .filter(Boolean) as Workout["group"][];

  const uniq = Array.from(new Set<Workout["group"]>([...fromServer, ...fromTitles]));
  return uniq.filter((g) => MAIN_GROUPS.includes(g));
}
