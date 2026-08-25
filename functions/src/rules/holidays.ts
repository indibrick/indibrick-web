// Ontario stat holidays for the rolling year window.
// Auto-tasks + escalations must not fire on these dates because the
// broker isn't at their desk — surfacing "call this client NOW" at 8am
// on Family Day produces exactly the alert fatigue Sales Coach flagged
// as adoption killer #1.
//
// The list is refreshed manually each December (nine days a year — not
// worth the API dependency). Format: 'YYYY-MM-DD' in America/Toronto.

const ONTARIO_HOLIDAYS_TORONTO_TZ: string[] = [
  // 2026
  '2026-01-01', // New Year's Day
  '2026-02-16', // Family Day
  '2026-04-03', // Good Friday
  '2026-05-18', // Victoria Day
  '2026-07-01', // Canada Day
  '2026-08-03', // Civic Holiday
  '2026-09-07', // Labour Day
  '2026-10-12', // Thanksgiving
  '2026-11-11', // Remembrance Day (observed by many brokerages)
  '2026-12-25', // Christmas
  '2026-12-26', // Boxing Day

  // 2027
  '2027-01-01',
  '2027-02-15',
  '2027-03-26',
  '2027-05-24',
  '2027-07-01',
  '2027-08-02',
  '2027-09-06',
  '2027-10-11',
  '2027-11-11',
  '2027-12-25', // Saturday — many observe on Dec 27
  '2027-12-27',
];

const HOLIDAYS = new Set(ONTARIO_HOLIDAYS_TORONTO_TZ);

// Format a Date as YYYY-MM-DD in America/Toronto. Intl API dodges the
// DST rules — hand-rolling UTC offset would break the 2 weeks a year
// where server-UTC and Toronto-local disagree on the calendar date.
function torontoDateStr(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

function torontoHourAndDay(d: Date): { hour: number; dayOfWeek: number } {
  // en-GB gives 24h format; weekday: 'short' gives Mon..Sun which we
  // map back to 0..6 (Sun=0).
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Toronto',
    hour: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(d);
  const hourPart = parts.find(p => p.type === 'hour')?.value ?? '9';
  const weekdayPart = parts.find(p => p.type === 'weekday')?.value ?? 'Mon';
  const daysMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    hour: parseInt(hourPart, 10),
    dayOfWeek: daysMap[weekdayPart] ?? 1,
  };
}

// True when it's a normal weekday (Mon–Fri), 9am–9pm Toronto local,
// and not a stat holiday. Rules that create tasks or ping brokers with
// urgent-sounding notifications should gate on this.
export function isBusinessHoursToronto(d: Date): boolean {
  const dateStr = torontoDateStr(d);
  if (HOLIDAYS.has(dateStr)) return false;
  const { hour, dayOfWeek } = torontoHourAndDay(d);
  if (dayOfWeek === 0 || dayOfWeek === 6) return false; // Sun / Sat
  if (hour < 9 || hour >= 21) return false;             // Before 9am or 9pm+
  return true;
}
