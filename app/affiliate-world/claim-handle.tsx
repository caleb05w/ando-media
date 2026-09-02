"use client";

// The claim — the whole ask, reduced to a name. One pill: the field
// carries the domain so the visitor only types who they are, and the
// round dark button carries the arrow (Brand's "Get access" grammar).
// Claiming a handle holds a place in line, it doesn't open the door.
// Prototype only: the claim succeeds locally, no server behind it.

import { useState } from "react";

export function ClaimHandle() {
  const [handle, setHandle] = useState("");
  const [claimed, setClaimed] = useState<string | null>(null);

  if (claimed) {
    return (
      <p className="flex h-11 items-center font-sans text-size-sm text-text-primary">
        {`ando.so/@${claimed} is held — you're Nº 1,205 in line.`}
      </p>
    );
  }

  return (
    <form
      className="flex h-11 w-[340px] max-w-full items-center rounded-full border-[0.5px] border-border-default bg-white pl-5 transition-colors ease-fast focus-within:border-[#242424]"
      onSubmit={(e) => {
        e.preventDefault();
        if (handle) setClaimed(handle);
      }}
    >
      <span className="font-sans text-size-sm text-text-tertiary">ando.so/@</span>
      <input
        aria-label="Your handle"
        className="min-w-0 flex-1 bg-transparent py-1.5 pr-2 font-sans text-size-sm text-text-primary outline-none placeholder:text-text-tertiary"
        onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
        placeholder="yourname"
        value={handle}
      />
      {/* flush to the pill — the circle IS the right edge, no gutter */}
      <button
        aria-label="Claim your handle"
        className="-my-px -mr-px flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#242424] text-[#fcfcfc] transition-colors ease-fast hover:bg-[#1a1817]"
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
