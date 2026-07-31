/**
 * Money display. Amounts are stored as integer cents; never do the arithmetic
 * inline at the call site — that is how "$1.00000000000000000000" reached the
 * notifications table.
 */
const SYMBOLS: Record<string, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
};

export function currencySymbol(code?: string | null): string {
  return SYMBOLS[(code ?? 'GBP').toUpperCase()] ?? (code ?? 'GBP').toUpperCase() + ' ';
}

/** Cents → "£12.50", dropping the decimals on whole amounts ("£12"). */
export function formatMoney(cents: number, code?: string | null): string {
  const units = cents / 100;
  const body = Number.isInteger(units) ? String(units) : units.toFixed(2);
  return `${currencySymbol(code)}${body}`;
}

/**
 * "12.50" → 1250. Returns null for anything not a sane positive amount, so the
 * caller can keep the CTA disabled rather than posting NaN.
 */
export function parseAmountToCents(input: string): number | null {
  const cleaned = input.replace(/[^0-9.]/g, '');
  if (!cleaned || (cleaned.match(/\./g) ?? []).length > 1) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0 || value > 10000) return null;
  return Math.round(value * 100);
}
