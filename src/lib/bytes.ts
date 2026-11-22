const NBSP = "\u00a0";
const num = (n: number, digits: number) => new Intl.NumberFormat("en-GB", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);

/** Human file size with a non-breaking space before the unit (e.g. "1.5 MB"). */
export function fmtBytes(n: number) {
  if (n >= 1e9) return `${num(n / 1e9, 2)}${NBSP}GB`;
  if (n >= 1e6) return `${num(n / 1e6, 1)}${NBSP}MB`;
  return `${num(Math.max(1, Math.round(n / 1e3)), 0)}${NBSP}KB`;
}
