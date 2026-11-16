"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Icon } from "@/components/Icons";
import { startWorkspace } from "@/components/app/DemoStore";
import { cardBrand, expiryOk, formatCard, formatExpiry, luhn } from "@/lib/card";
import {
  BUILDER_PLANS,
  TRIAL_DAYS,
  planPrice,
  type BuilderPlan,
} from "@/lib/plans";

const field =
  "block w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink shadow-sm outline-none transition-colors placeholder:text-ink-soft/70 focus:border-accent focus:ring-4 focus:ring-accent/15 aria-[invalid=true]:border-red-400";
const label = "mb-1 block text-sm font-semibold text-ink";
const primary =
  "w-full rounded-lg bg-accent py-3 font-semibold text-white shadow-sm transition-colors hover:bg-accent/90 disabled:opacity-70";

type Account = "builder" | "subcontractor";
const BUILDER_STEPS = ["Your details", "Your plan", "Payment"];

/* ---------- checks ---------- */

/** Password strength from 0 to 4: length, a letter, a number, and length 12+ or a symbol. */
function strength(pw: string) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/i.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (pw.length >= 12 || /[^a-z0-9]/i.test(pw)) s++;
  return pw.length < 8 ? Math.min(s, 1) : s;
}
const STRENGTH = ["", "Too weak", "Fair", "Good", "Strong"];
const BAR = ["", "bg-red-500", "bg-amber-500", "bg-accent", "bg-emerald-500"];

/** The ATO's ABN check: take 1 from the first digit, weight each digit, and the total divides by 89. */
function validAbn(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 11) return false;
  const w = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const sum = d
    .split("")
    .reduce((t, c, i) => t + (Number(c) - (i === 0 ? 1 : 0)) * w[i], 0);
  return sum % 89 === 0;
}
const formatAbn = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 8), d.slice(8, 11)]
    .filter(Boolean)
    .join(" ");
};

const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const trialEndDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + TRIAL_DAYS);
  return d;
};

/* ---------- wrappers ---------- */

/** Reads ?plan= and ?type= from the pricing page. Kept apart so the form can prerender without it. */
function WithUrl() {
  const params = useSearchParams();
  const p = params.get("plan");
  const plan = BUILDER_PLANS.find((x) => x.name === p)?.name ?? null;
  const account: Account =
    params.get("type") === "subcontractor" ? "subcontractor" : "builder";
  return <Flow initialPlan={plan} initialAccount={account} />;
}

export function SignUpForm({ withPlanFromUrl = false }) {
  return withPlanFromUrl ? (
    <WithUrl />
  ) : (
    <Flow initialPlan={null} initialAccount="builder" />
  );
}

/* ---------- the flow ---------- */

type Details = {
  name: string;
  company: string;
  email: string;
  abn: string;
  password: string;
};

function Flow({
  initialPlan,
  initialAccount,
}: {
  initialPlan: BuilderPlan | null;
  initialAccount: Account;
}) {
  const [account, setAccount] = useState<Account>(initialAccount);
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState<Details>({
    name: "",
    company: "",
    email: "",
    abn: "",
    password: "",
  });
  const [plan, setPlan] = useState<BuilderPlan>(initialPlan ?? "Medium");
  const builder = account === "builder";

  return (
    <div className="flex min-h-0 flex-col">
      {builder && step > 0 ? (
        <Progress step={step} onBack={() => setStep(step - 1)} />
      ) : (
        <AccountToggle value={account} onChange={setAccount} />
      )}
      <div key={`${account}-${step}`} className="auth-in min-h-0">
        {step === 0 && (
          <DetailsStep
            account={account}
            value={details}
            onChange={setDetails}
            onNext={() => setStep(1)}
          />
        )}
        {builder && step === 1 && (
          <PlanStep plan={plan} onChange={setPlan} onNext={() => setStep(2)} />
        )}
        {builder && step === 2 && <CardStep plan={plan} details={details} />}
      </div>
    </div>
  );
}

