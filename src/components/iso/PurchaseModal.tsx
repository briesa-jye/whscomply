"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "../Icons";
import { useStore } from "../app/DemoStore";
import { Modal } from "../app/Modal";
import { btnDark, btnLight } from "../app/ui";
import { cardBrand, expiryOk, formatCard, formatExpiry, luhn } from "@/lib/card";
import { ISO_PRICE, money, STANDARDS } from "@/lib/iso/standards";
import type { IsoStd } from "@/lib/iso/types";

const input =
  "mt-1 block w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink focus:border-ink aria-[invalid=true]:border-red-400";

/** Unlock one standard for a one-off payment. Only the card brand and last four digits are kept. */
export function PurchaseModal({
  std,
  onClose,
  onPaid,
}: {
  std: IsoStd;
  onClose: () => void;
  onPaid?: (receipt: string) => void;
}) {
  const { settings, buyIso } = useStore();
  const onFile = settings.card;
  const [useFile, setUseFile] = useState(!!onFile);
  const [name, setName] = useState(settings.card?.name ?? "");
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState("");
  const m = STANDARDS[std];

  const digits = number.replace(/\D/g, "");
  const brand = cardBrand(digits);
  const cvcLen = brand === "Amex" ? 4 : 3;

  function finish(card: { brand: string; last4: string }) {
    setBusy(true);
    window.setTimeout(() => {
      const r = buyIso(std, card);
      setReceipt(r);
      setBusy(false);
      onPaid?.(r);
    }, 900);
  }

  function pay(e: FormEvent) {
    e.preventDefault();
    if (useFile && onFile) return finish({ brand: onFile.brand, last4: onFile.last4 });
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter the name on the card.";
    if (!brand) next.number = "Use Visa, Mastercard or Amex.";
    else if (!luhn(digits)) next.number = "Check the card number.";
    if (!expiryOk(exp)) next.exp = "Use a future MM/YY.";
    if (cvc.length !== cvcLen) next.cvc = `${cvcLen} digits.`;
    setErr(next);
    if (Object.keys(next).length) return;
    // Only the brand and last four digits are kept. The full number and CVC go nowhere.
    finish({ brand, last4: digits.slice(-4) });
  }

  if (receipt)
    return (
      <Modal title="Unlocked" onClose={onClose}>
        <div className="space-y-4 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
            <Icon name="check" className="h-6 w-6" />
          </span>
          <p className="font-display text-xl font-extrabold">{m.name} is unlocked</p>
          <p className="text-sm text-ink-soft">
            Receipt {receipt} · {money(ISO_PRICE)} paid. Every document in the set is now yours to generate, edit and
            download.
          </p>
          <button type="button" onClick={onClose} className={btnDark}>
            Start generating
          </button>
        </div>
      </Modal>
    );

  return (
    <Modal title={`Unlock ${m.name}`} sub="One-off payment for the whole document set" onClose={onClose}>
      <form onSubmit={pay} noValidate className="space-y-4">
        <div className="rounded-xl border border-line bg-bg p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{m.name} document set</span>
            <span className="font-display text-lg font-extrabold tabular-nums">{money(ISO_PRICE)}</span>
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            Every policy, procedure, register and form for this standard. You pay once for this standard, with no
            subscription. Each other standard is bought separately.
          </p>
        </div>

        {onFile && (
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5">
              <input type="radio" name="how" checked={useFile} onChange={() => setUseFile(true)} className="accent-[var(--ink)]" />
              Pay with {onFile.brand} ending {onFile.last4}
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5">
              <input type="radio" name="how" checked={!useFile} onChange={() => setUseFile(false)} className="accent-[var(--ink)]" />
              Use a different card
            </label>
          </div>
        )}

        {!useFile && (
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              Name on card
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="cc-name" aria-invalid={err.name ? true : undefined} className={input} />
              {err.name && <span className="mt-1 block text-xs text-red-600">{err.name}</span>}
            </label>
            <label className="block text-sm font-medium">
              Card number
              <input value={number} onChange={(e) => setNumber(formatCard(e.target.value))} inputMode="numeric" autoComplete="cc-number" placeholder="1234 1234 1234 1234" aria-invalid={err.number ? true : undefined} className={`${input} tabular-nums`} />
              {err.number && <span className="mt-1 block text-xs text-red-600">{err.number}</span>}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium">
                Expiry
                <input value={exp} onChange={(e) => setExp(formatExpiry(e.target.value, exp))} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" aria-invalid={err.exp ? true : undefined} className={`${input} tabular-nums`} />
                {err.exp && <span className="mt-1 block text-xs text-red-600">{err.exp}</span>}
              </label>
              <label className="block text-sm font-medium">
                CVC
                <input value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, cvcLen))} inputMode="numeric" autoComplete="cc-csc" placeholder={brand === "Amex" ? "4 digits" : "3 digits"} aria-invalid={err.cvc ? true : undefined} className={`${input} tabular-nums`} />
                {err.cvc && <span className="mt-1 block text-xs text-red-600">{err.cvc}</span>}
              </label>
            </div>
          </div>
        )}

        <p className="rounded-lg bg-tint px-3 py-2 text-xs text-ink-soft">
          This is a demo workspace, so no money is taken. Only the card brand and last four digits are kept, in this
          browser.
        </p>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnLight}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={`${btnDark} disabled:opacity-70`}>
            {busy ? "Processing…" : `Pay ${money(ISO_PRICE)}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
