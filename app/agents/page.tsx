"use client";

// /agents — the Agents directory from July Sprints (Figma 18545:114331),
// with a Table / Cards switch. The table is the Figma frame as designed. The
// cards translate each row into a tile: Fizz's card grammar (avatar with a
// status dot, kebab in the corner) used lightly, with the bulkier row data —
// channel chips, connected apps, created-by — given labelled sections instead
// of being crammed onto one line.

import Image from "next/image";
import { useState } from "react";

/* ---------------------------------- icons --------------------------------- */
// Exact path data from the Figma exports.

function AgentMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect width="24" height="24" rx="4" fill="#F5F5F4" />
      <path
        d="M10.74 13.4V14.2741C10.74 14.3484 10.7105 14.4196 10.658 14.4721L7.73179 17.3983C7.67711 17.453 7.58847 17.453 7.5338 17.3983L6.74181 16.6063C6.68713 16.5516 6.68713 16.463 6.74181 16.4083L9.66815 13.482C9.72066 13.4295 9.79188 13.4 9.86614 13.4H10.74Z"
        fill="#2563EB"
      />
      <path d="M12.84 11.3H13.8303L11.44 13.6901V12.7H10.4502L12.84 10.3101V11.3Z" fill="#2563EB" />
      <path
        d="M17.4333 7.49889C17.488 7.55356 17.488 7.64221 17.4333 7.69688L14.6123 10.5179C14.5598 10.5705 14.4885 10.6 14.4143 10.6H13.54V9.72609C13.54 9.65183 13.5695 9.58061 13.622 9.5281L16.4433 6.70689C16.498 6.65222 16.5867 6.65222 16.6413 6.7069L17.4333 7.49889Z"
        fill="#2563EB"
      />
      <path
        d="M18.86 11.3H5.14C5.06268 11.3 5 11.3627 5 11.44V12.56C5 12.6373 5.06268 12.7 5.14 12.7H18.86C18.9373 12.7 19 12.6373 19 12.56V11.44C19 11.3627 18.9373 11.3 18.86 11.3Z"
        fill="#2563EB"
      />
      <path
        d="M11.44 5.14V18.86C11.44 18.9373 11.5027 19 11.58 19H12.7C12.7773 19 12.84 18.9373 12.84 18.86V5.14C12.84 5.06268 12.7773 5 12.7 5H11.58C11.5027 5 11.44 5.06268 11.44 5.14Z"
        fill="#2563EB"
      />
      <path
        d="M7.73182 6.7069L17.4333 16.4083C17.488 16.463 17.488 16.5517 17.4333 16.6063L16.6414 17.3983C16.5867 17.453 16.4981 17.453 16.4434 17.3983L6.74187 7.69684C6.6872 7.64217 6.6872 7.55353 6.74187 7.49885L7.53383 6.7069C7.58851 6.65222 7.67715 6.65222 7.73182 6.7069Z"
        fill="#2563EB"
      />
    </svg>
  );
}

function IconHashtag() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.15681 1.75322C5.39668 1.7823 5.56756 2.00032 5.53849 2.24018L5.31507 4.08338H9.39202L9.62815 2.1349C9.65726 1.89503 9.87525 1.72414 10.1151 1.75322C10.355 1.7823 10.5259 2.00032 10.4968 2.24018L10.2734 4.08338H11.8125C12.0541 4.08338 12.25 4.27925 12.25 4.52088C12.25 4.7625 12.0541 4.95838 11.8125 4.95838H10.1673L9.67237 9.04172H11.8125C12.0541 9.04172 12.25 9.23761 12.25 9.47922C12.25 9.72084 12.0541 9.91672 11.8125 9.91672H9.56632L9.33018 11.8652C9.30107 12.105 9.08308 12.276 8.84322 12.2468C8.60329 12.2178 8.43243 11.9997 8.46148 11.7599L8.6849 9.91672H4.608L4.37182 11.8652C4.34275 12.105 4.12473 12.276 3.88485 12.2468C3.64499 12.2178 3.47411 11.9997 3.50318 11.7599L3.7266 9.91672H2.1875C1.94588 9.91672 1.75 9.72084 1.75 9.47922C1.75 9.23761 1.94588 9.04172 2.1875 9.04172H3.83266L4.3276 4.95838H2.1875C1.94588 4.95838 1.75 4.7625 1.75 4.52088C1.75 4.27925 1.94588 4.08338 2.1875 4.08338H4.43367L4.66985 2.1349C4.69892 1.89503 4.91694 1.72414 5.15681 1.75322ZM5.20901 4.95838L4.71406 9.04172H8.79101L9.28597 4.95838H5.20901Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconKebab() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      {[2.50065, 8.00065, 13.5007].map((cx) => (
        <circle key={cx} cx={cx} cy="7.99967" r="1.1" fill="#635D58" />
      ))}
    </svg>
  );
}

