/**
 * Helper: safely parse a date value (string or Date) into a timezone-safe Date
 * This prevents date shifting when the user is in a timezone ahead of UTC
 */
export function toSafeDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0);
  }
  
  const str = String(value);
  const dateMatch = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), 12, 0, 0));
  }
  
  return new Date(str);
}
