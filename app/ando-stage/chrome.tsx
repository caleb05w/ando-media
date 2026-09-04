// The Ando window, rebuilt on the product stylesheet. Every class here is
// either a vendored `.ando-*` component class (product-ui/) or the exact
// utility string the corresponding apps/web component renders — sources are
// named per block so drift can be checked against the real thing.

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Icon, ComposeConversationIcon, HashtagLockIcon } from "./glyph";
import { TypingIndicator } from "./typing";
import { motion } from "motion/react";
import { SIDEBAR, SIDEBAR_LOOSE, WORKSPACE, isAgent, type Actor, type Scene, type SidebarRow, type Surface } from "./scenes";

/* ------------------------------- avatars ------------------------------- */

/** MemberAvatar, circle shape. Sizes follow avatar-contract.ts; the status
 *  dot is .ando-avatar__status — a bare circle, sized by the contract's
 *  curve (5px at 16, 8px at 32), sitting 1px outside the bottom-right. */
export function Avatar({ actor, size = 32, online, className }: { actor: Actor; size?: number; online?: boolean; className?: string }) {
  return (
    <span className={["ando-avatar relative inline-flex shrink-0", className].filter(Boolean).join(" ")} style={{ width: size, height: size }}>
      <img src={actor.avatar} alt="" className={`size-full rounded-full ${actor.avatar.endsWith(".svg") ? "bg-white object-contain" : "object-cover"}`} style={{ borderRadius: 999, padding: actor.avatar.endsWith(".svg") ? Math.round(size * 0.2) : 0 }} />
      {online != null ? (
        <span
          className="ando-avatar__status absolute rounded-full"
          style={{
            // member-avatar.tsx: online is green-500, offline is border-strong,
            // and the dot sits in a ring of the page ground so it reads as
            // its own shape against the photo.
            background: online ? "var(--color-ando-green-500)" : "var(--color-ando-border-strong)",
            boxShadow: `0 0 0 ${size >= 32 ? 2 : 1.5}px var(--color-ando-bg-main)`,
            ["--ando-avatar-status-size" as string]: `${Math.round(5 * Math.pow(size / 16, Math.log(8 / 5) / Math.log(2)))}px`,
          }}
        />
      ) : null}
    </span>
  );
}

/** WorkspaceAvatar — rounded-[3px] square. */
function WorkspaceMark({ size }: { size: number }) {
  // The mark sits on its own white tile: the SVG is the bare glyph.
  return <img src={WORKSPACE.mark} alt="" className="shrink-0 rounded-[3px] bg-white object-contain shadow-xs" style={{ width: size, height: size, padding: Math.round(size * 0.18) }} />;
}

/* ------------------------------- topbar -------------------------------- */

/** desktop-topbar.tsx: fixed h-8 strip, history controls at left-20 (clear
 *  of the traffic lights), workspace mark + name centred. */
export function Topbar() {
  return (
    <div className="relative flex h-8 shrink-0 items-center justify-center bg-ando-bg-nav">
      <div className="absolute left-2 top-2 flex items-center gap-2" aria-hidden>
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
      </div>
      <div className="absolute left-20 top-2 flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <span className="flex size-4 items-center justify-center rounded text-ando-fg-secondary"><Icon name="IconArrowLeft" size={12} /></span>
          <span className="flex size-4 items-center justify-center rounded text-ando-fg-secondary opacity-50"><Icon name="IconArrowRight" size={12} /></span>
        </div>
        <div className="h-2 w-px bg-ando-border-default" />
        <span className="flex size-4 items-center justify-center rounded text-ando-fg-secondary"><Icon name="IconHistory" size={12} /></span>
      </div>
      <div className="flex min-w-0 items-center space-x-2">
        <WorkspaceMark size={20} />
        <span className="max-w-64 truncate kanso-text-label-14-md">{WORKSPACE.name}</span>
      </div>
    </div>
  );
}

/* --------------------------------- rail -------------------------------- */

