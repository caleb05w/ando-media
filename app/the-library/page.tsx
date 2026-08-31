import type { Metadata } from "next";

import AndoHiveDiagram from "./ando-hive-diagram";
import { ContextTraceCanvas } from "./context-trace";
import { FooterGlobeInstrument } from "./footer-globe-instrument";
import { NumbersDeck } from "./numbers-deck";
import OneLineBanner from "./one-line-banner";
import { LibraryShelf, type Piece } from "./shelf";
import { TypingShowcase } from "./typing-showcase";
import { UseCards } from "./use-cards";
import WorkspaceDiagram from "./workspace-diagram";
import { WorldCard } from "./world-card";
import "./the-library.css";

// /the-library — the homepage's media components on one shelf, each inside
// a white canvas card on the grey ground, after the Ando Brand "Body" frame.
// Two layouts, toggled from the header: a scroll-snapped carousel (the
// reference view) and a two-up grid. The components themselves live in this
// directory (the landing page imports them from here), so this page replaces
// the standalone workbench routes that used to wrap them: /slack-vs-ando,
// /ando-hive, /agent-context-trace, and the /comms-banner exploration whose
// solo take became the hero banner.

export const metadata: Metadata = {
  title: "the library",
};

const PIECES: Piece[] = [
  {
    label: "01",
    title: "One-line banner",
    home: "on /landing-page, the hero — solo take, facepile tray beneath",
    render: (
      <div className="lib-card lib-card--banner">
        <OneLineBanner mode="solo" />
      </div>
    ),
  },
  {
    label: "02",
    title: "Workspace diagram",
    home: "on /landing-page under “The current system is broken”",
    render: (
      <div className="lib-card lib-card--diagram">
        <WorkspaceDiagram />
      </div>
    ),
  },
  {
    label: "03",
    title: "Ando hive",
    home: "no homepage slot yet — shown in the diagram band it would get",
    render: (
      <div className="lib-card lib-card--diagram">
        <AndoHiveDiagram />
      </div>
    ),
  },
  {
    label: "04",
    title: "Agent typing indicator",
    home: "on /landing-page under “Our product focuses”, tenet 1",
    render: (
      <div className="lib-card lib-card--canvas">
        <TypingShowcase variantKey="orbit-v2" />
      </div>
    ),
  },
  {
    label: "05",
    title: "Context trace",
    home: "on /landing-page under “Our product focuses”, tenet 2",
    render: (
      <div className="lib-card lib-card--canvas">
        <ContextTraceCanvas />
      </div>
    ),
  },
  {
    label: "06",
    title: "Instrument globe",
    home: "the bezel take, whole — both hemispheres in frame (Brand 3678-9503); /affiliate keeps the horizon crop",
    render: (
      <div className="lib-card lib-card--canvas">
        <FooterGlobeInstrument />
      </div>
    ),
  },
  {
    label: "07",
    title: "Numbers deck",
    home: "was /affiliate’s “What Sara’s up to” drum — off the page, the hero stat row carries the numbers now",
    render: (
      <div className="lib-card lib-card--canvas">
        {/* the drum runs ~530px tall; scaled to sit whole inside the card */}
        <div className="origin-center scale-[0.72]">
          <NumbersDeck />
        </div>
      </div>
    ),
  },
  {
    label: "08",
    title: "The world",
    home: "the bubble and the ball on one canvas — toggle in the corner; the ball lives on whole at /claim",
    render: <WorldCard />,
  },
  {
    label: "09",
    title: "The uses",
    home: "was /affiliate-world’s ephemera shelf — the day printed small, off the page for the profile panel",
    render: (
      <div className="lib-card lib-card--canvas">
        <div className="origin-center scale-[0.6]">
          <UseCards />
        </div>
      </div>
    ),
  },
];

export default function TheLibrary() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] pb-24">
      <LibraryShelf pieces={PIECES} />
    </main>
  );
}
