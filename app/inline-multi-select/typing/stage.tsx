"use client";

// The renderer: one Frame → one SVG. Dots draw under the disc so
// consolidation reads as a clean tuck, the avatar clips to the disc, and
// optional channels (flip/squash scale, face spin + scale, eyelid) render
// as transforms. `crop` trims the 60-unit canvas to its central 32 units —
// product scale, where the 19.2-unit avatar reads 1:1 at a 32px slot.

import { useId } from "react";
import { AVATAR, type Frame } from "./variants";

export function Stage({
  frame,
  size,
  crop = false,
  avatarSrc,
}: {
  frame: Frame;
  size: number;
  crop?: boolean;
  /** face the disc resolves into — defaults to the storyboard agent */
  avatarSrc?: string;
}) {
  const uid = useId();
  const { sats, blob, avatarO } = frame;
  const lid = Math.min(1, frame.lid ?? 1);
  const sx = blob.sx ?? 1;
  const sy = blob.sy ?? 1;
  const faceRot = frame.faceRot ?? 0;
  const faceScale = frame.faceScale ?? 1;
  const showFace = avatarO > 0 && blob.r > 0 && lid > 0;
  return (
    <svg
      viewBox={crop ? "14 14 32 32" : "0 0 60 60"}
      width={size}
      height={size}
      className="block"
      aria-hidden
    >
      {sats.map((d, i) =>
        d.rx != null ? (
          <ellipse
            key={i}
            cx={d.x}
            cy={d.y}
            rx={Math.max(0, d.rx)}
            ry={Math.max(0, d.ry ?? d.r)}
            fill={d.fill}
            opacity={d.o < 1 ? d.o : undefined}
          />
        ) : (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={Math.max(0, d.r)}
            fill={d.fill}
            opacity={d.o < 1 ? d.o : undefined}
          />
        ),
      )}
      <g transform={`translate(${blob.x} ${blob.y}) scale(${sx} ${sy})`}>
        <circle r={Math.max(0, blob.r)} fill={blob.fill} />
        {showFace && (
          <>
            <defs>
              <clipPath id={`${uid}c`}>
                <circle r={blob.r} />
              </clipPath>
              <clipPath id={`${uid}l`}>
                <rect x={-blob.r} y={-blob.r * lid} width={blob.r * 2} height={blob.r * 2 * lid} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${uid}c)`}>
              <g transform={`rotate(${faceRot}) scale(${faceScale})`}>
                <image
                  href={avatarSrc ?? AVATAR}
                  x={-blob.r}
                  y={-blob.r}
                  width={blob.r * 2}
                  height={blob.r * 2}
                  opacity={avatarO}
                  clipPath={`url(#${uid}l)`}
                  preserveAspectRatio="xMidYMid slice"
                />
              </g>
            </g>
          </>
        )}
      </g>
    </svg>
  );
}