function RailItem({ name, label, active, filled, children }: { name?: Parameters<typeof Icon>[0]["name"]; label: string; active?: boolean; filled?: boolean; children?: React.ReactNode }) {
  return (
    <span className="ando-sidebar-rail-button" aria-label={label} data-active={active ? "true" : undefined} role="img">
      <span className="ando-sidebar-rail-button__frame">
        <span className="ando-sidebar-rail-button__visual">
          {children ?? (name ? <Icon name={name} size={16} fill={filled ? "filled" : "outlined"} className="text-current" /> : null)}
        </span>
      </span>
    </span>
  );
}

/** sidebar-header-container.tsx — the 48px rail. */
export function Rail({ me }: { me: Actor }) {
  return (
    <div className="relative flex h-full w-12 shrink-0 flex-col items-center justify-between overflow-hidden bg-ando-bg-nav px-2 py-2">
      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center space-y-2">
        {/* workspace-selector-container.tsx, variant="icon" */}
        <span className="relative flex size-8 shrink-0 items-center justify-center rounded-lg">
          <span className="relative flex size-8 items-center justify-center">
            <WorkspaceMark size={28} />
            <span className="pointer-events-none absolute left-[22px] top-[20px] flex size-3 items-center justify-center overflow-hidden rounded-full bg-ando-bg-main text-ando-fg-primary shadow-xs">
              <Icon name="IconChevronDownSmall" size={12} />
            </span>
          </span>
        </span>
        <div className="h-px w-4 bg-ando-border-default" />
        <div className="flex w-full flex-col items-center space-y-2">
          <RailItem name="IconSidebarChatActive" label="Chat" active />
          <RailItem name="IconSidebarInboxInactive" label="Inbox" />
          <RailItem name="IconSidebarSearchInactive" label="Search" />
          <RailItem name="IconElements" label="Studio" />
        </div>
        <div className="h-px w-4 bg-ando-border-default" />
        <RailItem name="IconSidebarActionsInactive" label="Actions" />
        <RailItem name="IconUserAdd" label="Invite people" />
      </div>
      <div className="relative z-10 flex w-full shrink-0 flex-col items-center space-y-2">
        <RailItem name="IconQuestionmarkCircle" label="Help center" />
        <RailItem name="IconSettingsGear4" label="Settings" />
        <RailItem label="Account">
          {/* sidebar-member-avatar.tsx: 16px, 2px ring */}
          <Avatar actor={me} size={16} />
        </RailItem>
      </div>
    </div>
  );
}

/* ------------------------------- sidebar ------------------------------- */

/** SidebarConversationChannelIcon from packages/ui — the row hashtag is a
 *  bespoke path, 2px stroke when unread. */
function ChannelGlyph({ unread }: { unread: boolean }) {
  return (
    <svg aria-hidden className="ando-sidebar-conversation-channel-icon" fill="none" viewBox="0 0 24 24">
      <path d="M8.75 3.75L6.75 20.25M17.25 3.75L15.25 20.25M3.75 7.75H20.25M20.25 16.25H3.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={unread ? 2 : 1.5} />
    </svg>
  );
}

function rowIsActive(row: SidebarRow, surface: Surface) {
  return surface.kind === "channel"
    ? row.kind === "channel" && row.name === surface.name
    : row.kind === "dm" && row.who === surface.who;
}

