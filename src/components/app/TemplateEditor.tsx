"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icons";
import { useScope } from "@/components/app/DemoStore";
import {
  btnDark,
  btnLight,
  Card,
  CardHead,
  field,
  PageHeading,
  Pill,
} from "@/components/app/ui";
import type {
  MeetingKind,
  MeetingTemplate,
  TemplateItem,
  TemplateItemType,
} from "@/lib/data";

const TYPES: [TemplateItemType, string][] = [
  ["tick", "Tick box"],
  ["yesno", "Yes / No / N/A"],
  ["text", "Written answer"],
  ["number", "Number"],
];

const rid = () =>
  Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-3);
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/**
 * Each client decides what a pre-start, toolbox talk or meeting records.
 * A meeting keeps a copy of the template from when it started, so edits never change past records.
 */
export function TemplateEditor({
  kinds,
  base,
  noun,
}: {
  kinds: MeetingKind[];
  base: string;
  noun: string;
}) {
  const s = useScope();
  const list = s.meetingTemplates.filter((t) => kinds.includes(t.kind));
  const [selected, setSelected] = useState("");
  const [edits, setEdits] = useState<Record<string, MeetingTemplate>>({});

  const stored = list.find((t) => t.id === selected) ?? list[0];
  const current = stored ? (edits[stored.id] ?? stored) : undefined;
  const dirty = !!stored && !!edits[stored.id];
  const sameKind = stored
    ? s.meetingTemplates.filter((t) => t.kind === stored.kind).length
    : 0;

  const change = (fn: (t: MeetingTemplate) => void) => {
    if (!stored) return;
    setEdits((e) => {
      const next = clone(e[stored.id] ?? stored);
      fn(next);
      return { ...e, [stored.id]: next };
    });
  };

  const move = <T,>(arr: T[], i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  };

  const add = (copyOf?: MeetingTemplate) => {
    const base0 =
      copyOf ??
      list.find((t) => t.isDefault) ??
      list[0];
    const t: MeetingTemplate = {
      ...clone(base0),
      id: `tpl-${rid()}`,
      name: copyOf ? `${copyOf.name} copy` : "New template",
      isDefault: false,
    };
    s.saveMeetingTemplate(t);
    setSelected(t.id);
  };

  return (
    <>
      <Link
        href={base}
        className="mb-3 inline-block text-xs font-semibold underline"
      >
        Back to {noun}s
      </Link>
      <PageHeading
        title={`${noun[0].toUpperCase()}${noun.slice(1)} templates`}
        sub="Decide what your crews record and answer. Add as many templates as you need, such as one per trade or project, and choose the default."
        actions={
          <button type="button" onClick={() => add()} className={btnDark}>
            <Icon name="plus" className="h-4 w-4" /> New template
          </button>
        }
      />

      <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
        <Card>
          <ul className="p-2">
            {list.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelected(t.id)}
                  aria-current={stored?.id === t.id ? "true" : undefined}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm ${stored?.id === t.id ? "bg-accent/20 font-semibold" : "hover:bg-tint"}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate">
                      {(edits[t.id] ?? t).name}
                    </span>
                    {kinds.length > 1 && (
                      <span className="block truncate text-xs text-ink-soft">
                        {t.kind}
                      </span>
                    )}
                  </span>
                  {t.isDefault && <Pill tone="ok">Default</Pill>}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {current && stored && (
          <div className="space-y-6">
            <Card>
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Template name
                  <input
                    value={current.name}
                    onChange={(e) => change((t) => void (t.name = e.target.value))}
                    className={field}
                  />
                </label>
                {kinds.length > 1 && (
                  <label className="block text-sm font-medium">
                    Type
                    <select
                      value={current.kind}
                      onChange={(e) =>
                        change((t) => void (t.kind = e.target.value as MeetingKind))
                      }
                      className={field}
                    >
                      {kinds.map((k) => (
                        <option key={k}>{k}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </Card>

            {current.sections.map((sec, si) => (
              <Card key={sec.id}>
                <div className="flex items-center gap-2 border-b border-line px-5 py-3">
                  <input
                    value={sec.title}
                    onChange={(e) =>
                      change((t) => void (t.sections[si].title = e.target.value))
                    }
                    aria-label="Section title"
                    className={`${field} !mt-0 font-semibold`}
                  />
                  <button
                    type="button"
                    aria-label="Move section up"
                    onClick={() => change((t) => move(t.sections, si, -1))}
                    className="px-1 text-ink-soft hover:text-ink"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Move section down"
                    onClick={() => change((t) => move(t.sections, si, 1))}
                    className="px-1 text-ink-soft hover:text-ink"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-label="Remove section"
                    onClick={() => {
                      if (
                        sec.items.length === 0 ||
                        window.confirm(`Remove "${sec.title}" and its items?`)
                      )
                        change((t) => void t.sections.splice(si, 1));
                    }}
                    className="text-ink-soft hover:text-ink"
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </button>
                </div>
                <ul className="divide-y divide-line">
                  {sec.items.map((it: TemplateItem, ii) => (
                    <li
                      key={it.id}
                      className="flex flex-wrap items-center gap-2 px-5 py-3"
                    >
                      <input
                        value={it.label}
                        onChange={(e) =>
                          change(
                            (t) =>
                              void (t.sections[si].items[ii].label = e.target.value),
                          )
                        }
                        aria-label="Item"
                        className={`${field} !mt-0 min-w-48 flex-1`}
                      />
                      <select
                        value={it.type}
                        onChange={(e) =>
                          change(
                            (t) =>
                              void (t.sections[si].items[ii].type =
                                e.target.value as TemplateItemType),
                          )
                        }
                        aria-label="Answer type"
                        className={`${field} !mt-0 w-auto`}
                      >
                        {TYPES.map(([k, l]) => (
                          <option key={k} value={k}>
                            {l}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          checked={it.required}
                          onChange={(e) =>
                            change(
                              (t) =>
                                void (t.sections[si].items[ii].required =
                                  e.target.checked),
                            )
                          }
                          className="accent-[var(--ink)]"
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        aria-label="Move item up"
                        onClick={() =>
                          change((t) => move(t.sections[si].items, ii, -1))
                        }
                        className="px-1 text-ink-soft hover:text-ink"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label="Move item down"
                        onClick={() =>
                          change((t) => move(t.sections[si].items, ii, 1))
                        }
                        className="px-1 text-ink-soft hover:text-ink"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        aria-label="Remove item"
                        onClick={() =>
                          change((t) => void t.sections[si].items.splice(ii, 1))
                        }
                        className="text-ink-soft hover:text-ink"
                      >
                        <Icon name="close" className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-line px-5 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      change(
                        (t) =>
                          void t.sections[si].items.push({
                            id: `i${rid()}`,
                            label: "",
                            type: "tick",
                            required: false,
                          }),
                      )
                    }
                    className="text-xs font-semibold underline"
                  >
                    Add an item
                  </button>
                </div>
              </Card>
            ))}

            <div>
              <button
                type="button"
                onClick={() =>
                  change(
                    (t) =>
                      void t.sections.push({
                        id: `s${rid()}`,
                        title: "New section",
                        items: [],
                      }),
                  )
                }
                className={btnLight}
              >
                <Icon name="plus" className="h-4 w-4" /> Add a section
              </button>
            </div>

            <Card>
              <CardHead title="Save" />
              <div className="flex flex-wrap items-center justify-between gap-2 p-5">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => add(current)}
                    className={btnLight}
                  >
                    Duplicate
                  </button>
                  {!stored.isDefault && (
                    <button
                      type="button"
                      onClick={() => s.setDefaultMeetingTemplate(stored.id)}
                      className={btnLight}
                    >
                      Make default
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={sameKind < 2}
                    title={
                      sameKind < 2
                        ? "Keep at least one template for each type"
                        : ""
                    }
                    onClick={() => {
                      if (window.confirm(`Delete "${stored.name}"? Past records keep their copy.`)) {
                        s.removeMeetingTemplate(stored.id);
                        setSelected("");
                        setEdits((e) => {
                          const n = { ...e };
                          delete n[stored.id];
                          return n;
                        });
                      }
                    }}
                    className={`${btnLight} disabled:opacity-40`}
                  >
                    Delete
                  </button>
                </div>
                <div className="flex gap-2">
                  {dirty && (
                    <button
                      type="button"
                      onClick={() =>
                        setEdits((e) => {
                          const n = { ...e };
                          delete n[stored.id];
                          return n;
                        })
                      }
                      className={btnLight}
                    >
                      Discard changes
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={
                      !dirty ||
                      !current.name.trim() ||
                      current.sections.some((x) =>
                        x.items.some((i) => !i.label.trim()),
                      )
                    }
                    onClick={() => {
                      s.saveMeetingTemplate(current);
                      setEdits((e) => {
                        const n = { ...e };
                        delete n[stored.id];
                        return n;
                      });
                    }}
                    className={`${btnDark} disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {dirty ? "Save template" : "Saved"}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