function AccountToggle({
  value,
  onChange,
}: {
  value: Account;
  onChange: (a: Account) => void;
}) {
  const options: [Account, string][] = [
    ["builder", "I'm a builder"],
    ["subcontractor", "I'm a subcontractor"],
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Account type"
      className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-tint p-1"
    >
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            value === v
              ? "bg-surface text-ink shadow-sm"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function Progress({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-ink-soft">
          Step {step + 1} of 3 ·{" "}
          <span className="text-ink">{BUILDER_STEPS[step]}</span>
        </span>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-ink-soft transition-colors hover:text-ink"
        >
          <Icon name="arrow" className="h-3.5 w-3.5 rotate-180" />
          Back
        </button>
      </div>
      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        {BUILDER_STEPS.map((s, i) => (
          <span
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-accent" : "bg-line"}`}
          />
        ))}
      </div>
    </div>
  );
}

function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {title}
      </h1>
      <p className="mt-1.5 text-sm text-ink-soft sm:text-base">{sub}</p>
    </>
  );
}

function Err({ id, children }: { id: string; children?: string }) {
  return children ? (
    <p id={id} className="mt-1 text-xs text-red-600">
      {children}
    </p>
  ) : null;
}

function useErrors<K extends string>() {
  const [errors, setErrors] = useState<Partial<Record<K, string>>>({});
  const aria = (k: K) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `su-${k}-err` : undefined,
  });
  const show = (next: Partial<Record<K, string>>) => {
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) document.getElementById(`su-${first}`)?.focus();
    return !first;
  };
  return { errors, aria, show };
}

/* ---------- step 1: details ---------- */