function IconLinear({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.14705 13.3828C6.12035 13.2689 6.25595 13.1972 6.33862 13.2799L10.7201 17.6614C10.8028 17.744 10.7311 17.8796 10.6173 17.8529C8.40618 17.3342 6.66574 15.5938 6.14705 13.3828ZM6.00023 11.6267C5.99811 11.6607 6.01089 11.6939 6.03497 11.7179L12.2821 17.965C12.3061 17.9891 12.3393 18.0019 12.3733 17.9998C12.6576 17.9821 12.9365 17.9446 13.2088 17.8886C13.3006 17.8698 13.3324 17.7571 13.2662 17.6909L6.30911 10.7338C6.24289 10.6676 6.13018 10.6995 6.11134 10.7912C6.05542 11.0635 6.01793 11.3424 6.00023 11.6267ZM6.50531 9.56465C6.48533 9.60951 6.49551 9.66192 6.53023 9.69665L14.3033 17.4698C14.3381 17.5045 14.3905 17.5147 14.4353 17.4947C14.6497 17.3992 14.8574 17.2916 15.0576 17.1726C15.1238 17.1332 15.1341 17.0422 15.0796 16.9877L7.01228 8.92041C6.95779 8.86591 6.86675 8.87614 6.82739 8.94239C6.70843 9.1426 6.60078 9.35032 6.50531 9.56465ZM7.51904 8.16888C7.47463 8.12447 7.47188 8.05324 7.51373 8.00639C8.61354 6.77512 10.2134 6 11.9942 6C15.3111 6 18 8.68888 18 12.0058C18 13.7866 17.2249 15.3865 15.9936 16.4863C15.9468 16.5281 15.8755 16.5254 15.8311 16.481L7.51904 8.16888Z"
        fill="#1A1817"
      />
    </svg>
  );
}

function IconGithub({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 6C15.315 6 18 8.75291 18 12.1518C17.9997 13.4407 17.6051 14.6971 16.8719 15.7441C16.1386 16.7911 15.1036 17.576 13.9125 17.9882C13.6125 18.0498 13.5 17.8575 13.5 17.696C13.5 17.4884 13.5075 16.8271 13.5075 16.0043C13.5075 15.4276 13.32 15.0585 13.1025 14.8662C14.4375 14.7124 15.84 14.1895 15.84 11.8288C15.84 11.1521 15.6075 10.6061 15.225 10.1755C15.285 10.0217 15.495 9.39116 15.165 8.54529C15.165 8.54529 14.6625 8.37612 13.515 9.17584C13.035 9.03743 12.525 8.96822 12.015 8.96822C11.505 8.96822 10.995 9.03743 10.515 9.17584C9.3675 8.38381 8.865 8.54529 8.865 8.54529C8.535 9.39116 8.745 10.0217 8.805 10.1755C8.4225 10.6061 8.19 11.1598 8.19 11.8288C8.19 14.1818 9.585 14.7124 10.92 14.8662C10.7475 15.02 10.59 15.2892 10.5375 15.689C10.1925 15.8505 9.33 16.112 8.79 15.1815C8.6775 14.997 8.34 14.5433 7.8675 14.551C7.365 14.5586 7.665 14.8432 7.875 14.9585C8.13 15.1046 8.4225 15.6506 8.49 15.8274C8.61 16.1735 9 16.8348 10.5075 16.5503C10.5075 17.0655 10.515 17.5499 10.515 17.696C10.515 17.8575 10.4025 18.0421 10.1025 17.9882C8.90748 17.5804 7.86805 16.7971 7.13167 15.7495C6.39529 14.7019 5.99934 13.4431 6 12.1518C6 8.75291 8.685 6 12 6Z"
        fill="#1A1817"
      />
    </svg>
  );
}

