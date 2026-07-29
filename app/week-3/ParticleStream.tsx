"use client";

import { useEffect, useRef } from "react";

/**
 * Light particle field that streams dust inward toward the avatar. Particles
 * spawn in a ring just outside the disc, drift toward the center, and fade out
 * at the rim (where the opaque avatar disc also occludes them) — so they read
 * as being absorbed "into" the agent. Rendered behind the disc.
 */

const SIZE = 210; // canvas logical size (square), centered on the avatar
const DISC_R = 50; // avatar disc radius — particles vanish here
const SPAWN_MIN = 60;
const SPAWN_MAX = 94;
const COUNT = 26; // kept low — "very lightly"

type Particle = {
  angle: number;
  drift: number; // slight tangential curve, rad/s
  r: number;
  speed: number; // inward px/s
  size: number;
  alpha: number;
  life: number; // seconds alive, for fade-in
};

export default function ParticleStream() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.scale(dpr, dpr);

    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const spawn = (): Particle => ({
      angle: rand(0, Math.PI * 2),
      drift: rand(-0.12, 0.12),
      r: rand(SPAWN_MIN, SPAWN_MAX),
      speed: rand(11, 24),
      size: rand(0.8, 1.8),
      alpha: rand(0.16, 0.38),
      life: 0,
    });

    const particles: Particle[] = Array.from(
      { length: reduce ? 0 : COUNT },
      spawn
    );

    let raf = 0;
    let prev = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      ctx.clearRect(0, 0, SIZE, SIZE);

      for (const p of particles) {
        p.life += dt;
        p.r -= p.speed * dt;
        p.angle += p.drift * dt;
        if (p.r <= DISC_R) Object.assign(p, spawn());

        const fadeIn = Math.min(p.life / 0.6, 1);
        const fadeOut = Math.min(Math.max((p.r - DISC_R) / 12, 0), 1);
        const a = p.alpha * fadeIn * fadeOut;
        if (a <= 0) continue;

        const x = cx + Math.cos(p.angle) * p.r;
        const y = cy + Math.sin(p.angle) * p.r;

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(108, 115, 99, ${a})`; // muted olive, matches the disc
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width: SIZE, height: SIZE }}
    />
  );
}
