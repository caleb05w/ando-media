"use client";

// /multi-select — 1:1 recreation of Figma node 17167-17686 (July Sprints,
// "Channel info: attachments version 20") with the Ando lab's multi-select
// interaction layered onto the message list. All colors/spacing/type come
// from the Figma design context; every icon/photo is the exported asset.

import { useLayoutEffect, useRef, useState } from "react";
import "./multi-select.css";
import { MESSAGES, SIDEBAR, SIDEBAR_FLAT, type DemoMessage, type SidebarEntry } from "./data";
import {
  MultiSelectBar,
  useMultiSelect,
  type MultiSelectVariant,
} from "./multi-select";

const A = "/multi-select";

const FG_PRIMARY = "#1a1817";
const FG_SECONDARY = "#58524e";
const FG_TERTIARY = "#78716c";
const STROKE_WEAK = "#f0efee";
const BG_TERTIARY = "#f5f5f4";
const BRAND = "#2563eb";

// The mock's message avatars are generic silhouette placeholders — drawn
// inline so they render identically everywhere.
function Silhouette({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="shrink-0 rounded-full"
      aria-hidden
    >
      <circle cx="12" cy="12" r="12" fill="#e7e5e4" />
      <circle cx="12" cy="9.5" r="4" fill="#a8a29e" />
      <path d="M4 21.5c1.4-4 4.4-6 8-6s6.6 2 8 6a12 12 0 01-16 0z" fill="#a8a29e" />
    </svg>
  );
}

function Titlebar() {
  return (
    <div className="relative flex h-7 shrink-0 items-center justify-center">
      <div className="absolute left-2 top-2 flex items-center gap-2">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
      </div>
      <span className="text-[13px] font-medium leading-4" style={{ color: FG_PRIMARY }}>
        Ando
      </span>
    </div>
  );
}

function RailTile({
  children,
  size = 32,
  card = false,
}: {
  children?: React.ReactNode;
  size?: number;
  card?: boolean;
}) {
  return (
    <span
      className={`flex items-center justify-center rounded-[6px] ${
        card
          ? "bg-white shadow-[0px_1px_4px_0px_rgba(16,16,16,0.06),0px_0px_0.5px_0.75px_#f0efee]"
          : ""
      }`}
      style={{ width: size, height: size }}
    >
      {children}
    </span>
  );
}

function GlobalNav() {
  return (
    <div className="flex w-12 shrink-0 flex-col items-center justify-between px-2 py-2.5">
      <div className="relative flex w-8 flex-col items-center gap-2.5">
        <span
          className="flex size-7 items-center justify-center rounded-[6px] border-[0.5px] border-[rgba(16,16,16,0.08)]"
          style={{ background: BG_TERTIARY }}
        >
          <img src={`${A}/rail-logo.svg`} alt="" className="size-5" />
        </span>
        <span className="absolute left-[21px] top-[19px] flex size-3 items-center justify-center rounded-[6px] bg-white shadow-[0px_1px_4px_0px_rgba(16,16,16,0.06),0px_0px_0.5px_0.75px_#f0efee]">
          <img src={`${A}/icon-chevron-down-small.svg`} alt="" className="size-3" />
        </span>
        <span className="h-px w-4" style={{ background: STROKE_WEAK }} />
        <div className="flex w-full flex-col items-center gap-2">
          <RailTile size={28} card>
            <img src={`${A}/icon-bubble.svg`} alt="" className="size-4" />
          </RailTile>
          <RailTile>
            <img src={`${A}/icon-bookmark.svg`} alt="" className="size-4" />
          </RailTile>
          <RailTile>
            <img src={`${A}/icon-search.svg`} alt="" className="size-4" />
          </RailTile>
        </div>
        <span className="h-px w-4" style={{ background: STROKE_WEAK }} />
        <RailTile>
          <img src={`${A}/icon-cmd.svg`} alt="" className="size-4" />
        </RailTile>
      </div>
      <div className="flex flex-col items-center gap-2">
        <RailTile>
          <img src={`${A}/icon-user-add.svg`} alt="" className="size-4" />
        </RailTile>
        <RailTile>
          <span className="relative size-4">
            <img
              src={`${A}/rail-avatar-photo.png`}
              alt=""
              className="size-4 rounded-full object-cover"
            />
            <img
              src={`${A}/rail-presence.svg`}
              alt=""
              className="absolute -bottom-px -right-px size-[7px]"
            />
          </span>
        </RailTile>
      </div>
    </div>
  );
}