/** sidebar-conversation/styles.css — the 32px row. */
function ConversationRow({ row, scene, unreadDms = [] }: { row: SidebarRow; scene: Scene; unreadDms?: string[] }) {
  const active = rowIsActive(row, scene.surface);
  const unread = !active && (row.kind === "channel" ? row.unread === true : unreadDms.includes(row.who));
  const muted = row.kind === "channel" && row.muted === true;
  return (
    <li className="ando-sidebar-conversation-row">
      <div className="ando-sidebar-conversation-primary">
        <span className="ando-sidebar-conversation-button" data-active={active ? "true" : "false"} data-unread={unread ? "true" : "false"} data-sidebar-dm={row.kind === "dm" ? row.who : undefined} style={muted ? { opacity: 0.55 } : undefined}>
          <span className="ando-sidebar-conversation-main">
            {row.kind === "channel" ? (
              <span className="ando-sidebar-conversation-icon">
                {row.private ? <HashtagLockIcon className="h-4 w-4 text-current" strokeWidth={unread ? 1.33 : undefined} /> : <ChannelGlyph unread={unread} />}
              </span>
            ) : (
              <span className="ando-sidebar-conversation-icon">
                <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                  <Avatar actor={scene.cast[row.who]} size={16} online={row.online ?? false} />
                </span>
              </span>
            )}
            <span className="ando-sidebar-conversation-label truncate" data-selected={active ? "true" : "false"} data-unread={unread ? "true" : "false"}>
              {row.kind === "channel" ? row.name : scene.cast[row.who].name}
            </span>
          </span>
          {unread && row.kind === "dm" ? (
            /* The landing hero's notification badge (conversations-sidebar.tsx), popping in on its pill spring. */
            <motion.span aria-hidden className="ml-auto mr-1 flex h-4 min-w-4 shrink-0 items-center justify-center rounded-[12px] bg-[#2563eb] px-1 text-[10px] font-medium leading-[10px] text-white" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ opacity: { duration: 0.12 }, scale: { type: "spring", stiffness: 480, damping: 16, mass: 0.7 } }}>1</motion.span>
          ) : null}
        </span>
      </div>
    </li>
  );
}

/** sidebar-folder-section-ui.tsx getFolderHeaderClassName + overline label. */
function FolderHeader({ label, collapsed = false }: { label: string; collapsed?: boolean }) {
  return (
    <div className="relative flex h-6 items-center gap-2 rounded-[6px] px-2 bg-transparent">
      <span className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
        <span className="relative size-4 shrink-0">
          <Icon name={collapsed ? "IconSidebarFolder" : "IconSidebarFolderOpen"} size={14} fill="filled" className="absolute inset-0 m-auto size-3.5 overflow-visible text-ando-fg-secondary" />
        </span>
        <span className="kanso-text-overline-11 min-w-0 flex-1 truncate text-ando-fg-secondary">{label}</span>
      </span>
    </div>
  );
}

/** global-sidebar-shell + sidebar-panel-header: the 354px panel. */
export function Sidebar({ scene, unreadDms = [] }: { scene: Scene; /** DM handles with something new in them. */ unreadDms?: string[] }) {
  return (
    <div className="relative flex h-full shrink-0 flex-col bg-ando-bg-main" style={{ width: 354 }}>
      {/* SidebarPanelHeaderPrimitive: surface header, padding 0 12px 0 10px */}
      <div className="ando-surface-header ando-sidebar-panel-header">
        <div className="ando-surface-header__title ando-sidebar-panel-header__switcher h-full">
          <div className="ando-tabs ando-tabs--xs h-full w-full justify-end">
            <div className="ando-tabs__list border-transparent ml-2 -mb-px">
              <span className="ando-tabs__trigger" data-state="active">Conversations</span>
              <span className="ando-tabs__trigger" data-state="inactive">Threads</span>
            </div>
          </div>
        </div>
        <div className="ando-surface-header__actions ando-sidebar-panel-header__actions">
          <span className="ando-button flex size-7 items-center justify-center !p-0" data-variant="ghost" data-size="sm"><Icon name="IconDotGrid1x3Horizontal" size={16} /></span>
          {/* sidebar-create-menu.tsx: ButtonGroup of compose + caret */}
          <span className="ando-button-group shrink-0" data-orientation="horizontal">
            <span className="ando-button w-7 px-0 !bg-ando-action-secondary !text-ando-fg-primary" data-variant="secondary" data-size="sm"><ComposeConversationIcon /></span>
            <span className="ando-button ando-button-group__caret px-0 !bg-ando-action-secondary !text-ando-fg-primary" data-variant="secondary" data-size="sm" style={{ width: 24 }}><Icon name="IconChevronDownSmall" size={12} /></span>
          </span>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-2 pt-3">
        <div className="flex flex-col gap-3">
          {SIDEBAR.map((section) => (
            <div key={section.label} className="flex flex-col">
              <FolderHeader label={section.label} collapsed={section.collapsed === true} />
              {section.collapsed ? null : <ul className="ando-sidebar-conversation-list mt-1">
                {section.rows.map((row) => (
                  <ConversationRow key={row.kind === "channel" ? row.name : row.who} row={row} scene={scene} unreadDms={unreadDms} />
                ))}
                {section.addRow ? (
                  <li className="ando-sidebar-conversation-row">
                    <span className="ando-sidebar-conversation-button" data-active="false">
                      <span className="ando-sidebar-conversation-main">
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-xs bg-ando-bg-fill-muted text-ando-fg-secondary"><Icon name="IconPlusSmall" size={16} /></span>
                        <span className="ando-sidebar-conversation-label truncate">Add conversations</span>
                      </span>
                    </span>
                  </li>
                ) : null}
              </ul>}
            </div>
          ))}
          <div className="mx-2 h-px bg-ando-border-default" />
          <ul className="ando-sidebar-conversation-list">
            {SIDEBAR_LOOSE.map((row) => (
              <ConversationRow key={row.kind === "channel" ? row.name : row.who} row={row} scene={scene} unreadDms={unreadDms} />
            ))}
          </ul>
        </div>
        </div>
    </div>
  );
}

