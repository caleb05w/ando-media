"use client";

import { useState } from "react";
import ParticleStream from "./ParticleStream";
import SlotText from "./SlotText";
import { useCyclingMessages } from "./useCyclingMessages";

const TOTAL_STEPS = 7;
const ACTIVE_STEP = 1; // zero-based — the second segment is highlighted

type Status = "idle" | "creating";

// Cycled while the agent is being created. Swap these for the real
// creation steps as the animations get built out.
const CREATING_MESSAGES = [
  "Provisioning your cloud agent…",
  "Connecting Claude Managed Agents…",
  "Finalizing your workspace…",
];

export default function OnboardingFlow() {
  const [status, setStatus] = useState<Status>("idle");
  const [name, setName] = useState("Ando");

  const creating = status === "creating";
  const canContinue = status === "idle" && name.trim().length > 0;
  const statusMessage = useCyclingMessages(CREATING_MESSAGES, { active: creating });

  function handleContinue() {
    if (canContinue) setStatus("creating");
  }

  function handleReset() {
    setStatus("idle");
    setName("Ando");
  }

  return (
    <div className="flex flex-1 flex-col bg-white text-gray-900">
      {/* Top bar */}
      <header className="relative flex items-center justify-between px-6 py-4 text-[13px]">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="font-medium text-gray-700">E2E Agent QA</span>
          <span className="text-gray-400">agent-qa-f31abcd1</span>
        </div>

        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className={
                i === ACTIVE_STEP
                  ? "h-[3px] w-9 rounded-full bg-gray-600"
                  : "h-[3px] w-6 rounded-full bg-gray-200"
              }
            />
          ))}
        </div>

        <div className="flex items-center gap-4 whitespace-nowrap text-gray-500">
          <span>qa-onboarding+agent-qa-f31abcd1@e2e.ando.local</span>
          <button
            type="button"
            onClick={handleReset}
            className="text-gray-500 transition-colors hover:text-gray-700 hover:underline"
          >
            Reset progress
          </button>
          <a href="#" className="text-blue-600 hover:underline">
            Logout
          </a>
        </div>
      </header>

      {/* Centered onboarding card */}
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="flex w-[600px] max-w-full flex-col items-center">
          <h1 className="text-center text-[28px] font-semibold leading-tight text-gray-900">
            Name your first agent
          </h1>
          <p className="mt-3 max-w-[560px] text-center text-[16px] leading-relaxed text-gray-500">
            Your first workspace agent will be a cloud agent powered by Claude
            Managed Agents. We&apos;re setting this up for you for maximal ease.
          </p>

          {/* Avatar */}
          <div className="relative mt-12 h-[100px] w-[100px]">
            {creating && <ParticleStream />}
            <div
              className="absolute inset-0 flex items-center justify-center rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 32% 28%, #c4ccba 0%, #939d8a 46%, #6c7363 100%)",
              }}
            >
              <ChatGlyph />
            </div>
          </div>

          {/* Upload */}
          <button
            type="button"
            disabled={creating}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UploadIcon />
            Upload
          </button>

          {/* Agent name */}
          <div className="mt-12 w-full">
            <label
              htmlFor="agent-name"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Agent name
            </label>
            <input
              id="agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creating}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-[15px] text-gray-900 shadow-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {/* Continue */}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className={
              canContinue
                ? "mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-neutral-800"
                : "mt-4 inline-flex w-full cursor-default items-center justify-center gap-2 rounded-lg bg-[#8c8c8c] px-4 py-3.5 text-[15px] font-medium text-white"
            }
          >
            {creating && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            Continue
          </button>

          {/* Creation status — vertical "slot" roll */}
          <div className="mt-4 h-5 w-full">
            {creating && (
              <SlotText
                message={statusMessage}
                className="h-5 text-center text-sm leading-5 text-gray-500"
              />
            )}
          </div>
        </div>
      </main>

      {/* Floating toolbar */}
      <div className="pointer-events-none flex justify-center pb-6">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-[#1d1d1f] px-1.5 py-1.5 shadow-lg">
          <ToolButton label="Send">
            <SendIcon />
          </ToolButton>
          <ToolButton label="Chat">
            <ChatIcon />
          </ToolButton>
          <ToolButton label="Theme">
            <PaletteIcon />
          </ToolButton>
          <span className="mx-0.5 h-5 w-px bg-white/15" />
          <ToolButton label="Collapse">
            <ChevronDownIcon />
          </ToolButton>
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}

function ChatGlyph() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="drop-shadow-sm"
    >
      <path
        d="M6 5h12a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-7l-4 3v-3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z"
        stroke="white"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 8.6 14.2 11 10 13.4V8.6Z" fill="white" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M12 4v12" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="13.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="12.5" r="1.1" fill="currentColor" stroke="none" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.6-.4-1a1.6 1.6 0 0 1 1.6-1.7H16c3 0 5.5-2.5 5.5-5.5C21.5 6 17.3 2 12 2Z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
