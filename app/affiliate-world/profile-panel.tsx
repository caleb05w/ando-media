"use client";

import { Heading, Text, TextSize } from "@repo/design-system-ui/text";
import { useEffect, useRef, useState } from "react";

import { MiniAndo } from "../affiliate/mini-ando";
import "./profile-panel.css";

// The profile panel — click a face anywhere in the world and their
// page slides in from the right over a 20% scrim, the @sara grammar
// in a side sheet: who they are, then inside their Ando — the little
// computer boots a beat AFTER the sheet lands, so the world feels
// switched on rather than pre-rendered. Esc, the ×, or the scrim
// closes it; the sheet plays itself out before unmounting.

type Profile = { name: string; handle: string; bio: string; line: string };
const PROFILES: Record<string, Profile> = {
  sara: {
    name: "Sara",
    handle: "sara",
    bio: "Founder of a seed-stage comms startup. I think in examples, decide in diagrams, and keep the receipts.",
    line: "hey team - do we think we can still ship this thursday?",
  },
  oli: {
    name: "Oli",
    handle: "oli",
    bio: "Engineering at the same comms startup. Blockers first, everything else can wait.",
    line: "found the blocker — fix is up before standup",
  },
  aj: {
    name: "AJ",
    handle: "aj",
    bio: "Sales. Every update arrives with an owner attached.",
    line: "update's out. every line has an owner",
  },
  jordan: {
    name: "Jordan",
    handle: "jordan",
    bio: "Design. Turns Jams into flows before the standup.",
    line: "turned this morning's jam into a flow — look",
  },
  alex: {
    name: "Alex",
    handle: "alex",
    bio: "Ops. Keeps the launch dates honest.",
    line: "launch date holds. receipts in the thread",
  },
  andrew: {
    name: "Andrew",
    handle: "andrew",
    bio: "Growth. Ships the experiment before the debate ends.",
    line: "shipping the experiment today, debating after",
  },
  felipe: {
    name: "Felipe",
    handle: "felipe",
    bio: "Product. Writes the one-pager nobody has to reread.",
    line: "one-pager's up — nobody has to reread it",
  },
  ryan: {
    name: "Ryan",
    handle: "ryan",
    bio: "Engineering. The quietest Slack in the company.",
    line: "quiet day. three decisions, zero pings",
  },
  caleb: {
    name: "Caleb",
    handle: "caleb",
    bio: "Design engineering. The demo is the spec.",
    line: "demo's live — that's the spec",
  },
  "agent-1": {
    name: "Yumi",
    handle: "yumi",
    bio: "Resident agent. Joins the Jams, keeps the receipts, never sleeps.",
    line: "caught you up — 3 decisions while you were out",
  },
  "agent-2": {
    name: "Koji",
    handle: "koji",
    bio: "Resident agent. Files what the day decided, before the day ends.",
    line: "today's decisions are filed, sources linked",
  },
};

/** The roster's card for a person — shared with the hero's centre line. */
export function profileFor(person: string): Profile {
  return (
    PROFILES[person] ?? {
      name: person,
      handle: person,
      bio: "Building a working world in Ando.",
      line: "building a working world in Ando",
    }
  );
}

const EXIT_MS = 260;

/** A small chevron, pointing where the walk goes. */
function Chevron({ back = false }: { back?: boolean }) {
  return (
    <svg
      aria-hidden
      className={`shrink-0 text-text-tertiary transition-transform ease-fast ${
        back ? "rotate-180 group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"
      }`}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 16 16"
      width="16"
    >
      <path d="M6 3.5 L10.5 8 L6 12.5" />
    </svg>
  );
}