/* --------------------------- conversation header ------------------------ */

/** conversation-header/index.tsx on SurfaceHeader. Channels get the member
 *  chip; a 1:1 DM gets the avatar title and no member action. */
export function ConversationHeader({ scene, jamControl }: { scene: Scene; jamControl: React.ReactNode }) {
  const surface = scene.surface;
  return (
    <div className="ando-surface-header ando-conversation-header-route bg-ando-bg-main">
      <div className="ando-surface-header__content"><div className="ando-surface-header__title">
        <span className="ando-button -mx-2 min-w-0 max-w-full justify-start overflow-hidden px-2" data-variant="ghost" data-size="md">
          <span className="kanso-text-label-14-md flex min-w-0 max-w-full items-center gap-2 text-ando-fg-primary">
            {surface.kind === "channel" ? (
              <>
                <span className="shrink-0">{surface.private ? <HashtagLockIcon /> : <Icon name="IconHashtag" />}</span>
                <span className="min-w-0 truncate">{surface.name}</span>
              </>
            ) : (
              <>
                <Avatar actor={scene.cast[surface.who]} size={20} />
                <span className="min-w-0 truncate">{scene.cast[surface.who].name}</span>
              </>
            )}
          </span>
        </span>
      </div></div>
      <div className="ando-surface-header__actions">
        {jamControl}
        {surface.kind === "channel" ? (
          <span className="flex items-center gap-1.5 justify-center px-2 py-1 border border-ando-border-default rounded-md">
            <Icon name="IconTeam" className="kanso-text-label-14 text-ando-fg-secondary" />
            {/* The count re-lands when it changes (a join): the row entrance, keyed on the number. */}
            <span key={surface.members} className="st-land text-sm leading-4 text-ando-fg-primary tabular-nums">{surface.members}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------- composer ------------------------------ */

function ComposerControl({ children, label, active }: { children: React.ReactNode; label: string; active?: boolean }) {
  return (
    <span className={["ando-button h-7 w-7 shrink-0 !p-0", active ? "bg-ando-bg-fill-muted text-ando-fg-primary" : ""].join(" ")} data-variant="ghost" data-size="sm" aria-label={label} role="img">
      {children}
    </span>
  );
}

/** thread-composer-presentation.tsx at rest — Aa untoggled, so no formatting
 *  strip. Live: Enter sends as the signed-in member and the message lands in
 *  the transcript at the current beat; Shift+Enter breaks a line. The typing
 *  indicator is the product's composer-placement slot above the box. */
export function Composer({ scene, typing, onSend, scripted = null }: { scene: Scene; typing: Actor | null; onSend: (text: string) => void; /** a line the script is typing for you — shown in place of your draft */ scripted?: string | null }) {
  const surface = scene.surface;
  const target = surface.kind === "channel" ? `#${surface.name}` : scene.cast[surface.who].name;
  const [draft, setDraft] = useState("");
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const shown = scripted ?? draft;
  const canSend = shown.trim().length > 0;
  // The editor grows with whatever it shows — your draft or the script's.
  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.style.height = "";
    editor.style.height = `${editor.scrollHeight}px`;
  }, [shown]);

  const submit = useCallback(() => {
    const text = draft.trim();
    if (text.length === 0) return;
    onSend(text);
    setDraft("");
    const editor = editorRef.current;
    if (editor) editor.style.height = "";
  }, [draft, onSend]);

  return (
    <div className="relative z-10 flex flex-col space-y-2 px-4 pb-4">
      <div className="relative flex flex-col">
        {typing ? <TypingIndicator actor={typing} /> : null}
        <div className="flex flex-col bg-ando-bg-input rounded-lg shadow-[0_0_0_1px_var(--color-ando-border-alpha)] overflow-hidden">
          <div className="relative min-h-[70px]">
            {/* EditorContent: kanso-text-label-14 here (the product's is 16 — 14 sits better beside 14px messages on film), px-5 pt-4. A textarea that
                grows with its content stands in for the ProseMirror editor. */}
            {/* While the script types, the text itself sits in a mirror over
                the (transparent) editor so a caret can ride the last letter —
                a read-only textarea shows none. */}
            {scripted != null ? (
              <div aria-hidden className="kanso-text-label-14 pointer-events-none absolute inset-x-0 top-0 whitespace-pre-wrap break-words px-5 pt-4 pb-1 text-ando-fg-primary">
                {scripted}
                <span className="st-caret ml-px inline-block h-[16px] w-px translate-y-[3px] bg-ando-fg-primary" />
              </div>
            ) : null}
            <textarea
              ref={editorRef}
              value={shown}
              readOnly={scripted != null}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  submit();
                }
              }}
              rows={1}
              aria-label={`Message ${target}`}
              data-stage-editor
              className={`kanso-text-label-14 block w-full resize-none bg-transparent px-5 pt-4 pb-1 outline-none ${scripted != null ? "text-transparent caret-transparent" : "text-ando-fg-primary"}`}
              style={{ minHeight: 44 }}
            />
            {shown.length === 0 ? (
              <span className="kanso-text-label-14 absolute left-5 top-4 pointer-events-none text-ando-fg-tertiary">Enter your message</span>
            ) : null}
          </div>
          <div className="flex items-center justify-between pb-3 px-3 pt-3">
            <div className="flex items-center">
              <ComposerControl label="Attach file"><Icon name="IconPaperclip1" /></ComposerControl>
              <ComposerControl label="Text formatting"><span className="flex h-4 w-4 items-center justify-center kanso-text-label-14-sb">Aa</span></ComposerControl>
              <ComposerControl label="Add emoji"><Icon name="IconEmojiSmile" /></ComposerControl>
              <ComposerControl label="Add GIF"><Icon name="IconGif" /></ComposerControl>
            </div>
            {/* ThreadComposerSendButtonPresentation + ScheduleSplitButton:
                muted while the draft is empty, primary once there is something
                to send. */}
            <span className="ando-button-group shrink-0" data-orientation="horizontal">
              <button
                type="button"
                onClick={submit}
                disabled={!canSend}
                aria-label={`Send message to ${target}`}
                data-stage-send
                className={`ando-button w-7 px-0 ${canSend ? "" : "cursor-not-allowed !bg-ando-bg-fill-muted"}`}
                data-size="sm"
              >
                <Icon name="IconPaperPlane" fill="filled" size={16} className={canSend ? "text-ando-fg-reverse" : "text-ando-fg-tertiary"} />
              </button>
              <span className="ando-button-group__separator" />
              <span className={`ando-button ando-button-group__caret px-0 ${canSend ? "text-ando-fg-reverse" : "cursor-not-allowed !bg-ando-bg-fill-muted !text-ando-fg-tertiary"}`} data-size="sm" aria-hidden style={{ width: 24 }}><Icon name="IconChevronDownSmall" size={12} /></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

