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

/* ------------------------------ hue study row ------------------------------ */
// The working hue, questioned: amber borrows caution semantics from a
// decade of dashboards. Same orbit, five temperaments — dash + motion
// already say "working"; the hue only sets the mood.

const SAGE = "#8aa48d";

const HUES: { name: string; hex: string; note: string }[] = [
  { name: "Amber", hex: "#f59e0b", note: "the inherited tell — reads caution, urgency" },
  { name: "Sage", hex: SAGE, note: "growth at work — kin to the green verdict" },
  { name: "Stone", hex: "#a8a29e", note: "ink & paper — motion alone carries the state" },
  { name: "River", hex: "#8fb0c4", note: "the water language, made literal" },
  { name: "Sand", hex: "#c9b18c", note: "warmth without the alarm" },
];

function HueRow() {
  return (
    <div
      className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5"
      style={{ color: FG_SECONDARY }}
    >
      {HUES.map((hue) => (
        <div
          key={hue.name}
          className="flex flex-col items-center gap-2.5 rounded-[10px] border-[0.5px] px-3 pb-3 pt-6 text-center"
          style={{ borderColor: STROKE_WEAK }}
        >
          <Bubble face={TADAO}>
            <RingSvg color={hue.hex} dashed className="mi-spin" />
          </Bubble>
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-medium leading-4" style={{ color: FG_PRIMARY }}>
              {hue.name}
            </span>
            <span className="text-[11px] leading-[15px]" style={{ color: "#a8a29e" }}>
              {hue.note}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ color systems ------------------------------- */
// Colors judged as a system, not swatches — each palette shows the full
// triad together, names what it borrows, and admits its tradeoff.

type ColorSystem = {
  name: string;
  philosophy: string;
  working: string;
  done: string;
  failed: string;
  tradeoff: string;
};

const COLOR_SYSTEMS: ColorSystem[] = [
  {
    name: "Inherited",
    philosophy: "Amber caution, green success, red error — the dashboard dialect everyone already reads.",
    working: "#f59e0b",
    done: "#16a34a",
    failed: "#dc2626",
    tradeoff: "Maximum legibility, zero identity — and working borrows urgency it doesn't mean.",
  },
  {
    name: "Garden",
    philosophy: "One botanical family: sage at work, deep green when it bears out, clay when it dries up.",
    working: SAGE,
    done: "#16a34a",
    failed: "#b08968",
    tradeoff: "Failure as drought, not blood. Sage and green sit close — form must carry the difference.",
  },
  {
    name: "Ink & weather",
    philosophy: "Chrome stays monochrome; color appears only when something becomes true. The verdict earns the ink.",
    working: "#a8a29e",
    done: "#16a34a",
    failed: "#57534e",
    tradeoff: "The most Ando. Failure reads as weight, not alarm — the word 'failed' must live in text nearby.",
  },
  {
    name: "River",
    philosophy: "Water works, growth completes, earth interrupts — three hue families that never touch.",
    working: "#8fb0c4",
    done: "#16a34a",
    failed: "#b08968",
    tradeoff: "Best color-vision separation of the four (blue/green/brown). Blue must stay muted or it reads 'info'.",
  },
];

function SystemCard({ system }: { system: ColorSystem }) {
  return (
    <div
      className="flex flex-col gap-3 rounded-[10px] border-[0.5px] p-4"
      style={{ borderColor: STROKE_WEAK }}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-[13px] font-medium leading-4" style={{ color: FG_PRIMARY }}>
          {system.name}
        </h3>
        <p className="text-[12px] leading-[17px]" style={{ color: FG_SECONDARY }}>
          {system.philosophy}
        </p>
      </div>
      <div
        className="flex items-center justify-around rounded-[8px] px-2 py-4"
        style={{ background: BG_TERTIARY }}
      >
        {(
          [
            ["working", system.working, true],
            ["done", system.done, false],
            ["failed", system.failed, false],
          ] as const
        ).map(([label, color, dashed]) => (
          <span key={label} className="flex flex-col items-center gap-1.5">
            <Bubble face={TADAO}>
              <RingSvg color={color} dashed={dashed} className={dashed ? "mi-spin" : ""} />
            </Bubble>
            <span className="text-[10px] leading-3" style={{ color: "#a8a29e" }}>
              {label}
            </span>
          </span>
        ))}
      </div>
      <p className="text-[11px] leading-[15px]" style={{ color: FG_TERTIARY }}>
        {system.tradeoff}
      </p>
    </div>
  );
}

/* ----------------------------- still set demos ------------------------------ */
// Calmer working states: no rotation, no dashes. How little motion can
// "thinking" survive on?

function SPulseDot() {
  return (
    <span className="relative inline-flex">
      <Bubble face={TADAO} />
      <span className="stl-pulse" />
    </span>
  );
}

function SUnderglow() {
  return (
    <span className="relative inline-flex">
      <Bubble face={TADAO} />
      <span className="stl-underglow" />
    </span>
  );
}

function STide() {
  return (
    <span className="relative inline-flex">
      <Bubble face={TADAO} />
      <span className="stl-tide" />
    </span>
  );
}

function SAura() {
  return (
    <Bubble face={TADAO}>
      <span className="stl-aura absolute inset-0">
        <RingSvg color={SAGE} />
      </span>
    </Bubble>
  );
}

function SGapBreath() {
  return (
    <span className="stl-gap inline-flex">
      <Bubble face={TADAO}>
        <RingSvg color={SAGE} className="stl-aura" />
      </Bubble>
    </span>
  );
}

function SStatic() {
  return (
    <Bubble face={TADAO}>
      <span className="absolute inset-0" style={{ opacity: 0.45 }}>
        <RingSvg color={SAGE} />
      </span>
    </Bubble>
  );
}

function SSundial() {
  return (
    <Bubble face={TADAO}>
      <span className="stl-sundial">
        <span className="stl-sundial-dot" />
      </span>
    </Bubble>
  );
}

function SInk() {
  return (
    <Bubble face={TADAO}>
      <span className="absolute inset-[2px] overflow-hidden rounded-full">
        <span className="stl-ink" style={{ left: "50%" }} />
      </span>
    </Bubble>
  );
}

/* ---------------------------- corner-cut demos ------------------------------ */
// Candidates auditioned inside a miniature of the real medium: the white
// main card's bottom-right, a composer seam, and an overlapping done
// neighbor. Judge scannability here, not on a gray stage.

function MiniCorner({ workingRing }: { workingRing?: React.ReactNode }) {
  return (
    <div
      className="relative h-24 w-44 overflow-hidden rounded-[10px] border-[0.5px] bg-white"
      style={{ borderColor: "#ebe9e8" }}
    >
      {/* composer seam */}
      <div
        className="absolute inset-x-3 bottom-3 h-6 rounded-[6px] border-[0.5px]"
        style={{ borderColor: STROKE_WEAK }}
      />
      <span className="absolute bottom-[18px] left-5 text-[8px]" style={{ color: "#d6d3d1" }}>
        Send a message…
      </span>
      {/* the stack: done neighbor + working candidate */}
      <div className="absolute bottom-[38px] right-3 flex items-center">
        <span className="inline-flex rounded-full" style={{ boxShadow: "0 0 0 3px white" }}>
          <Bubble face={ANDO}>
            <RingSvg color={GREEN} />
          </Bubble>
        </span>
        <span
          className="relative inline-flex rounded-full"
          style={{ marginLeft: -8, boxShadow: "0 0 0 3px white" }}
        >
          <Bubble face={TADAO}>{workingRing}</Bubble>
        </span>
      </div>
    </div>
  );
}

function CCSheenRing() {
  return <MiniCorner workingRing={<span className="cc-ring cc-sheen" />} />;
}

// Control: the identical ring, motionless. Does the sheen earn its place?
function CCStillRing() {
  return <MiniCorner workingRing={<span className="cc-ring" />} />;
}

// Mist — presence carried by atmosphere instead of geometry.
function CCMist() {
  return <MiniCorner workingRing={<span className="cc-mist" />} />;
}

// Comet — the Kinetic set's W2 in sage. Shipped as the working state.
function CCComet() {
  return <MiniCorner workingRing={<span className="cc-comet" />} />;
}

/* ------------------------------ gesture demos ------------------------------- */
// The moments between states — companionship as motion.

function GArrive() {
  return (
    <span className="relative inline-flex">
      <span className="mg-condense inline-flex">
        <Bubble face={TADAO} />
      </span>
      <span className="mg-droplet mg-droplet-a" />
      <span className="mg-droplet mg-droplet-b" />
      <span className="mg-droplet mg-droplet-c" />
    </span>
  );
}

function GAcknowledge() {
  // The hover zone is the demo itself, padded out to most of the stage.
  return (
    <span className="mg-hover -m-10 inline-flex p-10">
      <span className="mg-ack inline-flex">
        <Bubble face={TADAO}>
          <span className="mg-ack-ring absolute inset-0">
            <RingSvg color="#a8a29e" />
          </span>
        </Bubble>
      </span>
    </span>
  );
}

function GListen() {
  return (
    <span className="mg-hover -m-10 inline-flex p-10">
      <Bubble face={ANDO}>
        <span className="mg-listen-ring absolute inset-0">
          <RingSvg color="#a8a29e" dashed className="mi-spin" />
        </span>
        <span className="mg-listen-outer absolute inset-[-5px]">
          <svg width={SIZE + 10} height={SIZE + 10} aria-hidden>
            <circle
              cx={(SIZE + 10) / 2}
              cy={(SIZE + 10) / 2}
              r={(SIZE + 10) / 2 - 1}
              fill="none"
              strokeWidth={1}
              stroke="#a8a29e"
            />
          </svg>
        </span>
      </Bubble>
    </span>
  );
}

function GDeliver() {
  return (
    <span className="relative flex items-center gap-8">
      <Bubble face={ANDO}>
        <RingSvg color={GREEN} />
      </Bubble>
      <span
        className="mg-receive flex h-7 w-14 items-center rounded-[6px] border-[0.5px] px-2"
        style={{ borderColor: "#e7e5e4" }}
      >
        <span className="flex flex-col gap-1">
          <span className="h-[3px] w-9 rounded-full" style={{ background: "#e7e5e4" }} />
          <span className="h-[3px] w-6 rounded-full" style={{ background: "#efedec" }} />
        </span>
      </span>
      <span className="mg-mote" />
    </span>
  );
}

function GRest() {
  return (
    <span className="mg-rest inline-flex">
      <Bubble face={YUMI}>
        <span style={{ opacity: 0.5 }} className="absolute inset-0">
          <RingSvg color="#a8a29e" />
        </span>
      </Bubble>
    </span>
  );
}

function GDepart() {
  return (
    <span className="mg-depart inline-flex">
      <Bubble face={YUMI} />
    </span>
  );
}

/* ----------------------------- Outside set demos ---------------------------- */
// Companions in a landscape. Working states wear sage (or no hue);
// failure explores red-free weather.

function OWGrass() {
  return (
    <span className="relative inline-flex">
      <Bubble face={TADAO} />
      {[
        [4, 0],
        [12, 0.6],
        [26, 1.1],
        [33, 0.3],
      ].map(([left, delay]) => (
        <span
          key={left}
          className="mo-blade"
          style={{ left, animationDelay: `${delay}s` }}
        />
      ))}
    </span>
  );
}

function OWKoi() {
  return (
    <Bubble face={TADAO}>
      <span className="mo-koi">
        <span className="mo-koi-body" />
        <span className="mo-koi-tail" />
      </span>
    </Bubble>
  );
}

function OWFireflies() {
  return (
    <span className="relative inline-flex">
      <Bubble face={TADAO} />
      <span className="mo-fly mo-fly-a" style={{ top: -4, right: -6 }} />
      <span className="mo-fly mo-fly-b" style={{ bottom: -2, left: -7 }} />
      <span className="mo-fly mo-fly-c" style={{ top: 10, right: -10 }} />
    </span>
  );
}

function OWCloud() {
  return (
    <Bubble face={TADAO}>
      <span className="absolute inset-[2px] overflow-hidden rounded-full">
        <span className="mo-cloud" style={{ top: 6 }} />
        <span
          className="mo-cloud"
          style={{ top: 20, animationDuration: "12s", animationDelay: "-5s" }}
        />
      </span>
    </Bubble>
  );
}

function OWDapple() {
  return (
    <Bubble face={TADAO}>
      <span className="absolute inset-[2px] overflow-hidden rounded-full">
        <span className="mo-dapple-a" />
        <span className="mo-dapple-b" />
      </span>
    </Bubble>
  );
}

function OWSprout() {
  return (
    <Bubble face={TADAO}>
      <svg width={SIZE} height={SIZE} className="absolute inset-0" aria-hidden>
        <circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          strokeWidth={2}
          stroke={SAGE}
          strokeLinecap="round"
          strokeDasharray={117}
          className="mo-sprout"
          transform={`rotate(90 ${C} ${C})`}
        />
      </svg>
    </Bubble>
  );
}

function OCRipen() {
  return (
    <Bubble face={ANDO}>
      <svg width={SIZE} height={SIZE} className="absolute inset-0" aria-hidden>
        <circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={117}
          className="mo-ripen"
          transform={`rotate(90 ${C} ${C})`}
        />
      </svg>
    </Bubble>
  );
}

function OCPetals() {
  return (
    <span className="relative inline-flex">
      <Bubble face={ANDO}>
        <span className="ma-settle absolute inset-0">
          <RingSvg color={GREEN} />
        </span>
      </Bubble>
      <span className="mo-petal mo-petal-a" style={{ top: 2, left: 10 }} />
      <span className="mo-petal mo-petal-b" style={{ top: 0, left: 24 }} />
      <span
        className="mo-petal mo-petal-a"
        style={{ top: 4, left: 30, animationDelay: "0.5s" }}
      />
    </span>
  );
}

function OCGolden() {
  return (
    <Bubble face={ANDO} faceClassName="mo-golden">
      <span className="ma-settle absolute inset-0">
        <RingSvg color={GREEN} />
      </span>
    </Bubble>
  );
}

function OCClearing() {
  return (
    <Bubble face={ANDO} faceClassName="mo-unblur">
      <span className="mo-fog" />
      <span className="ma-settle absolute inset-0">
        <RingSvg color={GREEN} />
      </span>
    </Bubble>
  );
}

function OFWilt() {
  return (
    <Bubble face={YUMI}>
      <svg width={SIZE} height={SIZE} className="absolute inset-0" aria-hidden>
        <circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="40 77"
          className="mo-wilt"
        />
      </svg>
    </Bubble>
  );
}

function OFOvercast() {
  return (
    <Bubble face={YUMI} faceClassName="mo-graydim">
      <span className="mo-overcast" />
    </Bubble>
  );
}

function OFFrost() {
  return (
    <Bubble face={YUMI} faceClassName="mo-frost-face">
      <span className="mo-frost-ring absolute inset-0">
        <svg width={SIZE} height={SIZE} className="absolute inset-0" aria-hidden>
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            strokeWidth={2}
            stroke="#9db4c0"
            strokeLinecap="round"
            strokeDasharray="1.6 4.6"
          />
        </svg>
      </span>
    </Bubble>
  );
}

function OFLeaf() {
  return (
    <span className="mo-leaf inline-flex">
      <Bubble face={YUMI}>
        <span className="mo-leaf-ring absolute inset-0">
          <RingSvg color="#a8a29e" />
        </span>
      </Bubble>
    </span>
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

// Still — calmer working states. No rotation, no dashes; the question
// each study asks is how little motion "thinking" can survive on.
const STILL_SECTIONS: Section[] = [
  {
    heading: "Studies",
    blurb: "Every one is ring-free or motion-free — often both.",
    studies: [
      {
        title: "Pulse dot",
        source: "presence-dot grammar · at the base",
        note: "A single dot slowly waking and resting. Borrowed from the sidebar's own presence language — zero new vocabulary.",
        demo: <SPulseDot />,
      },
      {
        title: "Underglow",
        source: "warm ground · beneath",
        note: "A soft glow under the bubble, breathing. The agent hovers over its work; nothing on the avatar moves.",
        demo: <SUnderglow />,
      },
      {
        title: "Tide line",
        source: "breath meter · beneath",
        note: "A 2px line ebbing and flowing. Progress-shaped without promising progress.",
        demo: <STide />,
      },
      {
        title: "Aura",
        source: "the ring, un-dashed",
        note: "A full solid ring that only breathes in opacity — no rotation to track, nothing to count.",
        demo: <SAura />,
      },
      {
        title: "Breathing gap",
        source: "Ma, literally · the negative space",
        note: "The white gap-ring itself inhales and exhales. The emptiness around the agent is what's alive.",
        demo: <SGapBreath />,
      },
      {
        title: "Still ring",
        source: "zero continuous motion",
        note: "Working is wearing a faint sage ring at all — nothing moves except at transitions. The most radical stance.",
        demo: <SStatic />,
      },
      {
        title: "Sundial",
        source: "a revolution per minute · on the rim",
        note: "One mote drifting so slowly you only notice its position changed on the next glance. Motion you can never catch.",
        demo: <SSundial />,
      },
      {
        title: "Ink gather",
        source: "a thought condensing · within",
        note: "A soft smudge gathering and dispersing low in the bubble — the interior weather of thinking.",
        demo: <SInk />,
      },
    ],
  },
];

// Corner cut — the Still ideas that survive the two constraints
// (one-second scannability, bottom-right medium), auditioned in situ.
const CORNER_SECTIONS: Section[] = [
  {
    heading: "Finalist",
    blurb: "Working bubble on the right of the stack; judge at a glance.",
    studies: [
      {
        title: "Sheen ring",
        source: "constant presence, drifting light",
        note: "The ring is always fully drawn — working reads in a still frame, no pulse to catch. A denser stretch of sage drifts around the rim every 6s: no gaps, no hard edge, so it's a sheen and not a spinner.",
        demo: <CCSheenRing />,
      },
      {
        title: "Sheen ring · still",
        source: "the control",
        note: "The same ring with the drift switched off. Read the pair side by side: if this one already says working, the shimmer is decoration; if it goes inert next to the done neighbour, the drift is carrying its weight.",
        demo: <CCStillRing />,
      },
    ],
  },
  {
    heading: "Mist",
    blurb: "Drop the ring entirely: weather around the agent.",
    studies: [
      {
        title: "Mist",
        source: "the Ma set's morning fog, in sage",
        note: "No ring — the veil from the Ma set circles the rim on the same nine-second walk, lifted to the working hue with a touch more body for the white card. Frees the ring to mean only one thing: a verdict.",
        demo: <CCMist />,
      },
    ],
  },
  {
    heading: "Comet",
    blurb: "The Kinetic set's directed-effort orbit, in the working hue.",
    studies: [
      {
        title: "Comet",
        source: "the Kinetic set's W2, in sage — shipped",
        note: "One bright head, fading tail, on the same 1.6s orbit as the board original — directed effort, not idle spin. Now the working state on /agent-working, where it replaced the dashed ring.",
        demo: <CCComet />,
      },
    ],
  },
];

// Gestures — the companion lifecycle. Interaction moments rather than
// states: a coworker arrives, acknowledges, listens, delivers, rests,
// departs.
const GESTURE_SECTIONS: Section[] = [
  {
    heading: "Moments",
    blurb: "The space between states — where companionship actually lives.",
    studies: [
      {
        title: "Arrive",
        source: "condensation · spawn",
        note: "The bubble forms from gathered droplets — presence condenses rather than pops into place.",
        demo: <GArrive />,
      },
      {
        title: "Acknowledge",
        source: "a small bow · hover to play",
        note: "On invocation, one dip: it heard you. No text, no badge — a nod between coworkers.",
        demo: <GAcknowledge />,
      },
      {
        title: "Listen",
        source: "leaning in · hover to play",
        note: "While you address it the ring draws inward and a faint outer ear appears. It follows you, not a clock.",
        demo: <GListen />,
      },
      {
        title: "Deliver",
        source: "a mote settles into the message",
        note: "The answer leaves the agent as a single mote and the message accepts it with a brief warmth — handoff, not broadcast.",
        demo: <GDeliver />,
      },
      {
        title: "Rest",
        source: "presence without demand",
        note: "After the work: the slowest breath on the board, ring at half voice. Nearby, not gone.",
        demo: <GRest />,
      },
      {
        title: "Depart",
        source: "mist rises",
        note: "Dismissed, it becomes weather and leaves upward. Departure should feel like release, not deletion.",
        demo: <GDepart />,
      },
    ],
  },
];

// Outside — companions in a landscape. Working wears sage or no hue at
// all; completion is a change in the light; failure is weather.
const OUTSIDE_SECTIONS: Section[] = [
  {
    heading: "1 · Working",
    blurb: "A companion at work nearby — nature carries the signal.",
    studies: [
      {
        title: "Grass",
        source: "wind through a field · at the base",
        note: "Blades sway out of phase at the bubble's feet. Work as a light breeze, never a gale.",
        demo: <OWGrass />,
      },
      {
        title: "Koi",
        source: "a pond circuit · around",
        note: "One glide around the rim, speed pulsing like a fish — unhurried, but unmistakably alive.",
        demo: <OWKoi />,
      },
      {
        title: "Fireflies",
        source: "dusk companions · around",
        note: "Three lights wander and blink on their own clocks. Organic where the metronome was mechanical.",
        demo: <OWFireflies />,
      },
      {
        title: "Cloud shadow",
        source: "weather overhead · over",
        note: "Bright bands cross the face like clouds over ground. The day is passing; someone is working through it.",
        demo: <OWCloud />,
      },
      {
        title: "Dappled shade",
        source: "under a tree · over",
        note: "Leaf shadows shift on the face. The stillest working state on the board — light doing the moving.",
        demo: <OWDapple />,
      },
      {
        title: "Sprout",
        source: "growth · the ring itself",
        note: "A sage arc grows from the base and eases back, never closing the circle on its own — that's completion's job.",
        demo: <OWSprout />,
      },
    ],
  },
  {
    heading: "2 · Completion",
    blurb: "The work bears out — a change in the light, not a chime.",
    studies: [
      {
        title: "Ripen",
        source: "sprout, concluded",
        note: "The growing arc closes the circle and deepens sage → green. Work and verdict are one gesture.",
        demo: <OCRipen />,
      },
      {
        title: "Petal fall",
        source: "a blossom lets go",
        note: "Petals drift down past the bubble as the ring settles. The tree doesn't announce the fruit.",
        demo: <OCPetals />,
      },
      {
        title: "Golden hour",
        source: "the light warms",
        note: "The face goes warm for a moment, then true. Done as late-afternoon light.",
        demo: <OCGolden />,
      },
      {
        title: "Clearing",
        source: "fog lifts",
        note: "The veil dissolves and the face comes crisp — the answer is the visibility itself.",
        demo: <OCClearing />,
      },
    ],
  },
  {
    heading: "3 · Failure",
    blurb: "Red-free experiments — failure as weather, not verdict.",
    studies: [
      {
        title: "Wilt",
        source: "growth interrupted",
        note: "The sage arc slumps and dries to clay. You know before you read a word.",
        demo: <OFWilt />,
      },
      {
        title: "Overcast",
        source: "the weather closes in",
        note: "Gray settles over the face and stays. The roster text says failed; the face just says later.",
        demo: <OFOvercast />,
      },
      {
        title: "First frost",
        source: "cold snap",
        note: "The face pales and a fine crystalline ring forms — stopped mid-motion, preserved, waiting for a thaw.",
        demo: <OFFrost />,
      },
      {
        title: "Fallen leaf",
        source: "quiet weight",
        note: "The bubble detaches and sways down to rest low. Gravity-drop from the kinetic set, translated into nature.",
        demo: <OFLeaf />,
      },
    ],
  },
];

// Ma — water & silence. Homage to Tadao Ando: negative space, silence as
// a design value. The movement lives at the threshold of noticing;
// completion is stillness, failure is a disturbance.
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
          title="Color intent"
          blurb={
            <>
              Amber is inherited from a decade of dashboards, where yellow means caution —
              urgency is exactly the wrong thing to invoke for a companion quietly at work.
              Three principles govern everything here: <em>color budget</em> (the chrome
              stays monochrome; hue is spent on state alone), <em>the verdict earns the
              ink</em> (the strongest color belongs to the truest moment), and{" "}
              <em>never hue alone</em> (dash, form, and motion carry the state too — the
              done-green / failed-red pair is a classic color-vision collision, so shape
              must always be sufficient by itself).
            </>
          }
        />
        <HueRow />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {COLOR_SYSTEMS.map((system) => (
            <SystemCard key={system.name} system={system} />
          ))}
        </div>

        <SetHeader
          title="Still — calmer working states"
          blurb={
            <>
              The spinning dashed ring — even sage, even slow — is still machinery. Eight
              studies with no rotation and no dashes, asking how little motion
              &ldquo;thinking&rdquo; can survive on. The bar each must clear: legible at
              34px, distinguishable from idle and done, ignorable on purpose.
            </>
          }
        />
        <StudySections sections={STILL_SECTIONS} />

        <SetHeader
          title="Corner cut — auditioned in the medium"
          blurb={
            <>
              Two constraints applied to the Still set: clearly scannable in a second, and
              at home in the bottom-right. Two answers auditioned in a miniature of the
              real corner — white card, composer seam, an overlapping done neighbor: a
              ring that never leaves, and no ring at all, only weather.
            </>
          }
        />
        <StudySections sections={CORNER_SECTIONS} />

        <SetHeader
          title="Gestures — the companion lifecycle"
          blurb={
            <>
              Agents as coworkers means the moments between states deserve motion too:
              arriving, acknowledging, listening, delivering, resting, departing. Two
              studies respond to hover — a gesture is a response, not a loop.
            </>
          }
        />
        <StudySections sections={GESTURE_SECTIONS} />

        <SetHeader
          title="Outside — a landscape of companions"
          blurb={
            <>
              From the brief: you&apos;re outside, revelling in nature — agents as working
              companions, intentional tools. Working states wear sage (growth) or no hue at
              all; completion is a change in the light; failure is weather, explored
              red-free.
            </>
          }
        />
        <StudySections sections={OUTSIDE_SECTIONS} />

        <SetHeader
          title="Ma — water & silence"
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
          title="Kinetic references"
          blurb="The earliest exploration — Dynamic Island, watchOS breathe, Chrome downloads. Louder language, kept for contrast."
        />
        <StudySections sections={SECTIONS} />
      </main>
    </div>
  );
}
