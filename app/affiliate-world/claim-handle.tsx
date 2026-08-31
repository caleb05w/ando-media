"use client";

// The claim — the ask, reduced to an email. One pill: the field
// carries the question, the round dark button carries the arrow
// (Brand's "Get access" grammar). Joining holds a place in line, it
// doesn't open the door. Prototype only: the claim succeeds locally,
// no server behind it.

import { useState } from "react";

export function ClaimHandle() {
  const [email, setEmail] = useState("");
  const [claimed, setClaimed] = useState<string | null>(null);

  if (claimed) {
    return (
      <p className="flex h-[46px] items-center font-sans text-size-sm text-text-primary">
        You&apos;re on the list — Nº 1,205 in line.
      </p>
    );
  }

  return (
    <form
      className="flex w-[300px] items-center rounded-full border-[0.5px] border-border-default bg-white p-[5px] pl-5 transition-colors ease-fast focus-within:border-[#242424]"
      onSubmit={(e) => {
        e.preventDefault();
        if (email.includes("@") && email.includes(".")) setClaimed(email);
      }}
    >
      <input
        aria-label="Your email"
        className="min-w-0 flex-1 bg-transparent py-1.5 pr-2 font-sans text-size-sm text-text-primary outline-none placeholder:text-text-tertiary"
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        type="email"
        value={email}
      />
      <button
        aria-label="Get access"
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#242424] text-[#fcfcfc] transition-colors ease-fast hover:bg-[#1a1817]"
        type="submit"
      >
        <svg
          aria-hidden
          fill="none"
          height="16"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 16 16"
          width="16"
        >
          <path d="M2.5 8H13" />
          <path d="M9 3.5 L13.5 8 L9 12.5" />
        </svg>
      </button>
    </form>
  );
}