function DetailsStep({
  account,
  value,
  onChange,
  onNext,
}: {
  account: Account;
  value: Details;
  onChange: (d: Details) => void;
  onNext: () => void;
}) {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const { errors, aria, show } = useErrors<keyof Details>();
  const set = (k: keyof Details, v: string) => onChange({ ...value, [k]: v });
  const score = strength(value.password);
  const sub = account === "subcontractor";

  function submit(e: FormEvent) {
    e.preventDefault();
    const next: Partial<Record<keyof Details, string>> = {};
    if (value.name.trim().length < 2) next.name = "Enter your full name.";
    if (value.company.trim().length < 2)
      next.company = sub
        ? "Enter your business name."
        : "Enter the company name.";
    if (!/^\S+@\S+\.\S+$/.test(value.email.trim()))
      next.email = "Enter a valid email address.";
    if (!validAbn(value.abn))
      next.abn =
        value.abn.replace(/\D/g, "").length === 11
          ? "That ABN doesn't check out. Look at it again."
          : "An ABN has 11 digits.";
    if (value.password.length < 8) next.password = "Use at least 8 characters.";
    else if (score < 3) next.password = "Add a mix of letters and numbers.";
    if (!show(next)) return;
    if (!sub) return onNext();
    // Subcontractors are free: no plan, no card. Demo workspace, nothing leaves the browser.
    setBusy(true);
    startWorkspace({
      company: value.company.trim(),
      abn: value.abn,
      email: value.email.trim(),
      contact: value.name.trim(),
      account: "subcontractor",
    });
    window.setTimeout(() => router.push(sub ? "/portal" : "/dashboard"), 900);
  }

  return (
    <form onSubmit={submit} noValidate>
      <Heading
        title={
          sub ? "Create your free account" : "Create your builder account"
        }
        sub={
          sub
            ? "Free for subcontractors. Builders invite you to their projects."
            : `Set up your company workspace. Free for ${TRIAL_DAYS} days.`
        }
      />
      <div className="mt-5 space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="su-name" className={label}>
              Your name
            </label>
            <input
              id="su-name"
              autoComplete="name"
              placeholder="Sam Rivera"
              value={value.name}
              onChange={(e) => set("name", e.target.value)}
              className={field}
              {...aria("name")}
            />
            <Err id="su-name-err">{errors.name}</Err>
          </div>
          <div>
            <label htmlFor="su-company" className={label}>
              {sub ? "Business name" : "Company name"}
            </label>
            <input
              id="su-company"
              autoComplete="organization"
              placeholder={sub ? "Apex Electrical" : "Ridgeline Homes"}
              value={value.company}
              onChange={(e) => set("company", e.target.value)}
              className={field}
              {...aria("company")}
            />
            <Err id="su-company-err">{errors.company}</Err>
          </div>
        </div>

        <div>
          <label htmlFor="su-email" className={label}>
            Work email
          </label>
          <input
            id="su-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com.au"
            value={value.email}
            onChange={(e) => set("email", e.target.value)}
            className={field}
            {...aria("email")}
          />
          <Err id="su-email-err">{errors.email}</Err>
        </div>

        <div>
          <label htmlFor="su-abn" className={label}>
            {sub ? "Business ABN" : "Company ABN"}
          </label>
          <input
            id="su-abn"
            inputMode="numeric"
            placeholder="12 345 678 901"
            value={value.abn}
            onChange={(e) => set("abn", formatAbn(e.target.value))}
            className={`${field} tabular-nums`}
            {...aria("abn")}
          />
          <Err id="su-abn-err">{errors.abn}</Err>
        </div>

        <div>
          <label htmlFor="su-password" className={label}>
            Password
          </label>
          <div className="relative">
            <input
              id="su-password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={value.password}
              onChange={(e) => set("password", e.target.value)}
              className={`${field} pr-11`}
              {...aria("password")}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
              aria-pressed={showPw}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-ink-soft transition-colors hover:text-ink"
            >
              <Icon
                name={showPw ? "eye" : "eye-off"}
                className="h-[18px] w-[18px]"
              />
            </button>
          </div>
          {value.password && (
            <div className="mt-1.5 flex items-center gap-3" aria-live="polite">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? BAR[score] : "bg-line"}`}
                  />
                ))}
              </div>
              <span className="w-14 text-right text-xs text-ink-soft">
                {STRENGTH[score]}
              </span>
            </div>
          )}
          <Err id="su-password-err">{errors.password}</Err>
        </div>
      </div>

      <button type="submit" disabled={busy} className={`${primary} mt-5`}>
        {sub
          ? busy
            ? "Setting up your account…"
            : "Create free account"
          : "Continue"}
      </button>
      <p className="mt-4 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-accent hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

/* ---------- step 2: plan (builders) ---------- */

function PlanStep({
  plan,
  onChange,
  onNext,
}: {
  plan: BuilderPlan;
  onChange: (p: BuilderPlan) => void;
  onNext: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      <Heading
        title="Choose your plan"
        sub="Priced by live projects, never per worker. Subcontractors join free."
      />
      <fieldset className="mt-5 space-y-2.5">
        <legend className="sr-only">Plan</legend>
        {BUILDER_PLANS.map((p) => {
          const on = plan === p.name;
          return (
            <label
              key={p.name}
              className={`flex cursor-pointer items-center gap-3.5 rounded-xl border p-3.5 transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/15 ${
                on
                  ? "border-accent bg-accent/5"
                  : "border-line hover:border-ink-soft/50"
              }`}
            >
              <input
                type="radio"
                name="plan"
                value={p.name}
                checked={on}
                onChange={() => onChange(p.name)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${on ? "border-accent" : "border-line"}`}
              >
                {on && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{p.name}</span>
                <span className="block text-xs text-ink-soft">
                  {p.projects}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-display text-lg font-bold tabular-nums text-ink">
                  ${p.price}
                </span>
                <span className="block text-[11px] text-ink-soft">/month + GST</span>
              </span>
            </label>
          );
        })}
      </fieldset>
      <p className="mt-3 flex items-center gap-2 rounded-lg bg-tint px-3 py-2 text-xs text-ink">
        <Icon name="check" className="h-3.5 w-3.5 shrink-0 text-accent" />
        {TRIAL_DAYS} days free, then monthly. Change plan anytime.
      </p>
      <button type="submit" className={`${primary} mt-5`}>
        Continue with {plan}
      </button>
    </form>
  );
}

/* ---------- step 3: card (builders) ---------- */

type CardField = "cardName" | "number" | "exp" | "cvc";

