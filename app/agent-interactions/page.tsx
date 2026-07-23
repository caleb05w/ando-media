// /agent-interactions — motion studies for the three agent run states
// (working, completion, failure), in the corner-bubble grammar from
// /agent-working. Every demo is a pure-CSS loop: working treatments run
// continuously; completion/failure treatments replay their transition on
// a 4s cycle. Inspirations: Dynamic Island, watchOS breathe, Chrome
// downloads, Linear, classic squash-and-stretch.

import "./agent-interactions.css";

const P = "/agent-working";

const FG_PRIMARY = "#1a1817";
const FG_SECONDARY = "#58524e";
const FG_TERTIARY = "#78716c";
const STROKE_WEAK = "#f0efee";
const BG_TERTIARY = "#f5f5f4";

const AMBER = "#f59e0b";
const GREEN = "#16a34a";
const RED = "#dc2626";

// Ring geometry shared by every demo: 40px box, r=18.5, C≈117 (the CSS
// keyframes hardcode 117 — keep these in sync).
const SIZE = 40;
const C = SIZE / 2;
const R = 18.5;

/* ------------------------------ building blocks ---------------------------- */

function Face({ src, size = 28, className = "" }: { src: string; size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt=""
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

function RingSvg({
  color,
  dashed = false,
  className = "",
  dashArray,
  dashOffset,
}: {
  color: string;
  dashed?: boolean;
  className?: string;
  dashArray?: number;
  dashOffset?: number;
}) {
  return (
    <svg width={SIZE} height={SIZE} className={`absolute inset-0 ${className}`} aria-hidden>
      <circle
        cx={C}
        cy={C}
        r={R}
        fill="none"
        strokeWidth={2}
        stroke={color}
        strokeDasharray={dashed ? "3.2 3.8" : dashArray}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={dashArray != null ? `rotate(-90 ${C} ${C})` : undefined}
      />
    </svg>
  );
}

function Bubble({
  face,
  children,
  className = "",
  faceClassName = "",
}: {
  face: string;
  children?: React.ReactNode;
  className?: string;
  faceClassName?: string;
}) {
  return (
    <span className={`relative inline-flex ${className}`} style={{ width: SIZE, height: SIZE }}>
      {children}
      <span className="absolute inset-0 flex items-center justify-center">
        <Face src={face} className={faceClassName} />
      </span>
    </span>
  );
}

/* --------------------------------- working --------------------------------- */

const TADAO = `${P}/agent-2.png`;
const ANDO = `${P}/agent-1.png`;
const YUMI = `${P}/yumi.png`;

function WOrbit() {
  return (
    <Bubble face={TADAO}>
      <RingSvg color={AMBER} dashed className="mi-spin" />
    </Bubble>
  );
}

function WComet() {
  return (
    <Bubble face={TADAO}>
      <span className="mi-comet absolute inset-0 rounded-full" />
    </Bubble>
  );
}

function WHalo() {
  return (
    <Bubble face={TADAO} className="mi-halo rounded-full">
      <RingSvg color={AMBER} dashed className="mi-spin" />
    </Bubble>
  );
}

function WDots() {
  return (
    <span className="flex flex-col items-center gap-1.5">
      <Bubble face={TADAO}>
        <RingSvg color={AMBER} dashed />
      </Bubble>
      <span className="flex items-center gap-1">
        {[0, 0.15, 0.3].map((delay) => (
          <span
            key={delay}
            className="mi-dot size-[4px] rounded-full"
            style={{ background: AMBER, animationDelay: `${delay}s` }}
          />
        ))}
      </span>
    </span>
  );
}

function WSquish() {
  return (
    <span className="mi-squish inline-flex">
      <Bubble face={TADAO}>
        <RingSvg color={AMBER} dashed className="mi-spin" />
      </Bubble>
    </span>
  );
}

function WCrescent() {
  return (
    <Bubble face={TADAO}>
      <RingSvg color={AMBER} dashArray={117} dashOffset={117} className="mi-crescent" />
    </Bubble>
  );
}

/* -------------------------------- completion -------------------------------- */

function CSealPing() {
  return (
    <Bubble face={ANDO}>
      <RingSvg color={AMBER} dashed className="mi-dash-out" />
      <RingSvg color={GREEN} dashArray={117} dashOffset={117} className="mi-seal" />
      <span className="mi-ping absolute inset-0 rounded-full" />
    </Bubble>
  );
}

function CIsland() {
  return (
    <span
      className="mi-island flex h-10 items-center gap-2 overflow-hidden rounded-full bg-white"
      style={{ boxShadow: "0 0 0 0.75px #ebe9e8" }}
    >
      <Bubble face={ANDO} className="shrink-0">
        <RingSvg color={AMBER} dashed className="mi-dash-out" />
        <RingSvg color={GREEN} className="mi-ring-in" />
      </Bubble>
      <span
        className="mi-island-label whitespace-nowrap pr-3 text-[11px] font-medium leading-4"
        style={{ color: GREEN }}
      >
        Done · 9s
      </span>
    </span>
  );
}

function CCheck() {
  return (
    <Bubble face={ANDO} faceClassName="mi-face-dim">
      <RingSvg color={AMBER} dashed className="mi-dash-out" />
      <RingSvg color={GREEN} className="mi-ring-in" />
      <svg width={SIZE} height={SIZE} className="absolute inset-0" aria-hidden>
        <path
          d="M13 20.5l5.5 5.5 9-10.5"
          fill="none"
          stroke={GREEN}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={22}
          className="mi-check"
        />
      </svg>
    </Bubble>
  );
}

function CBurst() {
  return (
    <span className="relative inline-flex">
      <span className="mi-pop inline-flex">
        <Bubble face={ANDO}>
          <RingSvg color={AMBER} dashed className="mi-dash-out" />
          <RingSvg color={GREEN} className="mi-ring-in" />
        </Bubble>
      </span>
      {(["mi-burst-a", "mi-burst-b", "mi-burst-c", "mi-burst-d"] as const).map((cls) => (
        <span
          key={cls}
          className={`${cls} absolute left-1/2 top-1/2 size-[4px] -translate-x-1/2 -translate-y-1/2 rounded-full`}
          style={{ background: GREEN }}
        />
      ))}
    </span>
  );
}

function CFlood() {
  return (
    <Bubble face={ANDO}>
      <RingSvg color={AMBER} dashed className="mi-dash-out" />
      <RingSvg color={GREEN} className="mi-ring-in" />
      <span
        className="mi-flood absolute inset-[3px] rounded-full"
        style={{ background: GREEN }}
      />
    </Bubble>
  );
}

/* --------------------------------- failure ---------------------------------- */

function FShakeSeal() {
  return (
    <span className="mi-shake inline-flex">
      <Bubble face={YUMI}>
        <RingSvg color={AMBER} dashed className="mi-dash-out" />
        <RingSvg color={RED} dashArray={117} dashOffset={117} className="mi-seal-red" />
      </Bubble>
    </span>
  );
}

function FFlash() {
  return (
    <Bubble face={YUMI}>
      <RingSvg color={AMBER} dashed className="mi-dash-out" />
      <RingSvg color={RED} className="mi-flash" />
    </Bubble>
  );
}

function FDrop() {
  return (
    <span className="mi-drop inline-flex">
      <Bubble face={YUMI}>
        <RingSvg color={AMBER} dashed className="mi-dash-out" />
        <RingSvg color={RED} className="mi-ring-in" />
      </Bubble>
    </span>
  );
}

function FScatter() {
  return (
    <Bubble face={YUMI}>
      <span className="mi-scatter absolute inset-0">
        <RingSvg color={AMBER} dashed className="mi-spin" />
      </span>
      <RingSvg color={RED} dashArray={117} dashOffset={117} className="mi-seal-red" />
    </Bubble>
  );
}

function FHeartbeat() {
  return (
    <Bubble face={YUMI}>
      <RingSvg color={RED} className="mi-heartbeat" />
    </Bubble>
  );
}

/* ---------------------------------- board ----------------------------------- */

type Study = {
  title: string;
  source: string;
  note: string;
  demo: React.ReactNode;
  baseline?: boolean;
};

type Section = { heading: string; blurb: string; studies: Study[] };

const SECTIONS: Section[] = [
  {
    heading: "1 · Working",
    blurb: "Continuous motion — alive without demanding attention.",
    studies: [
      {
        title: "Orbit",
        source: "shipping baseline",
        note: "Dashed amber crawls at 5.5s — slow enough to ignore, alive at a glance.",
        demo: <WOrbit />,
        baseline: true,
      },
      {
        title: "Comet",
        source: "browser favicon spinners",
        note: "One bright head, fading tail. Reads as directed effort rather than idle spin.",
        demo: <WComet />,
      },
      {
        title: "Breathe halo",
        source: "watchOS Breathe",
        note: "A soft exhale off the rim. Calmer than rotation; visible even at tiny sizes.",
        demo: <WHalo />,
      },
      {
        title: "Metronome dots",
        source: "iMessage typing",
        note: "The typing tell relocated under the bubble — borrowed familiarity, no ring changes.",
        demo: <WDots />,
      },
      {
        title: "Idle squish",
        source: "Dynamic Island",
        note: "The container itself breathes — squash-and-stretch says organic, not mechanical.",
        demo: <WSquish />,
      },
      {
        title: "Crescent sweep",
        source: "Material indeterminate",
        note: "An arc grows, travels, collapses. Suggests progress without promising a percentage.",
        demo: <WCrescent />,
      },
    ],
  },
  {
    heading: "2 · Completion",
    blurb: "A landing, replayed every 4s: dashes out → moment → hold → reset.",
    studies: [
      {
        title: "Seal + ping",
        source: "shipping baseline · Chrome downloads",
        note: "The green ring draws itself shut, then a ping rolls off. Cause, then celebration.",
        demo: <CSealPing />,
        baseline: true,
      },
      {
        title: "Island expand",
        source: "Dynamic Island",
        note: "The bubble widens into a pill with the receipt — Done · 9s — then swallows it back.",
        demo: <CIsland />,
      },
      {
        title: "Check draw",
        source: "iOS success sheets",
        note: "A checkmark strokes itself over the dimmed face. The face yields to the verdict.",
        demo: <CCheck />,
      },
      {
        title: "Sparkle burst",
        source: "confetti, restrained",
        note: "Four particles and a pop — celebration at the edge of what the lab tolerates.",
        demo: <CBurst />,
      },
      {
        title: "Flood",
        source: "liquid fill",
        note: "Green washes outward through the face and recedes into the sealed ring.",
        demo: <CFlood />,
      },
    ],
  },
  {
    heading: "3 · Failure",
    blurb: "An interrupt, replayed every 4s. Failure should feel different in kind, not just in color.",
    studies: [
      {
        title: "Shake + seal",
        source: "shipping baseline",
        note: "A quick jolt as the red ring closes. The failure moment is physical, the aftermath still.",
        demo: <FShakeSeal />,
        baseline: true,
      },
      {
        title: "Double flash",
        source: "alarm strobes, tamed",
        note: "The ring lands with two hard blinks, then holds steady. Urgency without motion.",
        demo: <FFlash />,
      },
      {
        title: "Gravity drop",
        source: "squash-and-stretch posture",
        note: "The bubble lands heavy and sits 5px low while failed — dejection as layout.",
        demo: <FDrop />,
      },
      {
        title: "Scatter",
        source: "particle decay",
        note: "The working dashes blow apart and the solid red draws in behind them — effort visibly broke.",
        demo: <FScatter />,
      },
      {
        title: "Heartbeat",
        source: "cardiac monitors",
        note: "Lub-dub-pause on the settled state. Recognizable from the periphery without looking.",
        demo: <FHeartbeat />,
      },
    ],
  },
];

export default function AgentInteractionsPage() {
  return (
    <div className="flex flex-1 justify-center bg-white">
      <main className="w-full max-w-4xl px-6 pb-24 pt-24">
        <h1 className="text-[14px] font-medium leading-5" style={{ color: FG_PRIMARY }}>
          Agent motion — state studies
        </h1>
        <p className="mt-2 max-w-xl text-[13px] leading-[18px]" style={{ color: FG_TERTIARY }}>
          Sixteen looping studies for the three run states in the corner-bubble grammar.
          Working treatments run continuously; completion and failure replay their transition
          on a 4s cycle. Marked cards are what{" "}
          <span style={{ color: FG_SECONDARY }}>/agent-working</span> ships today.
        </p>

        {SECTIONS.map((section) => (
          <section key={section.heading} className="mt-12">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2
                className="text-[11px] font-medium uppercase leading-[14px] tracking-[1.1px]"
                style={{ color: FG_SECONDARY }}
              >
                {section.heading}
              </h2>
              <span className="text-[12px] leading-4" style={{ color: "#a8a29e" }}>
                {section.blurb}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {section.studies.map((study) => (
                <article
                  key={study.title}
                  className="flex flex-col overflow-hidden rounded-[10px] border-[0.5px]"
                  style={{ borderColor: STROKE_WEAK }}
                >
                  <div
                    className="flex h-28 items-center justify-center"
                    style={{ background: BG_TERTIARY }}
                  >
                    {study.demo}
                  </div>
                  <div className="flex flex-col gap-1 p-3">
                    <div className="flex items-center gap-1.5">
                      <h3
                        className="text-[13px] font-medium leading-4"
                        style={{ color: FG_PRIMARY }}
                      >
                        {study.title}
                      </h3>
                      {study.baseline ? (
                        <span
                          className="rounded-[4px] px-1 py-px text-[10px] font-medium leading-3"
                          style={{ background: BG_TERTIARY, color: FG_SECONDARY }}
                        >
                          shipping
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[11px] leading-4" style={{ color: "#a8a29e" }}>
                      {study.source}
                    </span>
                    <p className="text-[12px] leading-[17px]" style={{ color: FG_SECONDARY }}>
                      {study.note}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
