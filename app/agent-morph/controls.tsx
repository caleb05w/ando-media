"use client";

// The chip bar, top-left: which morph each mark arrives by, how a mark
// leaves, and whether the dots take its colour. The studio's timeline
// holds the beats; these hold the grammar. A morph another mark already
// arrives by, or one the film uses, can't be picked — variety is the rule.

import type { Variant } from "../agent-typing-experience/variants";
import { ARRIVALS, FACE_KEYS, FILM_KEYS, NAMES, TEMPOS, type FaceKey, type Leave, type Settings, type Start, type Via } from "./settings";

/** "Slingshot v2 · Knockback" as is; the v1 keepers get their version. */
const label = (v: Variant) => (v.group === "v1" ? `${v.title} v1` : v.group === "archive" ? `${v.title} · archive` : v.title);

function Chip({ on, off, title, onClick, children }: { on: boolean; off?: boolean; title?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={off}
      title={title}
      className={`rounded-full border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] transition-colors ${
        on
          ? "border-ando-fg-primary bg-ando-fg-primary text-white"
          : off
            ? "cursor-not-allowed border-black/5 bg-white/60 text-black/25 line-through"
            : "border-black/10 bg-white/80 text-ando-fg-primary hover:border-black/30"
      }`}
    >
      {children}
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="w-[68px] shrink-0 pt-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-black/40">{label}</span>
      <div className="flex max-w-[calc(100vw-120px)] flex-wrap gap-1">{children}</div>
    </div>
  );
}

export function Controls({ settings, onChange }: { settings: Settings; onChange: (patch: Partial<Settings>) => void }) {
  const leaves: Array<{ key: Leave; label: string }> = [
    { key: "melt", label: "Melt" },
    { key: "reverse", label: "Reverse" },
  ];
  const starts: Array<{ key: Start; label: string }> = [
    { key: "typing", label: "Typing dots" },
    { key: "dot", label: "A dot" },
  ];
  const vias: Array<{ key: Via; label: string }> = [
    { key: "dots", label: "The three dots" },
    { key: "dot", label: "One dot" },
  ];
  /** Who already arrives by `v`, if anyone but `face`. */
  const takenBy = (v: Variant, face: FaceKey) => FACE_KEYS.find((other) => other !== face && settings.arrive[other].key === v.key);
  return (
    <div className="pointer-events-auto fixed left-5 top-5 z-50 flex flex-col gap-1.5" data-am-controls>
      {FACE_KEYS.map((face) => (
        <Row key={face} label={`→ ${NAMES[face]}`}>
          {ARRIVALS.map((v) => {
            const taken = takenBy(v, face);
            const film = FILM_KEYS.has(v.key);
            return (
              <Chip
                key={v.key}
                on={settings.arrive[face].key === v.key}
                off={taken != null || film}
                title={film ? "The film's typing indicator — not a face's arrival" : taken ? `${NAMES[taken]} arrives by this` : undefined}
                onClick={() => onChange({ arrive: { ...settings.arrive, [face]: v } })}
              >
                {label(v)}
              </Chip>
            );
          })}
        </Row>
      ))}
      <Row label="born as">
        {starts.map((s) => (
          <Chip key={s.key} on={settings.start === s.key} onClick={() => onChange({ start: s.key })}>
            {s.label}
          </Chip>
        ))}
      </Row>
      <Row label="leave">
        {leaves.map((l) => (
          <Chip key={l.key} on={settings.leave === l.key} onClick={() => onChange({ leave: l.key })}>
            {l.label}
          </Chip>
        ))}
      </Row>
      <Row label="through">
        {vias.map((v) => (
          <Chip key={v.key} on={settings.via === v.key} onClick={() => onChange({ via: v.key })}>
            {v.label}
          </Chip>
        ))}
      </Row>
      <Row label="tempo">
        {TEMPOS.map((t) => (
          <Chip key={t} on={settings.tempo === t} onClick={() => onChange({ tempo: t })}>
            {t}×
          </Chip>
        ))}
      </Row>
      <Row label="tint">
        <Chip on={settings.tint} onClick={() => onChange({ tint: true })}>
          On
        </Chip>
        <Chip on={!settings.tint} onClick={() => onChange({ tint: false })}>
          Off
        </Chip>
      </Row>
    </div>
  );
}