function CardStep({ plan, details }: { plan: BuilderPlan; details: Details }) {
  const router = useRouter();
  const [cardName, setCardName] = useState(details.name);
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [busy, setBusy] = useState(false);
  const { errors, aria, show } = useErrors<CardField>();

  const digits = number.replace(/\D/g, "");
  const brand = cardBrand(digits);
  const cvcLen = brand === "Amex" ? 4 : 3;
  const price = planPrice(plan);
  const ends = trialEndDate().toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const next: Partial<Record<CardField, string>> = {};
    if (cardName.trim().length < 2)
      next.cardName = "Enter the name on the card.";
    if (!brand) next.number = "Use Visa, Mastercard or Amex.";
    else if (!luhn(digits)) next.number = "Check the card number.";
    if (!expiryOk(exp)) next.exp = "Use a future MM/YY.";
    if (cvc.length !== cvcLen) next.cvc = `${cvcLen} digits.`;
    if (!show(next)) return;
    setBusy(true);
    // Only the brand, last four and expiry are kept. The full number and CVC go nowhere.
    startWorkspace({
      company: details.company.trim(),
      abn: details.abn,
      email: details.email.trim(),
      contact: details.name.trim(),
      account: "builder",
      plan,
      trialEnds: isoDate(trialEndDate()),
      card: { brand, last4: digits.slice(-4), exp, name: cardName.trim() },
    });
    window.setTimeout(() => router.push("/dashboard"), 900);
  }

  return (
    <form onSubmit={submit} noValidate>
      <Heading
        title="Add your card"
        sub={`Nothing to pay today. Your trial ends ${ends}.`}
      />

      <div className="mt-5 rounded-xl border border-line bg-bg p-3.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink">{plan} plan</span>
          <span className="tabular-nums text-ink">A${price}/mo + GST</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between border-t border-line pt-1.5">
          <span className="text-ink-soft">Due today</span>
          <span className="font-semibold tabular-nums text-ink">A$0.00</span>
        </div>
      </div>

      <div className="mt-4 space-y-3.5">
        <Row label="Name on card" id="su-cardName" err={errors.cardName}>
          <input
            id="su-cardName"
            autoComplete="cc-name"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            className={field}
            {...aria("cardName")}
          />
        </Row>
        <Row label="Card number" id="su-number" err={errors.number}>
          <div className="relative">
            <input
              id="su-number"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 1234 1234 1234"
              value={number}
              onChange={(e) => setNumber(formatCard(e.target.value))}
              className={`${field} pr-24 tabular-nums`}
              {...aria("number")}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              {brand ? (
                <span className="rounded border border-line bg-bg px-1.5 py-0.5 text-[11px] font-bold text-ink">
                  {brand}
                </span>
              ) : (
                <Icon name="lock" className="h-4 w-4 text-ink-soft" />
              )}
            </span>
          </div>
        </Row>
        <div className="grid grid-cols-2 gap-3">
          <Row label="Expiry" id="su-exp" err={errors.exp}>
            <input
              id="su-exp"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              value={exp}
              onChange={(e) => setExp(formatExpiry(e.target.value, exp))}
              className={`${field} tabular-nums`}
              {...aria("exp")}
            />
          </Row>
          <Row label="CVC" id="su-cvc" err={errors.cvc}>
            <input
              id="su-cvc"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder={brand === "Amex" ? "4 digits" : "3 digits"}
              value={cvc}
              onChange={(e) =>
                setCvc(e.target.value.replace(/\D/g, "").slice(0, cvcLen))
              }
              className={`${field} tabular-nums`}
              {...aria("cvc")}
            />
          </Row>
        </div>
      </div>

      <button type="submit" disabled={busy} className={`${primary} mt-5`}>
        {busy
          ? "Setting up your workspace…"
          : `Start ${TRIAL_DAYS}-day free trial`}
      </button>
      <p className="mt-3 text-center text-xs leading-relaxed text-ink-soft">
        You agree to the WHSCOMPLY terms and privacy policy. Cancel before{" "}
        {ends} and you won&apos;t be charged.
      </p>
    </form>
  );
}

function Row({
  label: text,
  id,
  err,
  children,
}: {
  label: string;
  id: string;
  err?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={label}>
        {text}
      </label>
      {children}
      <Err id={`${id}-err`}>{err}</Err>
    </div>
  );
}
