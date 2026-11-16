"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/app/Modal";
import { btnDark, btnLight } from "@/components/app/ui";
import { cardBrand, expiryOk, formatCard, formatExpiry, luhn } from "@/lib/card";

const input =
  "mt-1 block w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink focus:border-ink aria-[invalid=true]:border-red-400";

/** Replace the card on file. Only the brand, last four digits and expiry are kept. */
export function UpdateCardDialog({
  name: initialName,
  onClose,
  onSave,
}: {
  name: string;
  onClose: () => void;
  onSave: (c: { brand: string; last4: string; exp: string; name: string }) => void;
}) {
  const [name, setName] = useState(initialName);
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const digits = number.replace(/\D/g, "");
  const brand = cardBrand(digits);
  const cvcLen = brand === "Amex" ? 4 : 3;

  function submit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter the name on the card.";
    if (!brand) next.number = "Use Visa, Mastercard or Amex.";
    else if (!luhn(digits)) next.number = "Check the card number.";
    if (!expiryOk(exp)) next.exp = "Use a future MM/YY.";
    if (cvc.length !== cvcLen) next.cvc = `${cvcLen} digits.`;
    setErr(next);
    if (Object.keys(next).length) return;
    onSave({ brand, last4: digits.slice(-4), exp, name: name.trim() });
  }

  const e = (k: string) => (err[k] ? <span className="mt-1 block text-xs text-red-600">{err[k]}</span> : null);
  return (
    <Modal title="Update card" sub="Future charges go to the new card" onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-3">
        <label className="block text-sm font-medium">
          Name on card
          <input value={name} onChange={(x) => setName(x.target.value)} autoComplete="cc-name" aria-invalid={err.name ? true : undefined} className={input} />
          {e("name")}
        </label>
        <label className="block text-sm font-medium">
          Card number
          <input value={number} onChange={(x) => setNumber(formatCard(x.target.value))} inputMode="numeric" autoComplete="cc-number" placeholder="1234 1234 1234 1234" aria-invalid={err.number ? true : undefined} className={`${input} tabular-nums`} />
          {e("number")}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            Expiry
            <input value={exp} onChange={(x) => setExp(formatExpiry(x.target.value, exp))} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" aria-invalid={err.exp ? true : undefined} className={`${input} tabular-nums`} />
            {e("exp")}
          </label>
          <label className="block text-sm font-medium">
            CVC
            <input value={cvc} onChange={(x) => setCvc(x.target.value.replace(/\D/g, "").slice(0, cvcLen))} inputMode="numeric" autoComplete="cc-csc" aria-invalid={err.cvc ? true : undefined} className={`${input} tabular-nums`} />
            {e("cvc")}
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={btnLight}>Cancel</button>
          <button type="submit" className={btnDark}>Save card</button>
        </div>
      </form>
    </Modal>
  );
}
