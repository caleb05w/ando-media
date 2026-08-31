"use client";

// The claim — the whole ask, reduced to a name. The field carries the
// domain so the visitor only types who they are; claiming a handle
// holds a place in line, it doesn't open the door. Prototype only:
// the claim succeeds locally, no server behind it.

import { useState } from "react";

export function ClaimHandle() {
  const [handle, setHandle] = useState("");
  const [claimed, setClaimed] = useState<string | null>(null);

  if (claimed) {
    return (
      <p className="flex h-[42px] items-center font-sans text-size-sm text-text-primary">
        {`ando.so/@${claimed} is held — you're Nº 1,205 in line.`}
      </p>
    );
  }

  return (
    <form
      className="flex items-stretch"
      onSubmit={(e) => {
        e.preventDefault();
        if (handle) setClaimed(handle);
      }}
    >
      <label className="flex items-center border-[0.5px] border-border-default bg-white pl-3.5 transition-colors ease-fast focus-within:border-[#242424]">
        <span className="font-sans text-size-sm text-text-tertiary">ando.so/@</span>
        <input
          aria-label="Your handle"
          className="w-[120px] bg-transparent py-2.5 pr-3 font-sans text-size-sm text-text-primary outline-none placeholder:text-text-tertiary"
          onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          placeholder="yourname"
          value={handle}
        />
      </label>
      <button
        className="flex cursor-pointer items-center bg-[#242424] px-4 font-sans text-size-sm tracking-[-0.02em] text-[#fcfcfc] transition-colors ease-fast hover:bg-[#1a1817]"
        type="submit"
      >
        Claim
      </button>
    </form>
  );
}