function SidebarRowView({ entry }: { entry: SidebarEntry }) {
  if (entry.kind === "folder") {
    return (
      <div className="flex h-6 w-full items-center gap-2 px-2">
        <span className="flex h-3.5 w-4 items-center">
          <img src={entry.icon} alt="" className="size-3.5" />
        </span>
        <span
          className="text-[11px] font-medium uppercase leading-[14px] tracking-[1.1px]"
          style={{ color: FG_SECONDARY }}
        >
          {entry.label}
        </span>
      </div>
    );
  }
  if (entry.kind === "create") {
    return (
      <div className="flex h-8 w-full items-center gap-2 rounded-xl px-2 py-1.5">
        <img src={`${A}/icon-plus-small.svg`} alt="" className="size-4" />
        <span className="text-[14px] leading-5" style={{ color: FG_SECONDARY }}>
          Create channel
        </span>
      </div>
    );
  }
  const indentClass = "indent" in entry && entry.indent ? "pl-6 pr-2" : "px-2";
  if (entry.kind === "channel") {
    return (
      <div
        className={`flex h-8 w-full items-center gap-3 rounded-[6px] py-1.5 ${indentClass}`}
        style={entry.active ? { background: "rgba(16,16,16,0.04)" } : undefined}
      >
        <span className="flex flex-1 items-center gap-2 overflow-hidden">
          <img
            src={
              entry.unread
                ? `${A}/icon-hashtag-strong.svg`
                : entry.active
                  ? `${A}/icon-hashtag-weak.svg`
                  : `${A}/icon-hashtag-boxed.svg`
            }
            alt=""
            className="size-4 shrink-0"
          />
          <span
            className="truncate text-[14px] leading-5"
            style={{
              color: entry.unread || entry.active ? FG_PRIMARY : FG_SECONDARY,
              fontWeight: entry.unread ? 530 : 400,
            }}
          >
            {entry.label}
          </span>
        </span>
        {entry.badge != null ? (
          <span
            className="flex size-4 items-center justify-center rounded-xl text-center text-[10px] font-medium leading-[10px] text-white"
            style={{ background: BRAND }}
          >
            {entry.badge}
          </span>
        ) : null}
      </div>
    );
  }
  if (entry.kind === "group") {
    return (
      <div className="flex h-8 w-full items-center gap-1.5 rounded-xl px-2 py-1.5">
        <span className="flex flex-1 items-center gap-2 overflow-hidden">
          <img src={`${A}/icon-group.svg`} alt="" className="size-4 shrink-0" />
          <span className="truncate text-[14px] leading-5" style={{ color: FG_SECONDARY }}>
            {entry.label}
          </span>
        </span>
        {entry.muted ? (
          <img src={`${A}/icon-mute.svg`} alt="" className="size-4" />
        ) : null}
      </div>
    );
  }
  // person
  return (
    <div className={`flex h-8 w-full items-center gap-1.5 rounded-xl py-1.5 ${indentClass}`}>
      <span className="flex flex-1 items-center gap-2 overflow-hidden">
        <span className="relative size-4 shrink-0">
          <img src={entry.photo} alt="" className="size-4 rounded-full object-cover" />
          <span
            className="absolute size-[5px] rounded-full"
            style={{
              left: "calc(50% + 4px)",
              top: "calc(50% + 4px)",
              background: entry.presence === "green" ? "#16a34a" : "#d6d3d1",
              boxShadow: "0 0 0 1.5px white",
            }}
          />
        </span>
        <span
          className="truncate text-[14px] leading-5"
          style={{
            color: entry.medium ? FG_PRIMARY : FG_SECONDARY,
            fontWeight: entry.medium ? 500 : 400,
          }}
        >
          {entry.label}
        </span>
      </span>
    </div>
  );
}

