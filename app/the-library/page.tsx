import type { Metadata } from "next";

import AndoHiveDiagram from "./ando-hive-diagram";
import { BowtieLines, ConeLines, FanLines } from "./construction-lines";
import { ContextTraceCanvas } from "./context-trace";
import { FooterGlobeInstrument } from "./footer-globe-instrument";
import { CoilLines, OrbitLines, RingDialLines, RingLines, RingStackLines, SphereLines } from "./line-arts";
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
    title: "The sphere",
    home: "line art i — the wireframe dome, riders dimming behind it",
    render: (
      <div className="lib-card">
        <SphereLines />
      </div>
    ),
  },
  {
    label: "10",
    title: "The coil",
    home: "line art ii — a prolate cycloid, riders looping off the frame",
    render: (
      <div className="lib-card">
        <CoilLines />
      </div>
    ),
  },
  {
    label: "11",
    title: "The orbits",
    home: "line art iii — precessing rings, riders carried by both motions",
    render: (
      <div className="lib-card">
        <OrbitLines />
      </div>
    ),
  },
  {
    label: "12",
    title: "The ring",
    home: "line art iv — the hub and its orbit, spokes tracking the swarm",
    render: (
      <div className="lib-card">
        <RingLines />
      </div>
    ),
  },
  {
    label: "13",
    title: "The ring, timed",
    home: "iteration — the plate gone dark, timecodes ticking with the riders",
    render: (
      <div className="lib-card">
        <RingDialLines />
      </div>
    ),
  },
  {
    label: "14",
    title: "The rings",
    home: "iteration — three orbits of one system, rays cast through the riders",
    render: (
      <div className="lib-card">
        <RingStackLines />
      </div>
    ),
  },
  {
    label: "15",
    title: "The cone",
    home: "line art v — circles diminishing to the apex, a thread winding in",
    render: (
      <div className="lib-card">
        <ConeLines />
      </div>
    ),
  },
  {
    label: "16",
    title: "The bowtie",
    home: "line art vi — two-point perspective, a cursor running the circuit",
    render: (
      <div className="lib-card">
        <BowtieLines />
      </div>
    ),
  },
  {
    label: "17",
    title: "The fan",
    home: "line art vii — both wings sighting the spine, moiré drifting",
    render: (
      <div className="lib-card">
        <FanLines />
      </div>
    ),
  },
  {
    label: "18",
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
