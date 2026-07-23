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

/* ------------------------------- Ma set demos ------------------------------- */
/* Water & silence: mediums that wrap around or move within the avatar —
   ripples outside, a pool inside, light over the face, mist at the rim. */

function MWRipples() {
  return (
    <Bubble face={TADAO}>
      {[0, 1.25, 2.5].map((delay) => (
        <span key={delay} className="ma-ripple" style={{ animationDelay: `${delay}s` }} />
      ))}
    </Bubble>
  );
}

function MWWaterline() {
  return (
    <Bubble face={TADAO}>
      <span className="absolute inset-[2px] overflow-hidden rounded-full">
        <span className="ma-water" />
      </span>
    </Bubble>
  );
}

function MWCaustics() {
  return (
    <Bubble face={TADAO}>
      <span className="absolute inset-[2px] overflow-hidden rounded-full">
        <span className="ma-caustic-a" />
        <span className="ma-caustic-b" />
      </span>
    </Bubble>
  );
}

function MWDrift() {
  return (
    <span className="ma-drift inline-flex">
      <Bubble face={TADAO} />
    </span>
  );
}

function MWMist() {
  return (
    <Bubble face={TADAO}>
      <span className="ma-mist" />
    </Bubble>
  );
}

function MWPebbles() {
  return (
    <Bubble face={TADAO}>
      <span className="ma-orbit-a">
        <span className="ma-pebble" />
      </span>
      <span className="ma-orbit-b">
        <span className="ma-pebble" style={{ opacity: 0.65 }} />
      </span>
      <span className="ma-orbit-c">
        <span className="ma-pebble" style={{ opacity: 0.4 }} />
      </span>
    </Bubble>
  );
}

function MCStillWater() {
  return (
    <Bubble face={ANDO}>
      {[0, 0.9].map((delay) => (
        <span key={delay} className="ma-ripple-cease" style={{ animationDelay: `${delay}s` }} />
      ))}
      <span className="ma-settle absolute inset-0">
        <RingSvg color={GREEN} />
      </span>
    </Bubble>
  );
}

function MCDrop() {
  return (
    <Bubble face={ANDO}>
      <span
        className="ma-drop-fall absolute left-1/2 top-1/2 size-[4px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: GREEN }}
      />
      <span className="ma-drop-ripple" />
      <span className="ma-settle absolute inset-0">
        <RingSvg color={GREEN} />
      </span>
    </Bubble>
  );
}

function MCDiffusion() {
  return (
    <Bubble face={ANDO}>
      <span className="ma-diffuse absolute inset-0">
        <RingSvg color={GREEN} />
      </span>
    </Bubble>
  );
}

function MCBloom() {
  return (
    <Bubble face={ANDO}>
      <span className="ma-bloom" />
      <span className="ma-settle absolute inset-0">
        <RingSvg color={GREEN} />
      </span>
    </Bubble>
  );
}

function MCSun() {
  return (
    <Bubble face={ANDO} faceClassName="ma-brighten">
      <span className="absolute inset-[2px] overflow-hidden rounded-full">
        <span className="ma-sun" />
      </span>
      <span className="ma-settle absolute inset-0">
        <RingSvg color={GREEN} />
      </span>
    </Bubble>
  );
}

function MFBrokenSurface() {
  return (
    <Bubble face={YUMI}>
      <span className="ma-ripple-broken" />
      <span className="ma-ripple-broken" style={{ animationDelay: "0.7s" }} />
      <span className="ma-settle-red absolute inset-0">
        <RingSvg color={RED} />
      </span>
    </Bubble>
  );
}

function MFSink() {
  return (
    <span className="ma-sink inline-flex">
      <Bubble face={YUMI}>
        <span className="absolute inset-[2px] overflow-hidden rounded-full">
          <span className="ma-flood-rise" />
        </span>
        <span className="ma-settle-red absolute inset-0">
          <RingSvg color={RED} />
        </span>
      </Bubble>
    </span>
  );
}

