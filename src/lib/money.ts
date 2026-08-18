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
  NZD: 'NZ$',
  SGD: 'S$',
  HKD: 'HK$',
  JPY: '¥',
  CNY: 'CN¥',
  CHF: 'CHF ',
  SEK: 'kr ',
  NOK: 'kr ',
  DKK: 'kr ',
  PLN: 'zł ',
  ZAR: 'R',
  AED: 'AED ',
  SAR: 'SAR ',
  BRL: 'R$',
  MXN: 'MX$',
  NGN: '₦',
  KES: 'KSh ',
  PHP: '₱',
  THB: '฿',
  IDR: 'Rp ',
  MYR: 'RM',
  VND: '₫',
  TRY: '₺',
  KRW: '₩',
  ILS: '₪',
  PKR: 'Rs ',
  LKR: 'Rs ',
  BDT: '৳',
};

/** Every code the picker offers, in the order it shows them. */
export const CURRENCY_CODES = Object.keys(SYMBOLS);

/**
 * Fallback jar cap in cents, matching the `groups.jar_cap_cents` column default.
 * Prefer the group's own value — this is only for a group that hasn't loaded.
 */
export const DEFAULT_JAR_CAP_CENTS = 5000;

/** "INR ₹" — for pickers, where the bare symbol is ambiguous (₹ vs Rs). */
export function currencyLabel(code: string): string {
  return `${code.toUpperCase()} ${currencySymbol(code)}`.trim();
}

/**
 * A first guess at the user's currency, from the device region.
 *
 * Only a default for the signup picker — it is always shown and always
 * changeable. Without it the picker would open on GBP for everyone, which is the
 * silent default that started all of this.
 *
 * Deliberately dependency-free: Intl is in Hermes, and anything it can't tell us
 * falls back to GBP.
 */
const REGION_CURRENCY: Record<string, string> = {
  GB: 'GBP', US: 'USD', IN: 'INR', AU: 'AUD', CA: 'CAD', NZ: 'NZD', SG: 'SGD',
  HK: 'HKD', JP: 'JPY', CN: 'CNY', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK',
  PL: 'PLN', ZA: 'ZAR', AE: 'AED', SA: 'SAR', BR: 'BRL', MX: 'MXN', NG: 'NGN',
  KE: 'KES', PH: 'PHP', TH: 'THB', ID: 'IDR', MY: 'MYR', VN: 'VND', TR: 'TRY',
  KR: 'KRW', IL: 'ILS', PK: 'PKR', LK: 'LKR', BD: 'BDT',
  // The euro is one currency across many regions.
  IE: 'EUR', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', PT: 'EUR',
  AT: 'EUR', BE: 'EUR', FI: 'EUR', GR: 'EUR',
};

export function deviceCurrency(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    const region = locale.split('-').find((p) => /^[A-Z]{2}$/.test(p));
    return (region && REGION_CURRENCY[region]) || 'GBP';
  } catch {
    return 'GBP';
  }
}

export type CurrencyTotal = { currency: string; cents: number };

/**
 * Bucket amounts by their own currency, largest first.
 *
 * Cents from different currencies must never be added — a group holding ₹500 and
 * one holding $500 do not make 1000 of anything. Anything spanning groups has to
 * go through here rather than a plain `reduce`.
 */
export function totalsByCurrency(
  items: { currency?: string | null; cents: number }[],
): CurrencyTotal[] {
  const by = new Map<string, number>();
  for (const { currency, cents } of items) {
    const code = (currency ?? 'GBP').toUpperCase();
    by.set(code, (by.get(code) ?? 0) + cents);
  }
  return [...by.entries()]
    .map(([currency, cents]) => ({ currency, cents }))
    .sort((a, b) => b.cents - a.cents);
}

/** "₹120 · $30" across currencies, plain "₹120" when they all agree. */
export function formatTotals(totals: CurrencyTotal[], fallback?: string | null): string {
  if (totals.length === 0) return formatMoney(0, fallback);
  return totals.map((t) => formatMoney(t.cents, t.currency)).join(' · ');
}

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
