import dayjs from "dayjs";

/**
 * ISO 8601 timestamp -> 'yy-MM-dd'.
 * e.g. "2026-01-21T14:30:00.000Z" → "26-01-21"
 */
export function formatDate(isoString: string): string {
  return dayjs(isoString).format("YY-MM-DD");
}