function LocalNav() {
  return (
    <div className="flex w-[350px] shrink-0 flex-col overflow-hidden rounded-tl-[10px] rounded-tr-[6px] bg-white shadow-[0px_0px_0.5px_0.5px_rgba(15,13,13,0.08),0px_1px_2px_0px_rgba(15,13,13,0.05)]">
      <div
        className="flex h-12 shrink-0 items-center gap-4 border-b-[0.5px] py-3 pl-2.5 pr-3"
        style={{ borderColor: STROKE_WEAK }}
      >
        <div className="flex flex-1 items-center">
          <span
            className="flex h-7 items-center justify-center rounded-full px-2.5"
            style={{ background: BG_TERTIARY }}
          >
            <span className="px-0.5 text-[12px] font-medium leading-4" style={{ color: FG_PRIMARY }}>
              Conversations
            </span>
          </span>
          <span className="flex h-7 items-center justify-center px-2.5">
            <span className="px-0.5 text-[12px] leading-4" style={{ color: FG_SECONDARY }}>
              Threads
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center rounded-[4px] p-1">
            <img src={`${A}/icon-dotgrid.svg`} alt="" className="size-4" />
          </span>
          <span className="flex items-center rounded-[4px] p-1">
            <img src={`${A}/icon-edit.svg`} alt="" className="size-4" />
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center gap-3 overflow-y-auto px-2 pb-2 pt-3">
        <div className="flex w-full flex-col gap-3">
          <div className="flex w-full flex-col">
            <SidebarRowView entry={SIDEBAR[0]} />
          </div>
          <div className="flex w-full flex-col gap-0.5">
            {SIDEBAR.slice(1, 4).map((entry, index) => (
              <SidebarRowView key={index} entry={entry} />
            ))}
          </div>
          <div className="flex w-full flex-col gap-0.5">
            {SIDEBAR.slice(4).map((entry, index) => (
              <SidebarRowView key={index} entry={entry} />
            ))}
          </div>
        </div>
        <span className="h-px w-[268px] shrink-0" style={{ background: STROKE_WEAK }} />
        <div className="flex w-full flex-col gap-0.5">
          {SIDEBAR_FLAT.map((entry, index) => (
            <SidebarRowView key={index} entry={entry} />
          ))}
        </div>
        <span
          className="flex h-7 items-center justify-center gap-0.5 rounded-full border-[0.5px] px-2.5"
          style={{ borderColor: STROKE_WEAK }}
        >
          <span className="px-1 text-[12px] leading-4" style={{ color: FG_SECONDARY }}>
            Show 4 inactive conversations
          </span>
          <img src={`${A}/icon-chevron-down-medium.svg`} alt="" className="size-4" />
        </span>
      </div>
    </div>
  );
}

function PageHeader({
  variant,
  onVariantChange,
}: {
  variant: MultiSelectVariant;
  onVariantChange: (variant: MultiSelectVariant) => void;
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-10 border-b-[0.5px] bg-white px-4 py-1"
      style={{ borderColor: STROKE_WEAK }}
    >
      <div className="flex flex-1 items-center gap-2 py-0.5">
        <div className="flex flex-1 items-center">
          <span className="flex h-7 items-center gap-1">
            <span className="flex size-6 items-center justify-center rounded-[4px]">
              <img src={`${A}/icon-hashtag-header.svg`} alt="" className="size-4" />
            </span>
            <span className="text-[14px] leading-5" style={{ color: FG_PRIMARY }}>
              design
            </span>
          </span>
        </div>
        {/* A/B switch for the More-actions treatment. */}
        <span
          className="flex items-center rounded-[8px] p-0.5"
          style={{ background: BG_TERTIARY }}
        >
          {(
            [
              ["popout", "Popout"],
              ["commandbar", "Command bar"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onVariantChange(value)}
              className={`flex h-6 items-center rounded-[6px] px-2 text-[12px] leading-4 transition-colors ${
                variant === value ? "bg-white shadow-[0px_0px_0.5px_0.75px_#ebe9e8]" : ""
              }`}
              style={{ color: variant === value ? FG_PRIMARY : FG_SECONDARY }}
            >
              {label}
            </button>
          ))}
        </span>
        <span className="flex items-center justify-center gap-1.5 rounded-[6px] bg-white px-2 py-1 shadow-[0px_0px_0.5px_0.75px_#ebe9e8]">
          <img src={`${A}/icon-people-header.svg`} alt="" className="size-4" />
          <span className="text-center text-[12px] leading-4" style={{ color: FG_SECONDARY }}>
            13
          </span>
        </span>
        <span
          className="flex items-center justify-center rounded-[6px] shadow-[0px_1px_6px_0px_rgba(16,16,16,0.04),0px_0px_0.5px_0.75px_rgba(16,16,16,0.06)]"
          style={{ background: BG_TERTIARY }}
        >
          <span className="flex items-center justify-center px-1.5 py-1">
            <img src={`${A}/icon-headphones.svg`} alt="" className="size-4" />
          </span>
          <span className="flex h-full w-5 items-center justify-center">
            <img src={`${A}/icon-chevron-header.svg`} alt="" className="size-4" />
          </span>
        </span>
      </div>
    </div>
  );
}

