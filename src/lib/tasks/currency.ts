export const CURRENCIES = [
  { code: "NGN", label: "Nigerian Naira" },
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "GHS", label: "Ghanaian Cedi" },
  { code: "KES", label: "Kenyan Shilling" },
  { code: "ZAR", label: "South African Rand" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "INR", label: "Indian Rupee" },
  { code: "JPY", label: "Japanese Yen" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

const CURRENCY_LOCALE: Record<string, string> = {
  NGN: "en-NG",
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
  GHS: "en-GH",
  KES: "en-KE",
  ZAR: "en-ZA",
  CAD: "en-CA",
  INR: "en-IN",
  JPY: "ja-JP",
};

export function formatMoney(amount: number, currency: string): string {
  const locale = CURRENCY_LOCALE[currency] ?? "en";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;
  }
}

export function parseAmount(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}
