"use client";

import { useEffect } from "react";

// Marks documents that render inside another page — the homepage shows every
// route as a scaled iframe thumbnail, and dev chrome (Agentation, DialKit)
// reads as a stray dot at 1/4 scale. Set after hydration so the server and
// client HTML stay identical; globals.css hides the chrome off the flag.
export function FramedFlag() {
  useEffect(() => {
    if (window.self !== window.top) {
      document.documentElement.setAttribute("data-framed", "");
    }
  }, []);
  return null;
}