function MessageRow({
  message,
  mode,
  selected,
  peeked,
  washDelay,
}: {
  message: DemoMessage;
  mode: boolean;
  selected: boolean;
  peeked: boolean;
  washDelay: number;
}) {
  return (
    <div
      data-msg-id={message.id}
      className="relative flex w-full items-start gap-2.5 px-4 pb-1.5 pt-2"
      style={{ cursor: mode && selected ? "pointer" : undefined }}
    >
      {/* Notion-style block wash over the whole message. Always mounted so
          the fade (and its stagger) runs identically in and out. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-2 inset-y-0.5 z-[1] rounded-md"
        style={{
          background: peeked
            ? "rgba(37,99,235,0.22)"
            : "rgba(37,99,235,0.14)",
          opacity: mode && selected ? 1 : 0,
          transition: `opacity 350ms cubic-bezier(0.2,0,0,1) ${washDelay}ms, background-color 150ms cubic-bezier(0.2,0,0,1)`,
        }}
      />
      {message.threadFooter ? (
        <img
          src={`${A}/thread-spine.svg`}
          alt=""
          className="absolute bottom-[-14px] left-7 h-[60px] w-3"
        />
      ) : null}
      <Silhouette size={24} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex h-3 items-center gap-1.5 whitespace-nowrap">
          <span className="text-[14px] font-medium leading-5" style={{ color: FG_PRIMARY }}>
            {message.author.name}
          </span>
          <span className="text-[12px] leading-4" style={{ color: FG_TERTIARY }}>
            {message.time}
          </span>
        </div>
        <div
          data-msg-text
          className="break-words text-[14px] leading-5"
          style={{ color: FG_PRIMARY }}
        >
          {message.body.map((paragraph, pIndex) => (
            <p key={pIndex} className={pIndex > 0 ? "mt-5" : undefined}>
              {paragraph.map((segment, sIndex) =>
                segment.link ? (
                  <span key={sIndex} style={{ color: BRAND }}>
                    {segment.text}
                  </span>
                ) : (
                  <span key={sIndex}>{segment.text}</span>
                )
              )}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function ThreadFooter({ message }: { message: DemoMessage }) {
  const footer = message.threadFooter!;
  return (
    <div className="relative flex w-full items-center gap-2.5 px-4 py-1.5">
      <span className="h-3 w-6 shrink-0" />
      <span className="flex items-center gap-2 rounded-[4px]">
        <span className="flex h-4 items-center">
          {footer.avatars.map((_, index) => (
            <span
              key={index}
              className="rounded-full border-[1.5px] border-white"
              style={{ marginRight: index < footer.avatars.length - 1 ? -6 : 0 }}
            >
              <Silhouette size={13} />
            </span>
          ))}
        </span>
        <span className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="text-[12px] font-medium leading-4">
            <span style={{ color: FG_PRIMARY }}>{footer.countLabel}</span>
            <span style={{ color: BRAND }}>{footer.newLabel}</span>
          </span>
          <span className="text-[11px] leading-[14px]" style={{ color: FG_TERTIARY }}>
            {footer.lastReply}
          </span>
        </span>
      </span>
    </div>
  );
}

function Composer() {
  return (
    <div className="flex w-full shrink-0 flex-col items-center justify-center p-4" data-composer-region>
      <div
        className="flex w-full flex-col gap-2 overflow-hidden rounded-[10px] border-[0.5px] bg-white p-3"
        style={{ borderColor: STROKE_WEAK }}
      >
        <div className="flex h-10 w-full items-start px-1">
          <span className="whitespace-nowrap text-[14px] leading-5" style={{ color: "#a8a29e" }}>
            Send a message in #design
          </span>
        </div>
        <div className="flex w-full items-center justify-between">
          <span className="flex size-7 items-center justify-center rounded-[6px]">
            <img src={`${A}/icon-paperclip.svg`} alt="" className="size-4" />
          </span>
          <span className="size-7 rounded-[6px]" />
        </div>
      </div>
    </div>
  );
}

export default function MultiSelectPage() {
  const { state, selectedMessages, clearAll, toggleRow, setPeekId } =
    useMultiSelect(MESSAGES);
  const [stubAction, setStubAction] = useState<{
    label: string;
    count: number;
  } | null>(null);
  const [variant, setVariant] = useState<MultiSelectVariant>("popout");
  const messagesRef = useRef<HTMLDivElement>(null);

  // Chat surfaces open at the latest message.
  useLayoutEffect(() => {
    const list = messagesRef.current;
    if (list != null) list.scrollTop = list.scrollHeight;
  }, []);

  const mode = state.phase === "active" && !state.exiting;

  return (
    <div
      className="flex h-dvh w-screen flex-col overflow-hidden"
      style={{ background: BG_TERTIARY, color: FG_PRIMARY }}
    >
      <Titlebar />
      <div className="relative flex min-h-0 flex-1">
        <GlobalNav />
        <LocalNav />
        {/* 6px gutter between the two cards — the page bg reads as the divider. */}
        <main className="relative ml-1.5 flex min-w-0 flex-1 flex-col overflow-clip rounded-tl-[6px] bg-white shadow-[0px_0px_0.5px_0.5px_rgba(15,13,13,0.08),0px_1px_2px_0px_rgba(15,13,13,0.05)]">
          <PageHeader variant={variant} onVariantChange={setVariant} />
          {/* mt-auto spacer (not justify-end) pins messages to the bottom:
              justify-end makes top overflow unscrollable in flex containers. */}
          <div
            ref={messagesRef}
            className="ms-messages flex min-h-0 flex-1 flex-col overflow-y-auto pr-4"
          >
            <div aria-hidden className="mt-auto shrink-0" />
            {MESSAGES.map((message) => (
              <div key={message.id} className="flex w-full flex-col">
                <MessageRow
                  message={message}
                  mode={mode}
                  selected={state.selectedIds.includes(message.id)}
                  peeked={state.peekId === message.id}
                  // Cascade in first→last; on clear-all, cascade out in
                  // reverse (last selected releases first).
                  washDelay={(() => {
                    const index = state.selectedIds.indexOf(message.id);
                    if (index < 0) return 0;
                    return (
                      (state.exiting
                        ? state.selectedIds.length - 1 - index
                        : index) * 15
                    );
                  })()}
                />
                {message.threadFooter ? (
                  <ThreadFooter message={message} />
                ) : null}
              </div>
            ))}
          </div>
          <Composer />
          {state.phase !== "idle" ? (
            // Keyed by variant so switching mid-selection resets menu state.
            <MultiSelectBar
              key={variant}
              state={state}
              variant={variant}
              selectedMessages={selectedMessages}
              onClear={clearAll}
              onRemove={toggleRow}
              onPeek={setPeekId}
              onForward={(count) => setStubAction({ label: "Forward", count })}
              onSendToAgent={(count) =>
                setStubAction({ label: "Send to Agent", count })
              }
            />
          ) : null}
        </main>
      </div>

      {stubAction != null ? (
        // data-ms-bar: clicks in the dialog must not clear the selection.
        <div
          data-ms-bar
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
        >
          <div className="flex flex-col items-start gap-3 rounded-[10px] bg-[#1a1817] p-5 text-white shadow-[0px_16px_24px_-12px_rgba(16,16,16,0.4)]">
            <span className="text-[14px] font-medium leading-5">
              {`${stubAction.label}: ${stubAction.count} message${stubAction.count === 1 ? "" : "s"}`}
            </span>
            <span className="text-[12px] leading-4 text-white/60">
              This action is stubbed in the prototype.
            </span>
            <button
              type="button"
              onClick={() => setStubAction(null)}
              className="rounded-md bg-white/10 px-3 py-1.5 text-[14px] leading-5 transition-colors hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
