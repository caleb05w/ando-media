"use client";

import { useEffect, useRef, useState } from "react";

export default function SkyBackground() {
  const imgRef = useRef<HTMLImageElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const MAX = 7;
    const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      targetRef.current = { x: nx * MAX, y: ny * MAX };
    };

    let raf = 0;
    const tick = () => {
      const { x: cx, y: cy } = posRef.current;
      const { x: tx, y: ty } = targetRef.current;
      const nx = lerp(cx, tx, 0.055);
      const ny = lerp(cy, ty, 0.055);
      posRef.current = { x: nx, y: ny };
      if (imgRef.current) {
        imgRef.current.style.transform = `translate(${nx}px, ${ny}px) scale(1.02)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <img
      ref={imgRef}
      alt=""
      src="/week2-sky.png"
      className="pointer-events-none absolute inset-0 size-full object-cover"
      style={{
        transform: "scale(1.02)",
        opacity: visible ? 1 : 0,
        transition: "opacity 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      }}
    />
  );
}
