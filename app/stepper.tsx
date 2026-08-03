"use client";

// Stepper — ported from portfolio-v5/components/Stepper.js, reduced to the
// index row. That row IS the control: a hairline rule across the full width
// with fit-width labels resting on it, and an ink line under the selected one
// drawn as the tab's own bottom border overlapping the rule, so both weigh the
// same 1px. No numbers — position is carried by the line and by reading order,
// not by counting. Prev/next buttons would be a second way to do what the row
// already does, so there aren't any.
//
// The original also rendered the active step's body and media; here the caller
// owns what appears below, so only the row comes across. It scrolls sideways
// on narrow screens rather than wrapping, keeping the rule one continuous line.

export type Step = {
  value: string;
  label: string;
  /** Long form, surfaced on hover — the label stays short so the row fits. */
  title?: string;
};

export function Stepper({
  steps,
  active,
  onChange,
  ariaLabel,
}: {
  steps: Step[];
  active: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <div className="w-full overflow-x-auto pt-2 pb-3">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex w-full flex-row items-start gap-5 border-b border-[#e7e5e4]"
      >
        {steps.map((s) => {
          const selected = s.value === active;
          return (
            <button
              key={s.value}
              role="tab"
              type="button"
              aria-selected={selected}
              title={s.title}
              onClick={() => onChange(s.value)}
              className={`-mb-px w-fit cursor-pointer whitespace-nowrap border-b pb-[14px] text-left text-[13px] leading-5 transition-colors ease-fast ${
                selected
                  ? "border-[#1a1817] text-[#1a1817]"
                  : "border-transparent text-[#78716c] hover:text-[#1a1817]"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- weeks ---- */

/** Monday of the ISO week containing `iso` (a YYYY-MM-DD date). */
export function weekStart(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

/** "Jul 20" — short enough that six of them fit the row without scrolling. */
export function weekLabel(mondayIso: string): string {
  const d = new Date(`${mondayIso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** "Jul 20 – Jul 26", for the tab's title attribute. */
export function weekRange(mondayIso: string): string {
  const s = new Date(`${mondayIso}T00:00:00Z`);
  const e = new Date(s);
  e.setUTCDate(e.getUTCDate() + 6);
  const fmt = (x: Date) =>
    x.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  return `Week of ${fmt(s)} – ${fmt(e)}`;
}