function IconMagnifier() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M13.3333 13.3333L10.751 10.751M10.751 10.751C11.6257 9.87633 12.1667 8.668 12.1667 7.33333C12.1667 4.66396 10.0027 2.5 7.33333 2.5C4.66396 2.5 2.5 4.66396 2.5 7.33333C2.5 10.0027 4.66396 12.1667 7.33333 12.1667C8.668 12.1667 9.87633 11.6257 10.751 10.751Z"
        stroke="#928C88"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3.83398 6.33301L8.00065 10.4997L12.1673 6.33301"
        stroke="#1A1817"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPlus({ color = "white" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 2C8.27613 2 8.5 2.22386 8.5 2.5V7.5H13.5C13.7761 7.5 14 7.72387 14 8C14 8.27613 13.7761 8.5 13.5 8.5H8.5V13.5C8.5 13.7761 8.27613 14 8 14C7.72387 14 7.5 13.7761 7.5 13.5V8.5H2.5C2.22386 8.5 2 8.27613 2 8C2 7.72387 2.22386 7.5 2.5 7.5H7.5V2.5C7.5 2.22386 7.72387 2 8 2Z"
        fill={color}
      />
    </svg>
  );
}

/* ---------------------------------- data ---------------------------------- */

type App = "linear" | "github";

type Agent = {
  id: string;
  name: string;
  external?: boolean;
  channels: string[];
  apps: App[];
  createdBy: string;
  enabled: boolean;
};

const AGENTS: Agent[] = [
  {
    id: "open-claw",
    name: "Caleb’s open claw",
    external: true,
    channels: ["general", "design", "eng", "launch", "support"],
    apps: [],
    createdBy: "Oli",
    enabled: true,
  },
  {
    id: "ando",
    name: "Ando",
    channels: ["general", "user-testing", "eng", "growth", "launch"],
    apps: [],
    createdBy: "Oli",
    enabled: true,
  },
  {
    id: "olis-agent",
    name: "Oli’s agent",
    channels: ["general", "user-testing", "design", "growth", "support"],
    apps: ["linear", "github"],
    createdBy: "Oli",
    enabled: true,
  },
  {
    id: "hermes",
    name: "Caleb’s hermes",
    external: true,
    channels: ["general", "design", "eng", "growth", "launch"],
    apps: ["linear", "github"],
    createdBy: "Oli",
    enabled: true,
  },
];

const APP_ICON: Record<App, (props: { size?: number }) => React.ReactNode> = {
  linear: IconLinear,
  github: IconGithub,
};

/* -------------------------------- fragments -------------------------------- */

function ExternalBadge() {
  return (
    <span className="flex h-[18px] shrink-0 items-center rounded-full bg-[#f5f5f4] px-[6px] text-[11px] leading-[14px] font-medium text-[#2563eb]">
      External
    </span>
  );
}

function ChannelChip({ name }: { name: string }) {
  return (
    <span className="flex h-[20px] shrink-0 items-center gap-px rounded-[4px] bg-[#f5f5f4] px-[3px] text-[#1a1817]">
      <IconHashtag />
      <span className="px-[2px] text-[12px] leading-[16px]">{name}</span>
    </span>
  );
}

