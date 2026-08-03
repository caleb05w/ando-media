"use client";

// Ando app mockups for the showcase deck, built from July Sprints.
//
//   ChannelWelcome  #calebs-agent-tests empty state       Figma 19015:81259
//   DmWelcome       private-DM empty state                Figma 19015:81402
//   OauthBefore     raw OAuth-handoff screenshot          Figma 19012:80166
//   OauthConnect    designed OAuth-handoff screen         Figma 19012:80167
//
// Both are static frames at their Figma canvas size, wrapped in <FitFrame> so
// a slide can scale them to whatever stage space it has. Icons are the exact
// exports from the Figma components (public/caleb-slides), placed at their
// exported leaf size inside the icon box the design gives them.

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

const ASSET = "/caleb-slides";

/* --------------------------------- fitting -------------------------------- */

/** Scales a fixed-size frame down (never up) to fit the available space. */
export function FitFrame({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      setScale(Math.min(1, w / width, h / height));
    });
    observer.observe(outer);
    return () => observer.disconnect();
  }, [width, height]);

  return (
    <div
      ref={outerRef}
      className="flex size-full items-center justify-center overflow-hidden"
    >
      <div
        className="shrink-0"
        style={{ width: width * scale, height: height * scale }}
      >
        <div
          className="origin-top-left"
          style={{ width, height, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- icons --------------------------------- */

/** An exported Figma asset centred in its designed icon box. Both the box and
    the leaf keep their exact Figma dimensions. */
function Icon({
  src,
  box,
  w,
  h,
}: {
  src: string;
  box: number;
  w: number;
  h: number;
}) {
  return (
    <span
      className="flex shrink-0 items-center justify-center"
      style={{ width: box, height: box }}
    >
      <img alt="" src={`${ASSET}/${src}`} style={{ width: w, height: h }} />
    </span>
  );
}

/* -------------------------------- composer -------------------------------- */

/** The message composer both views share: placeholder row, formatting
    toolbar, and the dimmed split send button. */
function Composer() {
  return (
    <div className="shrink-0 px-[16px] pb-[16px]">
      <div className="flex flex-col rounded-[12px] bg-white shadow-[0px_0px_0px_1px_rgba(81,76,71,0.12),0px_3px_3px_-1.5px_rgba(22,25,29,0.04),0px_8px_8px_-4px_rgba(22,25,29,0.03),0px_20px_24px_-4px_rgba(22,25,29,0.08)]">
        <div className="min-h-[70px] px-[20px] py-[16px]">
          <p className="text-[14px] leading-[20px] text-[#78716c]">
            Enter your message
          </p>
        </div>
        <div className="flex items-center justify-between p-[12px]">
          <div className="flex items-center">
            <span className="flex size-[28px] items-center justify-center rounded-[6px]">
              <Icon src="paperclip.svg" box={16} w={9.33} h={13.33} />
            </span>
            <span className="flex size-[28px] items-center justify-center rounded-[6px] text-[14px] leading-[20px] font-semibold text-[#58524e]">
              Aa
            </span>
            <span className="flex size-[28px] items-center justify-center rounded-[6px]">
              <Icon src="emoji.svg" box={16} w={13.33} h={13.33} />
            </span>
            <span className="flex size-[28px] items-center justify-center rounded-[6px]">
              <Icon src="gif.svg" box={14} w={11.67} h={9.33} />
            </span>
          </div>
          <div className="flex items-start">
            <span className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px_1px_1px_6px] bg-[#f5f5f4] opacity-55">
              <Icon src="send.svg" box={16} w={12.35} h={12.36} />
            </span>
            <span className="w-px" />
            <span className="flex h-[28px] w-[16px] items-center justify-center rounded-[1px_6px_6px_1px] bg-[#f5f5f4] opacity-55">
              <Icon src="chevron-down-2.svg" box={12} w={5} h={2.84} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- channel welcome ----------------------------- */

function OnboardingRow({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex w-full items-center gap-[16px] rounded-[10px] bg-[#f5f5f4] p-[16px]">
      <span className="flex size-[40px] shrink-0 items-center justify-center">
        {icon}
      </span>
      <div className="min-w-0 flex-1 text-[14px] leading-[20px]">
        <p className="font-medium text-[#1a1817]">{title}</p>
        <p className="text-[#58524e]">{body}</p>
      </div>
      <Icon src="chevron-right.svg" box={18} w={18} h={18} />
    </div>
  );
}

/** The fanned mini-cards glyph on the automations row — three 18×24 white
    cards, the outer pair rotated ±15°, each carrying a 10px icon. */
function AutomationCards() {
  const card =
    "absolute flex h-[24px] w-[18px] items-center justify-center rounded-[2px] bg-white shadow-[0px_0px_0px_1px_rgba(81,76,71,0.12),0px_3px_3px_-1.5px_rgba(22,25,29,0.04),0px_8px_8px_-4px_rgba(22,25,29,0.03),0px_20px_24px_-4px_rgba(22,25,29,0.08)]";
  return (
    <span className="relative block h-[40px] w-[40px]">
      <span
        className={`${card} top-[5px] left-[1px] -rotate-15`}
        style={{ transformOrigin: "center" }}
      >
        <Icon src="card-icon-2.svg" box={12} w={10} h={9.75} />
      </span>
      <span
        className={`${card} top-[5px] left-[21px] rotate-15`}
        style={{ transformOrigin: "center" }}
      >
        <Icon src="card-icon-1.svg" box={12} w={10} h={10} />
      </span>
      <span className={`${card} top-[-3px] left-[11px]`}>
        <Icon src="card-icon-3.svg" box={12} w={10} h={10} />
      </span>
    </span>
  );
}

export function ChannelWelcome() {
  return (
    <div className="flex h-[861px] w-[1110px] flex-col overflow-hidden bg-white font-sans">
      {/* Header */}
      <div className="flex h-[48px] min-h-[48px] items-center gap-[8px] border-b border-[#f0efee] px-[16px]">
        <div className="flex min-w-0 flex-1 items-center">
          <span className="-ml-[8px] flex h-[32px] items-center gap-[8px] rounded-[6px] px-[8px]">
            <Icon src="hash-header.svg" box={16} w={12} h={12} />
            <span className="text-[14px] leading-[20px] font-medium text-[#1a1817]">
              calebs-agent-tests
            </span>
          </span>
        </div>
        <div className="flex items-center gap-[4px]">
          <div className="flex items-start gap-px">
            <span className="flex h-[24px] w-[28px] items-center justify-center rounded-[6px_1px_1px_6px] bg-[#f5f5f4]">
              <Icon src="headphones-small.svg" box={16} w={12} h={12} />
            </span>
            <span className="flex h-[24px] w-[16px] items-center justify-center rounded-[1px_6px_6px_1px] bg-[#f5f5f4]">
              <Icon src="chevron-down.svg" box={12} w={5} h={2.84} />
            </span>
          </div>
          <span className="flex items-center gap-[6px] rounded-[8px] border border-[#f0efee] px-[9px] py-[5px]">
            <Icon src="users.svg" box={16} w={15.88} h={10.83} />
            <span className="text-[12px] leading-[16px] text-[#1a1817]">4</span>
          </span>
        </div>
      </div>

      {/* Messages area — welcome block pinned to the bottom like a fresh
          channel with no history. */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-end px-[16px] pb-[24px]">
        <div className="pb-[12px]">
          <span className="flex size-[32px] items-center justify-center rounded-[4px] bg-[#ebe9e8]">
            <Icon src="hash-welcome.svg" box={24} w={18} h={18} />
          </span>
        </div>
        <p className="text-[16px] leading-[20px] font-medium text-[#1a1817]">
          Welcome to #calebs-agent-tests!
        </p>
        <div className="flex w-[512px] flex-col gap-[12px] pt-[32px]">
          <OnboardingRow
            icon={
              <span className="relative block size-[28px]">
                {/* Off-centre in the Figma box: 16.25% left inset vs 8.34% right. */}
                <img
                  alt=""
                  src={`${ASSET}/person-add.svg`}
                  className="absolute top-[2.33px] left-[4.55px]"
                  style={{ width: 21.12, height: 23.33 }}
                />
              </span>
            }
            title="Add teammates"
            body="Invite other people and agents to the channel."
          />
          <OnboardingRow
            icon={<AutomationCards />}
            title="Setup channel automations"
            body="Post to the channel when events occur in other apps."
          />
          <OnboardingRow
            icon={<Icon src="headphones-green.svg" box={28} w={28} h={28} />}
            title="Start a jam"
            body="Hop into a voice call with others in this channel."
          />
        </div>
      </div>

      <Composer />
    </div>
  );
}

/* ------------------------------ OAuth handoff ----------------------------- */

/** The "before" — the raw CleanShot of the Linear OAuth handoff page. The
    Figma frame crops the top 121px of browser chrome off the 1512×982
    capture, so the crop is reproduced here rather than re-exported. */
export function OauthBefore() {
  return (
    <div className="relative h-[861px] w-[1512px] overflow-hidden bg-white">
      <img
        alt=""
        src={`${ASSET}/oauth-before.png`}
        className="absolute top-[-121px] left-0 max-w-none"
        style={{ width: 1512, height: 982 }}
      />
    </div>
  );
}

/** The designed version — app tiles shaking hands over a dot separator, the
    headline keeping its template placeholder from the Figma text layer. */
export function OauthConnect() {
  return (
    <div className="flex h-[861px] w-[1512px] items-center justify-center bg-white px-[24px] font-sans">
      <div className="flex w-[398px] flex-col items-center gap-[32px]">
        <div className="flex items-center justify-center gap-[6px]">
          <span className="flex size-[40px] items-center justify-center rounded-full bg-[#f5f5f4]">
            <img
              alt=""
              src={`${ASSET}/oauth-linear.svg`}
              style={{ width: 21.33, height: 21.33 }}
            />
          </span>
          <span className="flex items-center gap-[4px]">
            <span className="size-[2px] rounded-full bg-[#58524e]" />
            <span className="size-[2px] rounded-full bg-[#58524e]" />
            <span className="size-[2px] rounded-full bg-[#58524e]" />
          </span>
          <img
            alt=""
            src={`${ASSET}/oauth-app-tile.svg`}
            className="size-[40px]"
          />
        </div>
        <div className="flex w-full flex-col items-center gap-[8px]">
          <p className="text-center text-[24px] leading-[36px] font-medium text-[#1a1817]">
            {"Connecting {app name}"}
          </p>
          <div className="flex items-center justify-center gap-[8px]">
            {/* The arc reads as a loader, so it turns. */}
            <img
              alt=""
              src={`${ASSET}/oauth-spinner.svg`}
              className="animate-spin [animation-duration:1.2s]"
              style={{ width: 12.8, height: 12.8 }}
            />
            <p className="text-center text-[14px] leading-[20px] text-[#58524e]">
              Finishing the secure OAuth handoff...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- DM welcome ------------------------------- */

export function DmWelcome() {
  return (
    <div className="flex h-[813px] w-[1110px] flex-col overflow-hidden bg-white font-sans">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-end px-[32px] pb-[56px]">
        <div className="flex flex-col items-center gap-[16px]">
          {/* The design's avatar slot — an image fill in Figma, held as a
              plain disc here. */}
          <span className="size-[48px] rounded-full bg-[#f5f5f4]" />
          <div className="flex flex-col items-center gap-[6px]">
            <p className="text-[16px] leading-[20px] font-medium text-[#1a1817]">
              Welcome to your private DM!
            </p>
            <div className="flex items-center gap-[6px]">
              <Icon src="eye-closed.svg" box={16} w={16} h={16} />
              <p className="text-[14px] leading-[20px] text-[#58524e]">
                This is your spot! Only you can see it.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Composer />
    </div>
  );
}
