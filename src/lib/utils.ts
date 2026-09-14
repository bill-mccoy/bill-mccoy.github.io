export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatYear(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.getFullYear().toString();
}