function MFSediment() {
  return (
    <Bubble face={YUMI}>
      <span className="absolute inset-[2px] overflow-hidden rounded-full">
        {[
          ["ma-sediment-a", "42%", "34%", 0],
          ["ma-sediment-b", "58%", "30%", 0.4],
          ["ma-sediment-a", "66%", "42%", 0.9],
          ["ma-sediment-b", "34%", "44%", 1.3],
        ].map(([cls, left, top, delay], index) => (
          <span
            key={index}
            className={`${cls} absolute size-[2.5px] rounded-full`}
            style={{
              left: left as string,
              top: top as string,
              background: "rgba(153,63,63,0.8)",
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </span>
      <span className="ma-settle-red absolute inset-0">
        <RingSvg color={RED} />
      </span>
    </Bubble>
  );
}

function MFEclipse() {
  return (
    <Bubble face={YUMI}>
      <span className="absolute inset-[2px] overflow-hidden rounded-full">
        <span className="ma-eclipse" />
      </span>
      <span className="ma-settle-red absolute inset-0">
        <RingSvg color={RED} />
      </span>
    </Bubble>
  );
}

function MFEmber() {
  return (
    <Bubble face={YUMI}>
      <svg width={SIZE} height={SIZE} className="mi-spin absolute inset-0" aria-hidden>
        <circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          strokeWidth={2}
          strokeDasharray="3.2 3.8"
          strokeLinecap="round"
          className="ma-ember"
        />
      </svg>
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

// Set 1 · Ma — water & silence. Homage to Tadao Ando: negative space,
// silence as a design value. The movement lives at the threshold of
// noticing; completion is stillness, failure is a disturbance.
const MA_SECTIONS: Section[] = [
  {
    heading: "1 · Working",
    blurb: "A live surface — the water moves because something is underneath.",
    studies: [
      {
        title: "Ripples",
        source: "rain on still water · around",
        note: "Rings widen off the bubble and dissolve. The pace of falling rain — never urgent.",
        demo: <MWRipples />,
      },
      {
        title: "Waterline",
        source: "a pool inside · within",
        note: "The bubble holds water that gently sloshes. Effort as a quiet interior tide.",
        demo: <MWWaterline />,
      },
      {
        title: "Caustics",
        source: "sunlight through water · over",
        note: "Light patches drift across the face, as if seen through a stream. Barely there.",
        demo: <MWCaustics />,
      },
      {
        title: "Drift",
        source: "a leaf on water · the whole",
        note: "The bubble floats — slow bob, a hint of rotation. Alive without a single UI pixel.",
        demo: <MWDrift />,
      },
      {
        title: "Mist",
        source: "morning fog · at the rim",
        note: "A soft veil circles the rim on a nine-second walk. Presence you sense, not see.",
        demo: <MWMist />,
      },
      {
        title: "Stone garden",
        source: "raked gravel · orbital field",
        note: "Three pebbles on their own slow orbits — 12s, 17s, 23s — never aligning, never hurrying.",
        demo: <MWPebbles />,
      },
    ],
  },
  {
    heading: "2 · Completion",
    blurb: "Stillness is the payoff — the water simply stops moving.",
    studies: [
      {
        title: "Still water",
        source: "Ma · the pause as the event",
        note: "The working ripples cease, and green settles in like dye finding its level. No fanfare.",
        demo: <MCStillWater />,
      },
      {
        title: "Single drop",
        source: "one raindrop",
        note: "The answer arrives as a drop: it falls, one green ripple widens, the surface stills.",
        demo: <MCDrop />,
      },
      {
        title: "Diffusion",
        source: "ink in water",
        note: "The verdict resolves from blur to line — certainty arriving gradually, then all at once.",
        demo: <MCDiffusion />,
      },
      {
        title: "Bloom",
        source: "one exhale",
        note: "A soft green breath outward, then rest. The gentlest possible celebration.",
        demo: <MCBloom />,
      },
      {
        title: "Sun through",
        source: "clouds parting · over",
        note: "The face brightens for a moment as light passes — done as a change in weather.",
        demo: <MCSun />,
      },
    ],
  },
  {
    heading: "3 · Failure",
    blurb: "A disturbance of the calm — a stone dropped, not a siren.",
    studies: [
      {
        title: "Broken surface",
        source: "a stone in the pond",
        note: "One uneven ripple, and the water takes longer to still. Failure as disturbed symmetry.",
        demo: <MFBrokenSurface />,
      },
      {
        title: "Sink",
        source: "waterlogged · within",
        note: "The bubble takes on weight and rides lower; the interior floods a shade darker.",
        demo: <MFSink />,
      },
      {
        title: "Sediment",
        source: "silt settling · within",
        note: "Fine particles give up and settle at the bottom. The quietest possible bad news.",
        demo: <MFSediment />,
      },
      {
        title: "Eclipse",
        source: "a passing shadow · over",
        note: "A shadow slides across the face and stays. The light will return on rerun.",
        demo: <MFEclipse />,
      },
      {
        title: "Ember",
        source: "heat death · the ring itself",
        note: "The working ring cools — amber to red to ash — and no verdict line is ever drawn.",
        demo: <MFEmber />,
      },
    ],
  },
];

// Set 2 · Kinetic references (the earlier exploration, kept for contrast).
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

function SetHeader({
  title,
  blurb,
}: {
  title: string;
  blurb: React.ReactNode;
}) {
  return (
    <div className="mt-16 border-t pt-8 first:mt-10 first:border-t-0 first:pt-0" style={{ borderColor: STROKE_WEAK }}>
      <h2 className="text-[13px] font-medium leading-5" style={{ color: FG_PRIMARY }}>
        {title}
      </h2>
      <p className="mt-1 max-w-xl text-[12px] leading-[17px]" style={{ color: FG_TERTIARY }}>
        {blurb}
      </p>
    </div>
  );
}

function StudySections({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((section) => (
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
    </>
  );
}

export default function AgentInteractionsPage() {
  return (
    <div className="flex flex-1 justify-center bg-white">
      <main className="w-full max-w-4xl px-6 pb-24 pt-24">
        <h1 className="text-[14px] font-medium leading-5" style={{ color: FG_PRIMARY }}>
          Agent motion — state studies
        </h1>
        <p className="mt-2 max-w-xl text-[13px] leading-[18px]" style={{ color: FG_TERTIARY }}>
          Looping studies for the three run states in the corner-bubble grammar. Working
          treatments run continuously; completion and failure replay their transition on a
          cycle. Marked cards are what{" "}
          <span style={{ color: FG_SECONDARY }}>/agent-working</span> ships today.
        </p>

        <SetHeader
          title="Set 1 · Ma — water & silence"
          blurb={
            <>
              Homage to Tadao Ando: negative space, silence as a design value. Flowing water,
              ripples, weather — nothing that demands the eye. Completion is stillness;
              failure is a disturbance, not an alarm. Each source line names the medium:
              around the avatar, within it, over it, or at the rim.
            </>
          }
        />
        <StudySections sections={MA_SECTIONS} />

        <SetHeader
          title="Set 2 · Kinetic references"
          blurb="The earlier exploration — Dynamic Island, watchOS breathe, Chrome downloads. Louder language, kept for contrast."
        />
        <StudySections sections={SECTIONS} />
      </main>
    </div>
  );
}
