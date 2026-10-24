// Giờ Việt Nam (UTC+7, không có giờ mùa hè). Giờ chốt đơn và khung giờ giao tính theo giờ này.
const VN_OFFSET_MS = 7 * 3600 * 1000;

export interface VnClock {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
}

export function vnClock(at: Date): VnClock {
  const iso = new Date(at.getTime() + VN_OFFSET_MS).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
