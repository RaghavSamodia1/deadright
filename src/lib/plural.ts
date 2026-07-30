/** "1 member" / "2 members" — the count was reading "1 members" in four places. */
export function plural(n: number, one: string, many?: string): string {
  return `${n} ${n === 1 ? one : (many ?? `${one}s`)}`;
}
