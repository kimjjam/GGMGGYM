// client/src/utils/dayCounter.ts
export function dPlusFrom(iso?: string) {
  if (!iso) return null;
  const created = new Date(iso).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  const diff = Math.floor((today - created) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : 0;
}
