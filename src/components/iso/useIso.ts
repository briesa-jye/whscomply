"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/components/app/DemoStore";
import { CATALOGUE, docNumber } from "@/lib/iso/catalogue";
import { buildFacts, generateDoc } from "@/lib/iso/client";
import { docKey, type IsoDocSpec, type IsoStd } from "@/lib/iso/types";
import { me } from "@/lib/data";
import { todayISO } from "@/lib/format";

/** Everything the ISO Vault pages need: the saved documents, progress, and generating. */
export function useIso() {
  const s = useStore();
  const { iso } = s;
  const [aiOn, setAiOn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [partial, setPartial] = useState("");
  const [note, setNote] = useState("");
  const [queue, setQueue] = useState<{ done: number; total: number } | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((j: { configured?: boolean }) => setAiOn(!!j.configured))
      .catch(() => setAiOn(false));
  }, []);

  const facts = useMemo(
    () =>
      buildFacts({
        projects: s.projects,
        workers: s.workers,
        subs: s.subs,
        swms: s.swms,
        risks: s.risks,
        chemicals: s.chemicals.filter((c) => c.status === "In use"),
        plant: s.plant,
        incidents: s.incidents,
      }),
    [s.projects, s.workers, s.subs, s.swms, s.risks, s.chemicals, s.plant, s.incidents],
  );

  const unlocked = useCallback(
    (std: IsoStd) => !!iso.purchases[std],
    [iso.purchases],
  );

  const stats = useCallback(
    (std: IsoStd) => {
      const list = CATALOGUE[std];
      const have = list.filter((d) => iso.docs[docKey(std, d.id)]);
      const approved = list.filter((d) => iso.docs[docKey(std, d.id)]?.status === "Approved");
      const mand = list.filter((d) => d.mandatory);
      const mandApproved = mand.filter((d) => iso.docs[docKey(std, d.id)]?.status === "Approved");
      return {
        total: list.length,
        generated: have.length,
        approved: approved.length,
        mandatory: mand.length,
        mandatoryApproved: mandApproved.length,
        pct: list.length ? Math.round((approved.length / list.length) * 100) : 0,
      };
    },
    [iso.docs],
  );

  const save = useCallback(
    (std: IsoStd, spec: IsoDocSpec, text: string, source: "AI" | "Template") => {
      const key = docKey(std, spec.id);
      const prev = iso.docs[key];
      s.saveIsoDoc(
        key,
        {
          status: "Draft",
          content: text,
          version: prev ? prev.version + 1 : 1,
          source,
          generatedAt: todayISO(),
        },
        `generated ${docNumber(std, spec.id)} ${spec.title} for review`,
      );
    },
    [iso.docs, s],
  );

  const generate = useCallback(
    async (std: IsoStd, spec: IsoDocSpec) => {
      if (!iso.purchases[std]) return null;
      const key = docKey(std, spec.id);
      setBusy(key);
      setPartial("");
      setNote("");
      abort.current = new AbortController();
      try {
        const r = await generateDoc(
          spec,
          std,
          iso.profile,
          facts,
          todayISO(),
          setPartial,
          abort.current.signal,
        );
        save(std, spec, r.text, r.source);
        if (r.note) setNote(r.note);
        return r;
      } catch {
        return null; // stopped by the user
      } finally {
        setBusy(null);
        setPartial("");
      }
    },
    [facts, iso.profile, iso.purchases, save],
  );

  const generateAll = useCallback(
    async (std: IsoStd) => {
      if (!iso.purchases[std]) return;
      const todo = CATALOGUE[std].filter((d) => !iso.docs[docKey(std, d.id)]);
      if (!todo.length) return;
      abort.current = new AbortController();
      setNote("");
      let n = 0;
      for (const spec of todo) {
        if (abort.current.signal.aborted) break;
        setQueue({ done: n, total: todo.length });
        setBusy(docKey(std, spec.id));
        try {
          const r = await generateDoc(spec, std, iso.profile, facts, todayISO(), undefined, abort.current.signal);
          save(std, spec, r.text, r.source);
        } catch {
          break;
        }
        n++;
      }
      setQueue(null);
      setBusy(null);
    },
    [facts, iso.docs, iso.profile, iso.purchases, save],
  );

  const stop = useCallback(() => abort.current?.abort(), []);

  const approve = useCallback(
    (std: IsoStd, spec: IsoDocSpec) => {
      const key = docKey(std, spec.id);
      const d = iso.docs[key];
      if (!d) return;
      s.saveIsoDoc(
        key,
        { ...d, status: "Approved", approvedAt: todayISO(), approvedBy: me.name },
        `approved ${docNumber(std, spec.id)} ${spec.title}`,
      );
    },
    [iso.docs, s],
  );

  return { ...s, iso, aiOn, busy, partial, note, queue, facts, stats, unlocked, generate, generateAll, stop, approve, save };
}
