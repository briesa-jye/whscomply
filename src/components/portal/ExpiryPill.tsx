import { daysUntil, expiryOf } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { Pill } from "../app/ui";

/** Valid, expiring soon or expired, with the date. */
export function ExpiryPill({
  expires,
  warn,
}: {
  expires: string | null;
  warn: number;
}) {
  const e = expiryOf(expires, warn);
  if (e === "none") return <Pill>No expiry</Pill>;
  const d = daysUntil(expires!);
  if (e === "expired") return <Pill tone="owed">Expired {fmtDate(expires!)}</Pill>;
  if (e === "soon") return <Pill tone="owed">{d} days left</Pill>;
  return <Pill tone="ok">Valid to {fmtDate(expires!)}</Pill>;
}