function MoreChip({ count }: { count: number }) {
  return (
    <span className="flex h-[20px] shrink-0 items-center rounded-[4px] bg-[#f5f5f4] px-[4px] text-[12px] leading-[16px] text-[#635d58]">
      +{count}
    </span>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={`h-[16px] w-[28px] shrink-0 rounded-full p-[2px] transition-colors ease-fast ${
        on ? "bg-[#2563eb]" : "bg-[#d6d3d1]"
      }`}
    >
      <span
        className={`block size-[12px] rounded-full bg-white transition-transform ease-fast ${
          on ? "translate-x-[12px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function CreatedBy({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-[8px]">
      <Image
        src="/agents/oli.png"
        alt=""
        width={16}
        height={16}
        className="rounded-full"
      />
      <span className="text-[12px] leading-[16px] text-[#1a1817]">{name}</span>
    </span>
  );
}

function AppStack({ apps, size = 20 }: { apps: App[]; size?: number }) {
  return (
    <span className="flex items-center">
      {apps.map((app, i) => {
        const Icon = APP_ICON[app];
        return (
          <span
            key={app}
            className={`flex items-center justify-center rounded-full border-2 border-white bg-[#f5f5f4] ${
              i > 0 ? "-ml-[4px]" : ""
            }`}
            style={{ width: size, height: size }}
          >
            <Icon size={size} />
          </span>
        );
      })}
    </span>
  );
}

/* ---------------------------------- page ---------------------------------- */

type View = "table" | "cards";

export default function AgentsPage() {
  const [view, setView] = useState<View>("cards");
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(AGENTS.map((a) => [a.id, a.enabled])),
  );

  const toggle = (id: string) => setEnabled((e) => ({ ...e, [id]: !e[id] }));

  return (
    <div className="flex flex-1 justify-center bg-white">
      <main className="w-full max-w-[1126px] px-8 pt-16 pb-24">
        <h1 className="text-[20px] leading-[28px] font-medium text-[#1a1817]">
          Agents
        </h1>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex w-[309px] items-start gap-[12px]">
            <div className="flex h-[32px] flex-1 items-center justify-between rounded-[6px] border-[0.5px] border-[#ebe9e8] bg-white px-[8px]">
              <IconMagnifier />
              <span className="truncate text-[14px] leading-[20px] text-[#928c88]">
                Search for agents
              </span>
            </div>
            <button
              type="button"
              className="flex h-[32px] shrink-0 items-center gap-[8px] rounded-[6px] border-[0.5px] border-[#ebe9e8] bg-white px-[8px]"
            >
              <span className="text-[14px] leading-[20px] text-[#1a1817]">All</span>
              <IconChevronDown />
            </button>
          </div>

          <div className="flex items-center gap-[12px]">
            {/* View switch — same segmented pattern as the deck's tab bar. */}
            <div className="flex items-center gap-[2px] rounded-full bg-[#f5f5f4] p-[3px]">
              {(
                [
                  ["table", "Table"],
                  ["cards", "Cards"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setView(value)}
                  aria-pressed={view === value}
                  className={`rounded-full px-[12px] py-[5px] text-[12px] leading-[16px] transition-colors ease-fast ${
                    view === value
                      ? "bg-white text-[#1a1817] shadow-[0_0.5px_1.5px_rgba(16,16,16,0.12)]"
                      : "text-[#635d58] hover:text-[#1a1817]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="flex h-[32px] items-center gap-[4px] rounded-[6px] bg-[#0f0d0d] px-[8px] transition-opacity ease-fast hover:opacity-90"
            >
              <IconPlus />
              <span className="px-[4px] text-[14px] leading-[20px] text-white">
                Create agent
              </span>
            </button>
          </div>
        </div>

        {view === "table" ? (
          <div className="mt-12">
            <div className="grid h-[32px] grid-cols-[minmax(0,3fr)_minmax(0,4fr)_minmax(0,3fr)_minmax(0,2fr)_92px] items-center rounded-[6px] border-[0.5px] border-[rgba(16,16,16,0.08)] bg-white/80 backdrop-blur-[4px]">
              {["Agents", "Channels", "Connected apps", "Created by", ""].map(
                (label) => (
                  <p
                    key={label || "actions"}
                    className="px-[12px] text-[10px] leading-[14px] font-medium tracking-[1px] text-[#635d58] uppercase"
                  >
                    {label}
                  </p>
                ),
              )}
            </div>
            {AGENTS.map((agent) => (
              <div
                key={agent.id}
                className="grid h-[56px] grid-cols-[minmax(0,3fr)_minmax(0,4fr)_minmax(0,3fr)_minmax(0,2fr)_92px] items-center rounded-[10px] transition-colors ease-fast hover:bg-[#fafaf9]"
              >
                <div className="flex items-center gap-[12px] px-[12px]">
                  <AgentMark />
                  <span className="flex min-w-0 items-center gap-[16px]">
                    <span className="truncate text-[14px] leading-[20px] text-[#1a1817]">
                      {agent.name}
                    </span>
                    {agent.external ? <ExternalBadge /> : null}
                  </span>
                </div>
                <div className="flex items-center gap-[4px] px-[12px]">
                  {agent.channels.slice(0, 2).map((c) => (
                    <ChannelChip key={c} name={c} />
                  ))}
                  {agent.channels.length > 2 ? (
                    <MoreChip count={agent.channels.length - 2} />
                  ) : null}
                </div>
                <div className="flex items-center px-[12px]">
                  {agent.apps.length ? <AppStack apps={agent.apps} /> : null}
                </div>
                <div className="px-[12px]">
                  <CreatedBy name={agent.createdBy} />
                </div>
                <div className="flex items-center gap-[8px] px-[12px]">
                  <Toggle on={enabled[agent.id]} onChange={() => toggle(agent.id)} />
                  <button
                    type="button"
                    className="rounded-[8px] p-[4px] transition-colors ease-fast hover:bg-[#f5f5f4]"
                  >
                    <IconKebab />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-[repeat(auto-fill,minmax(236px,1fr))] gap-4">
            {/* Figma 18548:65574 — everything centred around one large avatar.
                The dot on its shoulder carries enabled state (it tracks the
                table's toggle), and the role line replaces the External pill. */}
            {AGENTS.map((agent) => {
              const on = enabled[agent.id];
              return (
                <div
                  key={agent.id}
                  className="flex flex-col items-center rounded-[12px] border border-[#f0efee] bg-white shadow-[0px_1px_6px_0px_rgba(16,16,16,0.06),0px_8px_12px_-6px_rgba(16,16,16,0.04),0px_0px_0.5px_0.75px_rgba(16,16,16,0.06)]"
                >
                  <div className="flex w-full justify-end px-[4px] py-[8px]">
                    <button
                      type="button"
                      className="rotate-90 rounded-[8px] p-[4px] transition-colors ease-fast hover:bg-[#f5f5f4]"
                    >
                      <IconKebab />
                    </button>
                  </div>

                  <div className="flex flex-col items-center pb-[24px]">
                    <div className="relative">
                      <Image
                        src="/agents/agent-avatar.png"
                        alt=""
                        width={83}
                        height={83}
                        className="rounded-full"
                      />
                      <span
                        className={`absolute right-[2px] bottom-[2px] size-[15px] rounded-full border-[3px] border-white transition-colors ease-fast ${
                          on ? "bg-[#16a34a]" : "bg-[#d6d3d1]"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-[12px] pb-[24px]">
                    <div className="flex flex-col items-center">
                      <p className="text-[16px] leading-[20px] font-medium text-[#1a1817]">
                        {agent.name}
                      </p>
                      <p className="text-[14px] leading-[20px] text-[#58524e]">
                        {agent.external ? "External Agent" : "Workspace Agent"}
                      </p>
                    </div>
                    {/* Apps under the identity block (18552:119923's structure),
                        but the overflow count keeps the chips' +N convention
                        instead of a bare numeral, and 0 apps reads as a quiet
                        connect affordance rather than an empty hole. */}
                    {agent.apps.length ? (
                      <span className="flex items-center gap-[6px]">
                        <AppStack apps={agent.apps} size={20} />
                        {agent.apps.length > 3 ? (
                          <MoreChip count={agent.apps.length - 3} />
                        ) : null}
                      </span>
                    ) : (
                      <button
                        type="button"
                        title="Connect an app"
                        className="flex h-[20px] items-center gap-[4px] rounded-full border border-dashed border-[#d6d3d1] px-[8px] text-[12px] leading-[16px] text-[#928c88] transition-colors ease-fast hover:border-[#928c88] hover:text-[#635d58]"
                      >
                        Connect apps
                      </button>
                    )}
                  </div>

                  {/* No footer chrome — provenance and scope sit as one quiet
                      caption line inside the centred composition. */}
                  <div className="flex items-center gap-[6px] pb-[20px] text-[12px] leading-[16px] text-[#78716c]">
                    <span
                      className="flex items-center gap-[5px]"
                      title={`Created by ${agent.createdBy}`}
                    >
                      <Image
                        src="/agents/oli.png"
                        alt=""
                        width={14}
                        height={14}
                        className="rounded-full"
                      />
                      by {agent.createdBy}
                    </span>
                    <span aria-hidden className="text-[#d6d3d1]">
                      ·
                    </span>
                    <span title={agent.channels.map((c) => `#${c}`).join("  ")}>
                      {agent.channels.length} channels
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
