"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useScope } from "@/components/app/DemoStore";
import {
  AI_NOTE,
  aiBtn,
  AiProblem,
  Busy,
  Sparkle,
  useAi,
  useAiContext,
} from "@/components/app/ai";
import {
  btnDark,
  btnLight,
  Card,
  Chips,
  Field,
  field,
  PageHeading,
} from "@/components/app/ui";
import type { TalkDraft } from "@/lib/ai-types";
import { TALK_TOPICS, type MeetingKind } from "@/lib/data";
import { todayISO } from "@/lib/format";

const WHEN = ["Start now", "Schedule for later"] as const;

/**
 * Start a pre-start, toolbox talk or meeting now, or schedule it. It is a page, not a pop-up,
 * so there is room to pick the template and write the content before anyone signs.
 */
export function MeetingNew({
  kinds,
  base,
  noun,
}: {
  kinds: MeetingKind[];
  base: string;
  /** what one is called, such as "pre-start" or "toolbox talk" */
  noun: string;
}) {
  const s = useScope();
  const router = useRouter();
  const params = useSearchParams();
  const ai = useAi();
  const context = useAiContext();

  const single = kinds.length === 1;
  const projects = s.projects.filter((p) => !p.closedAt);
  const [kind, setKind] = useState<MeetingKind>(kinds[0]);
  const [topic, setTopic] = useState("");
  const [projectId, setProjectId] = useState(s.all ? "" : s.scopeId);
  const [templateId, setTemplateId] = useState("");
  const [presenter, setPresenter] = useState("Sam Kowalski");
  const [when, setWhen] = useState<(typeof WHEN)[number]>(
    params.get("when") === "later" ? "Schedule for later" : "Start now",
  );
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("07:00");
  const [notes, setNotes] = useState("");

  const tpls = s.meetingTemplates.filter((t) => t.kind === kind);
  const chosen =
    tpls.find((t) => t.id === templateId) ??
    tpls.find((t) => t.isDefault) ??
    tpls[0];
  const now = when === "Start now";
  const label = single ? noun : kind.toLowerCase();

  const draft = async () => {
    const r = await ai.run<TalkDraft>("talk", { topic, context: context() });
    if (!r) return;
    if (r.topic && !topic.trim()) setTopic(r.topic);
    setNotes(r.notes);
  };

  return (
    <>
      <Link
        href={base}
        className="mb-3 inline-block text-xs font-semibold underline"
      >
        Back to {single ? `${noun}s` : "meetings"}
      </Link>
      <PageHeading
        title={now ? `Start a ${label}` : `Schedule a ${label}`}
        sub={
          now
            ? "Starting now opens the form straight away, with the crew on site ready to sign."
            : "Scheduled meetings appear in your needs-action list when the day and time arrive, and can then be started in one tap."
        }
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const id = s.createMeeting({
            kind,
            projectId,
            topic: topic.trim(),
            presenter: presenter.trim(),
            notes,
            templateId: chosen?.id ?? "",
            startNow: now,
            date,
            time,
          });
          router.push(`${base}/${id}`);
        }}
        className="space-y-6"
      >
        <Card>
          <div className="space-y-4 p-5">
            <Chips
              value={when}
              options={[...WHEN]}
              onChange={setWhen}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {!single && (
                <Field label="Type" className="sm:col-span-2">
                  <select
                    value={kind}
                    onChange={(e) => {
                      setKind(e.target.value as MeetingKind);
                      setTemplateId("");
                    }}
                    className={field}
                  >
                    {kinds.map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field
                label={single ? "Topic" : "Subject"}
                className="sm:col-span-2"
              >
                <input
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  list={kind === "Toolbox talk" ? "talk-topics" : undefined}
                  className={field}
                  placeholder={
                    kind === "Toolbox talk"
                      ? "Choose or type a topic"
                      : kind === "Pre-start meeting"
                        ? "Level 3 pre-start"
                        : "Monthly WHS committee meeting"
                  }
                />
                <datalist id="talk-topics">
                  {TALK_TOPICS.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </Field>
              <Field label="Project">
                <select
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className={field}
                >
                  {!projectId && (
                    <option value="" disabled>
                      Choose a project
                    </option>
                  )}
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={kind === "Toolbox talk" || kind === "Pre-start meeting" ? "Presenter" : "Chair"}>
                <input
                  required
                  value={presenter}
                  onChange={(e) => setPresenter(e.target.value)}
                  className={field}
                />
              </Field>
              {!now && (
                <>
                  <Field label="Date">
                    <input
                      type="date"
                      required
                      min={todayISO()}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={field}
                    />
                  </Field>
                  <Field label="Time">
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className={field}
                    />
                  </Field>
                </>
              )}
              <Field
                label="Template"
                hint="what gets recorded"
                className="sm:col-span-2"
              >
                <select
                  value={chosen?.id ?? ""}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className={field}
                >
                  {tpls.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.isDefault ? " (default)" : ""}
                    </option>
                  ))}
                </select>
                {chosen && (
                  <span className="mt-1 block text-xs font-normal text-ink-soft">
                    {chosen.sections.reduce((n, x) => n + x.items.length, 0)}{" "}
                    items in {chosen.sections.length} section
                    {chosen.sections.length === 1 ? "" : "s"}.{" "}
                    <Link
                      href={`${base}/template`}
                      className="font-semibold underline"
                    >
                      Customise templates
                    </Link>
                  </span>
                )}
              </Field>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-accent/40 bg-accent/[0.07] px-4 py-3">
              <Sparkle />
              <p className="min-w-0 flex-1 text-xs text-ink-soft">
                {kind === "Toolbox talk"
                  ? "Write the talk from the topic and what has happened on this project recently."
                  : "Draft key points from the topic and recent site events."}{" "}
                {AI_NOTE}
              </p>
              <button
                type="button"
                disabled={ai.busy || topic.trim().length < 3}
                onClick={() => void draft()}
                className={aiBtn}
              >
                Draft
              </button>
              {ai.busy && <Busy label="Writing" />}
            </div>
            <AiProblem problem={ai.problem} />
            <Field
              label={kind === "Toolbox talk" ? "Key points" : "Notes or agenda"}
              hint="optional, you can add to it during the meeting"
              className="mt-3"
            >
              <textarea
                rows={notes ? 9 : 4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={field}
              />
            </Field>
          </div>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Link href={base} className={btnLight}>
            Cancel
          </Link>
          <button type="submit" disabled={!chosen} className={btnDark}>
            {now ? `Start ${label}` : `Schedule ${label}`}
          </button>
        </div>
      </form>
    </>
  );
}
