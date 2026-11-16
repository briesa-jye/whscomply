/** Card entry helpers: brand, grouping, the Luhn check and expiry. Only the brand, last four and expiry are ever kept. */
export function cardBrand(digits: string) {
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  return "";
}
export function formatCard(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (cardBrand(d) === "Amex") {
    const a = d.slice(0, 15);
    return [a.slice(0, 4), a.slice(4, 10), a.slice(10)]
      .filter(Boolean)
      .join(" ");
  }
  return (d.slice(0, 16).match(/.{1,4}/g) ?? []).join(" ");
}
export function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let n = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return digits.length >= 13 && sum % 10 === 0;
}
export function formatExpiry(raw: string, prev: string) {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  // Deleting the slash should delete the month digit before it.
  if (raw.length < prev.length && prev.endsWith("/")) return d.slice(0, 1);
  if (d.length === 1 && Number(d) > 1) return `0${d}/`;
  if (d.length >= 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return d;
}
export function expiryOk(exp: string) {
  const m = /^(\d{2})\/(\d{2})$/.exec(exp);
  if (!m) return false;
  const month = Number(m[1]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const yy = now.getFullYear() % 100;
  const y = Number(m[2]);
  return y > yy || (y === yy && month >= now.getMonth() + 1);
}

