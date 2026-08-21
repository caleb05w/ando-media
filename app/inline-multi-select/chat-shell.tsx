import type { ReactNode } from "react";
import {
  SHELL_PIN,
  SHELL_SIDEBAR,
  type ShellSidebarRow,
} from "../agent-inline-trace/data";

const ASSET_ROOT = "/agent-inline-trace";
const FG_PRIMARY = "#1a1817";
const FG_SECONDARY = "#58524e";
const STROKE_WEAK = "#f0efee";
const BG_TERTIARY = "#f5f5f4";

const AVATARS: Record<string, string> = {
  Caleb: "/avatars/caleb.png",
  AJ: "/avatars/aj.png",
  Oli: "/avatars/oli.png",
  "Sara Du": "/avatars/sara.png",
  Tadao: "/agent-working/agent-2.png",
};

function asset(file: string) {
  return ASSET_ROOT + "/" + file;
}

function Avatar({ name, size }: { name: string; size: number }) {
  const source = AVATARS[name];

  if (!source) {
    return (
      <span
        aria-hidden="true"
        className="inline-block shrink-0 rounded-full bg-[#e7e5e4]"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={source}
      alt=""
      aria-hidden="true"
      className="inline-block shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

function PresenceAvatar({
  name,
  presence,
}: {
  name: string;
  presence: "green" | "away";
}) {
  return (
    <span className="relative size-4 shrink-0">
      <Avatar name={name} size={16} />
      <span
        aria-hidden="true"
        className="absolute size-[5px] rounded-full"
        style={{
          left: 11,
          top: 12,
          background: presence === "green" ? "#22c55e" : "#d3d1ce",
          boxShadow: "0 0 0 1.5px white",
        }}
      />
    </span>
  );
}

const RAIL_ITEMS = [
  { icon: "rail-chat.svg", label: "Conversations", active: true, className: "size-[13px]" },
  { icon: "rail-inbox.svg", label: "Inbox", active: false, className: "h-[11px] w-[15px]" },
  { icon: "rail-search.svg", label: "Search", active: false, className: "size-[12px]" },
  { icon: "rail-studio.svg", label: "Studio", active: false, className: "h-[12px] w-[13px]" },
] as const;

export function GlobalNav() {
  return (
    <nav
      aria-label="Workspace navigation"
      className="ims-global-nav relative flex w-12 shrink-0 flex-col justify-between border-r-[0.5px] px-2 py-2"
      style={{ borderColor: STROKE_WEAK, background: BG_TERTIARY }}
    >
      <div className="flex w-8 flex-col items-center">
        <span className="relative mb-2 flex size-8 items-center justify-center">
          <span className="flex size-7 items-center justify-center overflow-hidden rounded-[6px] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <img
              src={asset("rail-workspace.png")}
              alt="Ando workspace"
              className="size-7 object-contain"
            />
          </span>
          <span className="absolute left-[22px] top-[20px] flex size-3 items-center justify-center rounded-full bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <img src={asset("rail-chevron.svg")} alt="" className="h-[2.5px] w-[5px]" />
          </span>
        </span>
        <span className="mb-2 h-px w-4" style={{ background: STROKE_WEAK }} />

        {RAIL_ITEMS.map((item) => (
          <span key={item.label} className="mb-2 flex size-8 items-center justify-center last:mb-0">
            <span
              className={
                item.active
                  ? "flex size-7 items-center justify-center rounded-[6px] bg-white drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                  : "flex size-7 items-center justify-center"
              }
            >
              <img src={asset(item.icon)} alt={item.label} className={item.className} />
            </span>
          </span>
        ))}

        <span className="mb-2 mt-2 h-px w-4" style={{ background: STROKE_WEAK }} />
        <span className="mb-2 flex size-8 items-center justify-center">
          <img src={asset("rail-actions.svg")} alt="Actions" className="size-[12px]" />
        </span>
        <span className="flex size-8 items-center justify-center">
          <img src={asset("rail-invite.svg")} alt="Invite people" className="h-[13px] w-[12px]" />
        </span>
      </div>

      <div className="flex w-8 flex-col items-center">
        <span className="flex h-10 w-8 items-center justify-center pb-2 text-[14px] leading-5 text-[#58524e]">
          ?
        </span>
        <span className="mb-2 flex size-8 items-center justify-center">
          <img src={asset("rail-settings.svg")} alt="Settings" className="h-[12px] w-[13px]" />
        </span>
        <span className="flex size-8 items-center justify-center">
          <PresenceAvatar name="Caleb" presence="green" />
        </span>
      </div>
    </nav>
  );
}

function SidebarRow({ row }: { row: ShellSidebarRow }) {
  if (row.kind === "section") {
    return (
      <div className="mt-3 flex h-7 w-full items-center gap-2 px-2 first:mt-0">
        <span className="flex w-6 justify-center">
          <img src={asset("sb-folder.svg")} alt="" className="h-[9px] w-[13px]" />
        </span>
        <span
          className="text-[11px] font-medium uppercase leading-[14px] tracking-[1.1px]"
          style={{ color: FG_SECONDARY }}
        >
          {row.label}
        </span>
      </div>
    );
  }

  if (row.kind === "add") {
    return (
      <div className="flex h-8 w-full items-center gap-2 rounded-[6px] py-1.5 pl-[22px] pr-2">
        <span className="flex size-4 items-center justify-center">
          <img src={asset("sb-plus.svg")} alt="" className="size-2" />
        </span>
        <span className="text-[14px] leading-5" style={{ color: FG_SECONDARY }}>
          {row.label}
        </span>
      </div>
    );
  }

  if (row.kind === "divider") {
    return <span className="mx-2 my-2 h-px shrink-0" style={{ background: STROKE_WEAK }} />;
  }

  if (row.kind === "person") {
    return (
      <div className="flex h-8 w-full items-center gap-2 rounded-[6px] py-1.5 pl-[22px] pr-2">
        <PresenceAvatar name={row.name} presence={row.presence} />
        <span className="truncate text-[14px] leading-5" style={{ color: FG_SECONDARY }}>
          {row.name}
        </span>
      </div>
    );
  }

  const channelIcon =
    row.active ? "sb-hash-active.svg" : row.label === "sf-team" ? "sb-hash-lock.svg" : "sb-hash.svg";
  const rowClassName = [
    "flex h-8 w-full items-center gap-2 rounded-[8px] py-1.5 pr-2",
    row.muted ? "opacity-50" : "",
    row.flat ? "pl-2" : "pl-[22px]",
  ].join(" ");

  return (
    <div className={rowClassName} style={row.active ? { background: BG_TERTIARY } : undefined}>
      <img src={asset(channelIcon)} alt="" className="size-4 shrink-0" />
      <span
        className="truncate text-[14px] leading-5"
        style={{ color: row.active ? FG_PRIMARY : FG_SECONDARY }}
      >
        {row.label}
      </span>
    </div>
  );
}

export function LocalNav() {
  return (
    <aside
      aria-label="Conversations"
      className="ims-local-nav flex w-[354px] shrink-0 flex-col overflow-hidden border-r-[0.5px] bg-white"
      style={{ borderColor: STROKE_WEAK }}
    >
      <div
        className="flex h-12 shrink-0 items-end gap-4 border-b-[0.5px] pl-[10px] pr-3"
        style={{ borderColor: STROKE_WEAK }}
      >
        <div className="flex flex-1 items-end gap-4">
          <span
            className="border-b pb-3 text-[14px] font-medium leading-5"
            style={{ color: FG_PRIMARY, borderColor: FG_PRIMARY }}
          >
            Conversations
          </span>
          <span className="border-b border-transparent pb-3 text-[14px] leading-5 text-[#58524e]">
            Threads
          </span>
        </div>
        <div className="flex items-center gap-2 pb-2">
          <img src={asset("sb-dots.svg")} alt="More" className="h-[2.5px] w-[13px]" />
          <span className="flex items-center gap-1 rounded-[6px] bg-white px-1.5 py-1 shadow-[0px_0px_0.5px_0.75px_#ebe9e8]">
            <img src={asset("sb-share.svg")} alt="Share" className="size-[13px]" />
            <img src={asset("sb-caret.svg")} alt="" className="h-[3px] w-[5px]" />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-[2px] overflow-y-auto px-[10px] pb-4 pt-2">
        {SHELL_SIDEBAR.map((row, index) => (
          <SidebarRow key={row.kind + "-" + index} row={row} />
        ))}
      </div>
    </aside>
  );
}

export function ChannelHeader() {
  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between border-b-[0.5px] bg-white px-4"
      style={{ borderColor: STROKE_WEAK }}
    >
      <span className="flex h-8 items-center gap-2 px-0.5">
        <img src={asset("hdr-hashtag.svg")} alt="" className="size-[12px]" />
        <span className="text-[14px] font-medium leading-5 text-[#1a1817]">design</span>
      </span>

      <div className="ims-header-secondary flex items-center gap-2">
        <span className="flex items-start gap-px" aria-label="Start a jam">
          <span className="flex h-6 w-7 items-center justify-center rounded-l-[6px] rounded-r-[1px] bg-[#f5f5f4]">
            <img src={asset("hdr-headphones.svg")} alt="" className="size-[12px]" />
          </span>
          <span className="flex h-6 w-4 items-center justify-center rounded-l-[1px] rounded-r-[6px] bg-[#f5f5f4]">
            <img src={asset("hdr-chevron.svg")} alt="" className="h-[3px] w-[5px]" />
          </span>
        </span>
        <span
          className="flex items-center justify-center gap-1.5 rounded-[8px] border-[0.5px] px-2 py-1"
          style={{ borderColor: STROKE_WEAK }}
        >
          <img src={asset("hdr-people.svg")} alt="Members" className="h-[11px] w-4" />
          <span className="text-center text-[12px] leading-4 text-[#1a1817]">12</span>
        </span>
      </div>
    </header>
  );
}

export function PinnedBar() {
  return (
    <div
      className="flex h-10 shrink-0 items-center gap-[10px] border-b-[0.5px] px-4"
      style={{ borderColor: STROKE_WEAK }}
    >
      <img src={asset("pin-glyph.svg")} alt="Pinned" className="size-[11px]" />
      <Avatar name={SHELL_PIN.author} size={20} />
      <span className="text-[13px] font-medium leading-[18px] text-[#58524e]">
        {SHELL_PIN.author}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-[#78716c]">
        {SHELL_PIN.url}
      </span>
      <span className="rounded-full bg-[#fafaf9] px-1.5 py-[2px] text-[11px] leading-[14px] text-[#78716c]">
        {SHELL_PIN.count}
      </span>
      <img src={asset("pin-chevron.svg")} alt="" className="h-[9px] w-[4.5px]" />
    </div>
  );
}

export function ChatMessage({
  author,
  time,
  children,
}: {
  author: string;
  time: string;
  children: ReactNode;
}) {
  return (
    <article className="flex w-full items-start gap-2 px-4 py-1.5">
      <Avatar name={author} size={32} />
      <div className="min-w-0 flex-1">
        <div className="flex h-5 items-baseline gap-2 whitespace-nowrap">
          <span className="text-[14px] font-medium leading-5 text-[#1a1817]">{author}</span>
          <span className="text-[12px] uppercase leading-4 text-[#78716c]">{time}</span>
        </div>
        <div className="min-w-0 pt-px text-[14px] leading-5 text-[#1a1817]">{children}</div>
      </div>
    </article>
  );
}

export function Composer() {
  return (
    <div className="relative flex w-full shrink-0 flex-col px-4 pb-4 pt-3">
      <div
        className="flex w-full flex-col overflow-hidden rounded-[10px] border-[0.5px] bg-white"
        style={{ borderColor: STROKE_WEAK }}
      >
        <div className="flex h-[70px] w-full items-start px-5 py-4">
          <input
            type="text"
            aria-label="Message"
            placeholder="Enter your message"
            className="w-full bg-transparent text-[14px] leading-5 text-[#1a1817] outline-none placeholder:text-[#a8a29e]"
          />
        </div>
        <div className="flex w-full items-center justify-between p-3">
          <div className="flex items-center">
            <button type="button" aria-label="Attach a file" className="flex size-7 items-center justify-center rounded-[6px]">
              <img src={asset("comp-paperclip.svg")} alt="" className="h-[13px] w-[9px]" />
            </button>
            <button type="button" aria-label="Formatting" className="flex size-7 items-center justify-center rounded-[6px] text-[14px] font-medium leading-5 text-[#58524e]">
              Aa
            </button>
            <button type="button" aria-label="Add emoji" className="flex size-7 items-center justify-center rounded-[6px]">
              <img src={asset("comp-emoji.svg")} alt="" className="size-[13px]" />
            </button>
            <button type="button" aria-label="Add GIF" className="flex size-7 items-center justify-center rounded-[6px]">
              <img src={asset("comp-gif.svg")} alt="" className="h-[9px] w-[12px]" />
            </button>
          </div>
          <div className="flex items-start opacity-45">
            <button
              type="button"
              aria-label="Send"
              className="flex size-7 items-center justify-center rounded-l-[6px] rounded-r-[1px] bg-[#f5f5f4] px-2"
            >
              <img src={asset("comp-send.svg")} alt="" className="size-[12px]" />
            </button>
            <span className="h-7 w-px" style={{ background: STROKE_WEAK }} />
            <button
              type="button"
              aria-label="Send options"
              className="flex h-7 w-4 items-center justify-center rounded-l-[1px] rounded-r-[6px] bg-[#f5f5f4]"
            >
              <img src={asset("comp-chevron.svg")} alt="" className="h-[3px] w-[5px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