export function ProfilePanel({
  person,
  onClose,
  onVisit,
}: {
  person: string;
  onClose: () => void;
  /** Walk the worlds: the pinned footer steps to a neighbour. */
  onVisit?: (person: string) => void;
}) {
  const [closing, setClosing] = useState(false);
  const profile = profileFor(person);
  // The doors either side — roster order, wrapping around.
  const roster = Object.keys(PROFILES);
  const at = roster.indexOf(person);
  const prevPerson = roster[(at - 1 + roster.length) % roster.length];
  const nextPerson = roster[(at + 1) % roster.length];

  // the sheet plays its exit before the parent unmounts it
  const closingRef = useRef(false);
  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    window.setTimeout(onClose, EXIT_MS);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* the scrim — the page dims to 20% black; clicking it closes */}
      <button
        aria-label="Close profile"
        className={`awp-dim fixed inset-0 z-40 cursor-default ${closing ? "awp-dim--out" : ""}`}
        onClick={close}
        type="button"
      />
      <aside
        aria-label={`${profile.name}'s profile`}
        className={`awp-panel fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l-[0.5px] border-border-subtle bg-white shadow-[-24px_0_48px_rgba(22,25,29,0.08)] sm:w-[min(600px,92vw)] ${
          closing ? "awp-panel--out" : ""
        }`}
      >
        <button
          aria-label="Close"
          className="absolute right-5 top-5 z-10 flex size-8 items-center justify-center rounded-full text-text-tertiary transition-colors ease-fast hover:bg-surface-subtle hover:text-text-primary"
          onClick={close}
          type="button"
        >
          ×
        </button>

        {/* the page itself scrolls; the walk bar below stays put */}
        <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10">
        {/* who they are */}
        <div className="flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className="size-14 shrink-0 rounded-full object-cover shadow-[0_0_0_1px_rgba(28,25,23,0.06)]"
            src={`/avatars/${person}.png`}
          />
          <div className="min-w-0 pt-0.5">
            <span className="flex items-baseline gap-2">
              <Heading as="h2" size={TextSize.XL} weight="regular">
                {profile.name}
              </Heading>
              <Text as="span" color="tertiary" size={TextSize.Small}>
                @{profile.handle}
              </Text>
            </span>
            <Text className="mt-1.5" color="secondary" size={TextSize.Small}>
              {profile.bio}
            </Text>
          </div>
        </div>

        {/* inside their Ando */}
        <div className="mt-10">
          <Heading as="h3" size={TextSize.Large} weight="regular">
            Inside {profile.name}&apos;s Ando
          </Heading>
          <Text className="mt-3" color="secondary" size={TextSize.Small}>
            {profile.name} organizes Ando around product, customer feedback, and the people they work with most. Their
            agent joins the Jams and helps turn conversations into decisions.
          </Text>
          {/* the little computer brings its own use-case tray — and it
              boots a beat after the sheet lands */}
          <div className="awp-boot mt-6">
            <MiniAndo />
          </div>
        </div>
        </div>

        {/* the hall — pinned under the page, a door either side:
            face, name, chevron; no scrolling to find the way out */}
        {onVisit ? (
          <div className="flex shrink-0 items-center justify-between gap-3 border-t-[0.5px] border-border-subtle bg-white px-4 py-2.5">
            <button
              className="group flex min-w-0 items-center gap-2.5 rounded-[10px] px-2 py-1.5 transition-colors ease-fast hover:bg-surface-subtle"
              onClick={() => onVisit(prevPerson)}
              type="button"
            >
              <Chevron back />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                className="size-8 shrink-0 rounded-full object-cover shadow-[0_0_0_1px_rgba(28,25,23,0.06)]"
                src={`/avatars/${prevPerson}.png`}
              />
              <Text as="span" className="truncate font-medium" size={TextSize.Small}>
                {profileFor(prevPerson).name}
              </Text>
            </button>
            <button
              className="group flex min-w-0 items-center gap-2.5 rounded-[10px] px-2 py-1.5 transition-colors ease-fast hover:bg-surface-subtle"
              onClick={() => onVisit(nextPerson)}
              type="button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                className="size-8 shrink-0 rounded-full object-cover shadow-[0_0_0_1px_rgba(28,25,23,0.06)]"
                src={`/avatars/${nextPerson}.png`}
              />
              <Text as="span" className="truncate font-medium" size={TextSize.Small}>
                {profileFor(nextPerson).name}
              </Text>
              <Chevron />
            </button>
          </div>
        ) : null}
      </aside>
    </>
  );
}
