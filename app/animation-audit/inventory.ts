// GENERATED — do not edit by hand.
// Produced by scripts/build-animation-audit.mjs, which reads the Ando repo at
// ../ando and extracts every @keyframes together with the timing its real
// consumers play it at. Regenerate with: npm run audit:animations

export type Frequency = "pervasive" | "common" | "occasional" | "rare";
export type Trigger = "enter" | "exit" | "loop" | "one-shot";
export type ValueKind =
  | "token"
  | "app-local"
  | "literal"
  | "literal-bezier"
  | "named"
  | "local-var"
  | "computed"
  | "broken"
  | "unset";

export type AnimationEntry = {
  /** Keyframe name as it exists in the Ando repo. */
  name: string;
  /** Prefixed name in generated-animations.css. */
  css: string;
  file: string;
  line: number;
  surface: string;
  trigger: Trigger;
  properties: string[];
  duration: string | null;
  /** Duration normalised to milliseconds, for sorting and grouping. */
  durationMs: number | null;
  durationRaw: string | null;
  durationKind: ValueKind;
  easing: string;
  easingRaw: string | null;
  easingKind: ValueKind;
  customBezier: boolean;
  delay: string | null;
  delayKind: ValueKind;
  iteration: string | null;
  fill: string | null;
  callSites: number;
  frequency: Frequency;
  consumerCount: number;
  /** Distinct duration/easing pairs this keyframe is played at. */
  variants: string[];
  tokenBacked: boolean;
  brokenRefs: string[];
  reducedMotion: boolean;
  classNames: string[];
};

export const ANIMATIONS: AnimationEntry[] = [
  {
    "name": "ando-ui-overlay-enter",
    "css": "aa-ando-ui-overlay-enter",
    "file": "packages/ui/src/styles/motion.css",
    "line": 27,
    "surface": "UI · shared",
    "trigger": "enter",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "120ms",
    "durationMs": 120,
    "durationRaw": "var(--motion-duration-fast)",
    "durationKind": "token",
    "easing": "ease-out",
    "easingRaw": "ease-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 20,
    "frequency": "pervasive",
    "consumerCount": 5,
    "variants": [
      "120ms / ease-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "ando-alert-dialog__content",
      "ando-combobox__content",
      "ando-dialog__content",
      "ando-dropdown-menu__content",
      "ando-context-menu__content",
      "ando-select-v2__content"
    ]
  },
  {
    "name": "ando-ui-overlay-exit",
    "css": "aa-ando-ui-overlay-exit",
    "file": "packages/ui/src/styles/motion.css",
    "line": 39,
    "surface": "UI · shared",
    "trigger": "exit",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "120ms",
    "durationMs": 120,
    "durationRaw": "var(--motion-duration-fast)",
    "durationKind": "token",
    "easing": "ease-out",
    "easingRaw": "ease-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 20,
    "frequency": "pervasive",
    "consumerCount": 5,
    "variants": [
      "120ms / ease-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "ando-alert-dialog__content",
      "ando-combobox__content",
      "ando-dialog__content",
      "ando-dropdown-menu__content",
      "ando-context-menu__content",
      "ando-hover-card__c"
    ]
  },
  {
    "name": "ando-ui-pulse",
    "css": "aa-ando-ui-pulse",
    "file": "packages/ui/src/styles/motion.css",
    "line": 119,
    "surface": "UI · shared",
    "trigger": "loop",
    "properties": [
      "opacity"
    ],
    "duration": "1.4s",
    "durationMs": 1400,
    "durationRaw": "1.4s",
    "durationKind": "literal",
    "easing": "ease-in-out",
    "easingRaw": "ease-in-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": "infinite",
    "fill": null,
    "callSites": 19,
    "frequency": "pervasive",
    "consumerCount": 5,
    "variants": [
      "1.4s / ease-in-out",
      "var(--motion-duration-slow) / ease-in-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [
      "var(--motion-duration-slow)"
    ],
    "reducedMotion": true,
    "classNames": [
      "ando-link-preview__skeleton-line",
      "ando-selectable-flyout__loading-indicator",
      "ando-selectable-flyout__loading-line",
      "ando-skeleton",
      "ando-status-indicator",
      "ando-unread-dot"
    ]
  },
  {
    "name": "ando-ui-slide-from-bottom",
    "css": "aa-ando-ui-slide-from-bottom",
    "file": "packages/ui/src/styles/motion.css",
    "line": 71,
    "surface": "UI · shared",
    "trigger": "enter",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "120ms",
    "durationMs": 120,
    "durationRaw": "var(--motion-duration-fast)",
    "durationKind": "token",
    "easing": "ease-out",
    "easingRaw": "ease-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 18,
    "frequency": "pervasive",
    "consumerCount": 5,
    "variants": [
      "120ms / ease-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "ando-combobox__content",
      "ando-dropdown-menu__content",
      "ando-context-menu__content",
      "ando-tooltip__content",
      "ando-select-v2__content"
    ]
  },
  {
    "name": "ando-ui-slide-from-left",
    "css": "aa-ando-ui-slide-from-left",
    "file": "packages/ui/src/styles/motion.css",
    "line": 83,
    "surface": "UI · shared",
    "trigger": "enter",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "120ms",
    "durationMs": 120,
    "durationRaw": "var(--motion-duration-fast)",
    "durationKind": "token",
    "easing": "ease-out",
    "easingRaw": "ease-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 18,
    "frequency": "pervasive",
    "consumerCount": 4,
    "variants": [
      "120ms / ease-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "ando-combobox__content",
      "ando-dropdown-menu__content",
      "ando-context-menu__content",
      "ando-tooltip__content",
      "ando-select-v2__content"
    ]
  },
  {
    "name": "ando-ui-slide-from-right",
    "css": "aa-ando-ui-slide-from-right",
    "file": "packages/ui/src/styles/motion.css",
    "line": 95,
    "surface": "UI · shared",
    "trigger": "enter",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "120ms",
    "durationMs": 120,
    "durationRaw": "var(--motion-duration-fast)",
    "durationKind": "token",
    "easing": "ease-out",
    "easingRaw": "ease-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 18,
    "frequency": "pervasive",
    "consumerCount": 4,
    "variants": [
      "120ms / ease-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "ando-combobox__content",
      "ando-dropdown-menu__content",
      "ando-context-menu__content",
      "ando-tooltip__content",
      "ando-select-v2__content"
    ]
  },
  {
    "name": "ando-ui-slide-from-top",
    "css": "aa-ando-ui-slide-from-top",
    "file": "packages/ui/src/styles/motion.css",
    "line": 107,
    "surface": "UI · shared",
    "trigger": "enter",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "120ms",
    "durationMs": 120,
    "durationRaw": "var(--motion-duration-fast)",
    "durationKind": "token",
    "easing": "ease-out",
    "easingRaw": "ease-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 18,
    "frequency": "pervasive",
    "consumerCount": 4,
    "variants": [
      "120ms / ease-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "ando-combobox__content",
      "ando-dropdown-menu__content",
      "ando-context-menu__content",
      "ando-tooltip__content",
      "ando-select-v2__content"
    ]
  },
  {
    "name": "status-skeleton-shimmer",
    "css": "aa-status-skeleton-shimmer",
    "file": "apps/status/src/styles.css",
    "line": 230,
    "surface": "Status",
    "trigger": "loop",
    "properties": [
      "background-position"
    ],
    "duration": "1.25s",
    "durationMs": 1250,
    "durationRaw": "1.25s",
    "durationKind": "literal",
    "easing": "ease-in-out",
    "easingRaw": "ease-in-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": "infinite",
    "fill": null,
    "callSites": 13,
    "frequency": "common",
    "consumerCount": 1,
    "variants": [
      "1.25s / ease-in-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "status-skeleton"
    ]
  },
  {
    "name": "highlight-fade",
    "css": "aa-highlight-fade",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 775,
    "surface": "Web · app",
    "trigger": "one-shot",
    "properties": [
      "background-color"
    ],
    "duration": "2000ms",
    "durationMs": 2000,
    "durationRaw": "2000ms",
    "durationKind": "literal",
    "easing": "linear",
    "easingRaw": "linear",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 5,
    "frequency": "common",
    "consumerCount": 1,
    "variants": [
      "2000ms / linear"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": false,
    "classNames": [
      "animate-highlight-fade"
    ]
  },
  {
    "name": "ando-ui-fade-in",
    "css": "aa-ando-ui-fade-in",
    "file": "packages/ui/src/styles/motion.css",
    "line": 7,
    "surface": "UI · shared",
    "trigger": "enter",
    "properties": [
      "opacity"
    ],
    "duration": "120ms",
    "durationMs": 120,
    "durationRaw": "var(--motion-duration-fast)",
    "durationKind": "token",
    "easing": "ease-out",
    "easingRaw": "ease-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 5,
    "frequency": "common",
    "consumerCount": 2,
    "variants": [
      "120ms / ease-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "ando-alert-dialog__overlay",
      "ando-dialog__overlay",
      "ando-sheet__overlay"
    ]
  },
  {
    "name": "ando-ui-fade-out",
    "css": "aa-ando-ui-fade-out",
    "file": "packages/ui/src/styles/motion.css",
    "line": 17,
    "surface": "UI · shared",
    "trigger": "exit",
    "properties": [
      "opacity"
    ],
    "duration": "120ms",
    "durationMs": 120,
    "durationRaw": "var(--motion-duration-fast)",
    "durationKind": "token",
    "easing": "ease-out",
    "easingRaw": "ease-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 5,
    "frequency": "common",
    "consumerCount": 2,
    "variants": [
      "120ms / ease-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "ando-alert-dialog__overlay",
      "ando-dialog__overlay",
      "ando-sheet__overlay"
    ]
  },
  {
    "name": "sign-in-slot-exit",
    "css": "aa-sign-in-slot-exit",
    "file": "apps/web/src/app/(public)/auth/components/email-step.tsx",
    "line": 41,
    "surface": "Web · auth",
    "trigger": "exit",
    "properties": [
      "transform"
    ],
    "duration": ".7s",
    "durationMs": 700,
    "durationRaw": ".7s",
    "durationKind": "literal",
    "easing": "cubic-bezier(.62,.61,.02,1)",
    "easingRaw": "cubic-bezier(.62,.61,.02,1)",
    "easingKind": "literal-bezier",
    "customBezier": true,
    "delay": ".6s",
    "delayKind": "literal",
    "iteration": null,
    "fill": "both",
    "callSites": 4,
    "frequency": "occasional",
    "consumerCount": 1,
    "variants": [
      ".7s / cubic-bezier(.62,.61,.02,1)"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "sign-in-slot-exit"
    ]
  },
  {
    "name": "ando-ui-sheet-enter",
    "css": "aa-ando-ui-sheet-enter",
    "file": "packages/ui/src/styles/motion.css",
    "line": 51,
    "surface": "UI · shared",
    "trigger": "enter",
    "properties": [
      "transform"
    ],
    "duration": "300ms",
    "durationMs": 300,
    "durationRaw": "var(--motion-duration-moderate)",
    "durationKind": "token",
    "easing": "ease-out",
    "easingRaw": "ease-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 4,
    "frequency": "occasional",
    "consumerCount": 1,
    "variants": [
      "300ms / ease-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "ando-sheet__content"
    ]
  },
  {
    "name": "ando-ui-sheet-exit",
    "css": "aa-ando-ui-sheet-exit",
    "file": "packages/ui/src/styles/motion.css",
    "line": 61,
    "surface": "UI · shared",
    "trigger": "exit",
    "properties": [
      "transform"
    ],
    "duration": "120ms",
    "durationMs": 120,
    "durationRaw": "var(--motion-duration-fast)",
    "durationKind": "token",
    "easing": "ease-out",
    "easingRaw": "ease-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 4,
    "frequency": "occasional",
    "consumerCount": 1,
    "variants": [
      "120ms / ease-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "ando-sheet__content"
    ]
  },
  {
    "name": "sign-in-slot-enter",
    "css": "aa-sign-in-slot-enter",
    "file": "apps/web/src/app/(public)/auth/components/email-step.tsx",
    "line": 40,
    "surface": "Web · auth",
    "trigger": "enter",
    "properties": [
      "transform"
    ],
    "duration": ".7s",
    "durationMs": 700,
    "durationRaw": ".7s",
    "durationKind": "literal",
    "easing": "cubic-bezier(.62,.61,.02,1)",
    "easingRaw": "cubic-bezier(.62,.61,.02,1)",
    "easingKind": "literal-bezier",
    "customBezier": true,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": "both",
    "callSites": 3,
    "frequency": "occasional",
    "consumerCount": 1,
    "variants": [
      ".7s / cubic-bezier(.62,.61,.02,1)"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "sign-in-slot-enter"
    ]
  },
  {
    "name": "alpha-tag-stripes-drift",
    "css": "aa-alpha-tag-stripes-drift",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 571,
    "surface": "Web · app",
    "trigger": "loop",
    "properties": [
      "transform"
    ],
    "duration": "9s",
    "durationMs": 9000,
    "durationRaw": "9s",
    "durationKind": "literal",
    "easing": "linear",
    "easingRaw": "linear",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": "infinite",
    "fill": null,
    "callSites": 3,
    "frequency": "occasional",
    "consumerCount": 2,
    "variants": [
      "9s / linear"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "alpha-tag-stripes",
      "kanso-menu-panel"
    ]
  },
  {
    "name": "highlight-fade-to-bookmark",
    "css": "aa-highlight-fade-to-bookmark",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 799,
    "surface": "Web · app",
    "trigger": "one-shot",
    "properties": [
      "background-color"
    ],
    "duration": "2000ms",
    "durationMs": 2000,
    "durationRaw": "2000ms",
    "durationKind": "literal",
    "easing": "linear",
    "easingRaw": "linear",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 3,
    "frequency": "occasional",
    "consumerCount": 1,
    "variants": [
      "2000ms / linear"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": false,
    "classNames": [
      "animate-highlight-fade-to-bookmark"
    ]
  },
  {
    "name": "ando-message-highlight-fade",
    "css": "aa-ando-message-highlight-fade",
    "file": "apps/kanso/src/kanso-docs.css",
    "line": 11833,
    "surface": "Kanso · docs",
    "trigger": "loop",
    "properties": [
      "background"
    ],
    "duration": "1.7s",
    "durationMs": 1700,
    "durationRaw": "1.7s",
    "durationKind": "literal",
    "easing": "ease-out",
    "easingRaw": "ease-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": "infinite",
    "fill": null,
    "callSites": 3,
    "frequency": "occasional",
    "consumerCount": 2,
    "variants": [
      "1.7s / ease-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": false,
    "classNames": [
      "kanso-production-message-fixture",
      "ando-message-row"
    ]
  },
  {
    "name": "onboarding-agent-birth-pulse",
    "css": "aa-onboarding-agent-birth-pulse",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 451,
    "surface": "Web · app",
    "trigger": "loop",
    "properties": [
      "transform"
    ],
    "duration": "1.8s",
    "durationMs": 1800,
    "durationRaw": "1.8s",
    "durationKind": "literal",
    "easing": "cubic-bezier(0.62, 0.61, 0.02, 1)",
    "easingRaw": "var(--ease-fast)",
    "easingKind": "app-local",
    "customBezier": true,
    "delay": null,
    "delayKind": "unset",
    "iteration": "infinite",
    "fill": null,
    "callSites": 2,
    "frequency": "occasional",
    "consumerCount": 1,
    "variants": [
      "1.8s / cubic-bezier(0.62, 0.61, 0.02, 1)"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "onboarding-agent-birth-pulse"
    ]
  },
  {
    "name": "shine",
    "css": "aa-shine",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 679,
    "surface": "Web · app",
    "trigger": "loop",
    "properties": [
      "transform",
      "opacity"
    ],
    "duration": "4s",
    "durationMs": 4000,
    "durationRaw": "4s",
    "durationKind": "literal",
    "easing": "ease-in-out",
    "easingRaw": "ease-in-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": "infinite",
    "fill": null,
    "callSites": 2,
    "frequency": "occasional",
    "consumerCount": 2,
    "variants": [
      "4s / ease-in-out",
      "0.8s / ease-in-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": false,
    "classNames": [
      "animate-shimmer-processing",
      "animate-shine-on-hover"
    ]
  },
  {
    "name": "highlight-fade-dark",
    "css": "aa-highlight-fade-dark",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 787,
    "surface": "Web · app",
    "trigger": "one-shot",
    "properties": [
      "background-color"
    ],
    "duration": "2000ms",
    "durationMs": 2000,
    "durationRaw": "2000ms",
    "durationKind": "literal",
    "easing": "linear",
    "easingRaw": "linear",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 2,
    "frequency": "occasional",
    "consumerCount": 1,
    "variants": [
      "2000ms / linear"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": false,
    "classNames": [
      "animate-highlight-fade"
    ]
  },
  {
    "name": "ando-ui-collapsible-down",
    "css": "aa-ando-ui-collapsible-down",
    "file": "packages/ui/src/components/collapsible/styles.css",
    "line": 19,
    "surface": "UI · collapsible",
    "trigger": "one-shot",
    "properties": [
      "height"
    ],
    "duration": "360ms",
    "durationMs": 360,
    "durationRaw": "360ms",
    "durationKind": "literal",
    "easing": "cubic-bezier(0.22, 1, 0.36, 1)",
    "easingRaw": "cubic-bezier(0.22, 1, 0.36, 1)",
    "easingKind": "literal-bezier",
    "customBezier": true,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 2,
    "frequency": "occasional",
    "consumerCount": 1,
    "variants": [
      "360ms / cubic-bezier(0.22, 1, 0.36, 1)"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "ando-collapsible__content"
    ]
  },
  {
    "name": "ando-ui-collapsible-up",
    "css": "aa-ando-ui-collapsible-up",
    "file": "packages/ui/src/components/collapsible/styles.css",
    "line": 28,
    "surface": "UI · collapsible",
    "trigger": "one-shot",
    "properties": [
      "height"
    ],
    "duration": "360ms",
    "durationMs": 360,
    "durationRaw": "360ms",
    "durationKind": "literal",
    "easing": "cubic-bezier(0.22, 1, 0.36, 1)",
    "easingRaw": "cubic-bezier(0.22, 1, 0.36, 1)",
    "easingKind": "literal-bezier",
    "customBezier": true,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 2,
    "frequency": "occasional",
    "consumerCount": 1,
    "variants": [
      "360ms / cubic-bezier(0.22, 1, 0.36, 1)"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "ando-collapsible__content"
    ]
  },
  {
    "name": "ando-spinner-spin",
    "css": "aa-ando-spinner-spin",
    "file": "packages/ui/src/components/spinner/styles.css",
    "line": 14,
    "surface": "UI · spinner",
    "trigger": "loop",
    "properties": [
      "transform"
    ],
    "duration": "1s",
    "durationMs": 1000,
    "durationRaw": "1s",
    "durationKind": "literal",
    "easing": "linear",
    "easingRaw": "linear",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": "infinite",
    "fill": null,
    "callSites": 2,
    "frequency": "occasional",
    "consumerCount": 1,
    "variants": [
      "1s / linear"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "ando-spinner"
    ]
  },
  {
    "name": "ando-ui-spin",
    "css": "aa-ando-ui-spin",
    "file": "packages/ui/src/styles/motion.css",
    "line": 1,
    "surface": "UI · shared",
    "trigger": "loop",
    "properties": [
      "transform"
    ],
    "duration": "750ms",
    "durationMs": 750,
    "durationRaw": "var(--ando-button-spinner-duration)",
    "durationKind": "local-var",
    "easing": "linear",
    "easingRaw": "linear",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": "infinite",
    "fill": null,
    "callSites": 2,
    "frequency": "occasional",
    "consumerCount": 1,
    "variants": [
      "750ms / linear"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "ando-button__spinner",
      "ando-icon-button__spinner"
    ]
  },
  {
    "name": "kanso-profile-hint-slot-enter-up",
    "css": "aa-kanso-profile-hint-slot-enter-up",
    "file": "apps/kanso/src/examples/component-examples/auth-onboarding-surface-example.tsx",
    "line": 283,
    "surface": "Kanso · docs",
    "trigger": "enter",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "300ms",
    "durationMs": 300,
    "durationRaw": "300ms",
    "durationKind": "literal",
    "easing": "ease-in-out",
    "easingRaw": "ease-in-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": "both",
    "callSites": 2,
    "frequency": "occasional",
    "consumerCount": 1,
    "variants": [
      "300ms / ease-in-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": false,
    "classNames": [
      "kanso-profile-hint-slot-face-enter"
    ]
  },
  {
    "name": "kanso-profile-hint-slot-enter-down",
    "css": "aa-kanso-profile-hint-slot-enter-down",
    "file": "apps/kanso/src/examples/component-examples/auth-onboarding-surface-example.tsx",
    "line": 285,
    "surface": "Kanso · docs",
    "trigger": "enter",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "300ms",
    "durationMs": 300,
    "durationRaw": "300ms",
    "durationKind": "literal",
    "easing": "ease-in-out",
    "easingRaw": "ease-in-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": "both",
    "callSites": 2,
    "frequency": "occasional",
    "consumerCount": 1,
    "variants": [
      "300ms / ease-in-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": false,
    "classNames": [
      "kanso-profile-hint-slot-face-enter"
    ]
  },
  {
    "name": "onboarding-slot-enter-up",
    "css": "aa-onboarding-slot-enter-up",
    "file": "apps/web/src/app/(protected)/[workspaceId]/onboarding/components/slot-text.tsx",
    "line": 33,
    "surface": "Web · onboarding",
    "trigger": "enter",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "700ms",
    "durationMs": 700,
    "durationRaw": "700ms",
    "durationKind": "literal",
    "easing": "cubic-bezier(0.62, 0.61, 0.02, 1)",
    "easingRaw": "var(--ease-fast)",
    "easingKind": "app-local",
    "customBezier": true,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": "both",
    "callSites": 1,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "700ms / cubic-bezier(0.62, 0.61, 0.02, 1)"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "onboarding-slot-enter"
    ]
  },
  {
    "name": "onboarding-slot-exit-up",
    "css": "aa-onboarding-slot-exit-up",
    "file": "apps/web/src/app/(protected)/[workspaceId]/onboarding/components/slot-text.tsx",
    "line": 34,
    "surface": "Web · onboarding",
    "trigger": "exit",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "700ms",
    "durationMs": 700,
    "durationRaw": "700ms",
    "durationKind": "literal",
    "easing": "cubic-bezier(0.62, 0.61, 0.02, 1)",
    "easingRaw": "var(--ease-fast)",
    "easingKind": "app-local",
    "customBezier": true,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": "both",
    "callSites": 1,
    "frequency": "rare",
    "consumerCount": 2,
    "variants": [
      "700ms / cubic-bezier(0.62, 0.61, 0.02, 1)"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "onboarding-slot-exit"
    ]
  },
  {
    "name": "onboarding-slot-enter-down",
    "css": "aa-onboarding-slot-enter-down",
    "file": "apps/web/src/app/(protected)/[workspaceId]/onboarding/components/slot-text.tsx",
    "line": 35,
    "surface": "Web · onboarding",
    "trigger": "enter",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "700ms",
    "durationMs": 700,
    "durationRaw": "700ms",
    "durationKind": "literal",
    "easing": "cubic-bezier(0.62, 0.61, 0.02, 1)",
    "easingRaw": "var(--ease-fast)",
    "easingKind": "app-local",
    "customBezier": true,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 1,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "700ms / cubic-bezier(0.62, 0.61, 0.02, 1)"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "onboarding-slot-enter"
    ]
  },
  {
    "name": "onboarding-slot-exit-down",
    "css": "aa-onboarding-slot-exit-down",
    "file": "apps/web/src/app/(protected)/[workspaceId]/onboarding/components/slot-text.tsx",
    "line": 36,
    "surface": "Web · onboarding",
    "trigger": "exit",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "700ms",
    "durationMs": 700,
    "durationRaw": "700ms",
    "durationKind": "literal",
    "easing": "cubic-bezier(0.62, 0.61, 0.02, 1)",
    "easingRaw": "var(--ease-fast)",
    "easingKind": "app-local",
    "customBezier": true,
    "delay": "0.6s",
    "delayKind": "literal",
    "iteration": null,
    "fill": null,
    "callSites": 1,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "700ms / cubic-bezier(0.62, 0.61, 0.02, 1)"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "onboarding-slot-exit"
    ]
  },
  {
    "name": "typing-indicator-text-pop-in",
    "css": "aa-typing-indicator-text-pop-in",
    "file": "apps/web/src/app/common/components/typing-indicator.tsx",
    "line": 32,
    "surface": "Web · app",
    "trigger": "enter",
    "properties": [
      "opacity",
      "filter",
      "transform"
    ],
    "duration": "360ms",
    "durationMs": 360,
    "durationRaw": "var(--typing-text-duration)",
    "durationKind": "local-var",
    "easing": "cubic-bezier(0.34, 1.45, 0.64, 1)",
    "easingRaw": "var(--typing-text-ease)",
    "easingKind": "local-var",
    "customBezier": true,
    "delay": "calc(\n    var(--typing-text-stagger-index) * var(--typing-text-stagger)\n  )",
    "delayKind": "computed",
    "iteration": null,
    "fill": "both",
    "callSites": 1,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "360ms / cubic-bezier(0.34, 1.45, 0.64, 1)"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "typing-indicator-text-character"
    ]
  },
  {
    "name": "onboarding-step-fade-in",
    "css": "aa-onboarding-step-fade-in",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 311,
    "surface": "Web · app",
    "trigger": "enter",
    "properties": [
      "opacity"
    ],
    "duration": "0.25s",
    "durationMs": 250,
    "durationRaw": "0.25s",
    "durationKind": "literal",
    "easing": "cubic-bezier(0.62, 0.61, 0.02, 1)",
    "easingRaw": "var(--ease-fast)",
    "easingKind": "app-local",
    "customBezier": true,
    "delay": "calc(var(--onboarding-stagger, 0) * 70ms)",
    "delayKind": "computed",
    "iteration": null,
    "fill": "backwards",
    "callSites": 1,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "0.25s / cubic-bezier(0.62, 0.61, 0.02, 1)"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "onboarding-step-enter"
    ]
  },
  {
    "name": "onboarding-appearance-select",
    "css": "aa-onboarding-appearance-select",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 348,
    "surface": "Web · app",
    "trigger": "one-shot",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "0.5s",
    "durationMs": 500,
    "durationRaw": "0.5s",
    "durationKind": "literal",
    "easing": "cubic-bezier(0.62, 0.61, 0.02, 1)",
    "easingRaw": "var(--ease-fast)",
    "easingKind": "app-local",
    "customBezier": true,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": "both",
    "callSites": 1,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "0.5s / cubic-bezier(0.62, 0.61, 0.02, 1)"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "onboarding-appearance-select"
    ]
  },
  {
    "name": "onboarding-profile-celebrate",
    "css": "aa-onboarding-profile-celebrate",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 372,
    "surface": "Web · app",
    "trigger": "one-shot",
    "properties": [
      "transform"
    ],
    "duration": "0.45s",
    "durationMs": 450,
    "durationRaw": "0.45s",
    "durationKind": "literal",
    "easing": "cubic-bezier(0.62, 0.61, 0.02, 1)",
    "easingRaw": "var(--ease-fast)",
    "easingKind": "app-local",
    "customBezier": true,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 1,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "0.45s / cubic-bezier(0.62, 0.61, 0.02, 1)"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "onboarding-profile-celebrate"
    ]
  },
  {
    "name": "slack-backfill-complete-pop",
    "css": "aa-slack-backfill-complete-pop",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 400,
    "surface": "Web · app",
    "trigger": "one-shot",
    "properties": [
      "transform"
    ],
    "duration": "0.45s",
    "durationMs": 450,
    "durationRaw": "0.45s",
    "durationKind": "literal",
    "easing": "cubic-bezier(0.62, 0.61, 0.02, 1)",
    "easingRaw": "var(--ease-fast)",
    "easingKind": "app-local",
    "customBezier": true,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 1,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "0.45s / cubic-bezier(0.62, 0.61, 0.02, 1)"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "slack-backfill-complete-pop"
    ]
  },
  {
    "name": "slack-backfill-complete-sheen",
    "css": "aa-slack-backfill-complete-sheen",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 416,
    "surface": "Web · app",
    "trigger": "one-shot",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "1.1s",
    "durationMs": 1100,
    "durationRaw": "1.1s",
    "durationKind": "literal",
    "easing": "cubic-bezier(0.62, 0.61, 0.02, 1)",
    "easingRaw": "var(--ease-fast)",
    "easingKind": "app-local",
    "customBezier": true,
    "delay": "0.2s",
    "delayKind": "literal",
    "iteration": null,
    "fill": null,
    "callSites": 1,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "1.1s / cubic-bezier(0.62, 0.61, 0.02, 1)"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "slack-backfill-complete-sheen"
    ]
  },
  {
    "name": "reaction-float",
    "css": "aa-reaction-float",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 823,
    "surface": "Web · app",
    "trigger": "one-shot",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "3s",
    "durationMs": 3000,
    "durationRaw": "3s",
    "durationKind": "literal",
    "easing": "ease-out",
    "easingRaw": "ease-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": "forwards",
    "callSites": 1,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "3s / ease-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": false,
    "classNames": [
      "animate-reaction-float"
    ]
  },
  {
    "name": "ando-input-otp-caret",
    "css": "aa-ando-input-otp-caret",
    "file": "packages/ui/src/components/input-otp/styles.css",
    "line": 69,
    "surface": "UI · input otp",
    "trigger": "loop",
    "properties": [
      "opacity"
    ],
    "duration": "1.2s",
    "durationMs": 1200,
    "durationRaw": "1.2s",
    "durationKind": "literal",
    "easing": "ease-out",
    "easingRaw": "ease-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": "infinite",
    "fill": null,
    "callSites": 1,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "1.2s / ease-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "ando-input-otp__caret"
    ]
  },
  {
    "name": "ando-thread-reply-enter",
    "css": "aa-ando-thread-reply-enter",
    "file": "packages/ui/src/components/thread/styles.css",
    "line": 100,
    "surface": "UI · thread",
    "trigger": "enter",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "300ms",
    "durationMs": 300,
    "durationRaw": "var(--motion-duration-moderate)",
    "durationKind": "token",
    "easing": "cubic-bezier(0.2, 0, 0, 1)",
    "easingRaw": "var(--motion-easing-standard)",
    "easingKind": "token",
    "customBezier": true,
    "delay": "calc(var(--ando-thread-reply-enter-index, 0) * 24ms)",
    "delayKind": "computed",
    "iteration": null,
    "fill": "both",
    "callSites": 1,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "300ms / cubic-bezier(0.2, 0, 0, 1)"
    ],
    "tokenBacked": true,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "ando-thread-timeline"
    ]
  },
  {
    "name": "kanso-profile-hint-slot-exit-up",
    "css": "aa-kanso-profile-hint-slot-exit-up",
    "file": "apps/kanso/src/examples/component-examples/auth-onboarding-surface-example.tsx",
    "line": 282,
    "surface": "Kanso · docs",
    "trigger": "exit",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "300ms",
    "durationMs": 300,
    "durationRaw": "300ms",
    "durationKind": "literal",
    "easing": "ease-in-out",
    "easingRaw": "ease-in-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": "both",
    "callSites": 1,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "300ms / ease-in-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "kanso-profile-hint-slot-face-exit"
    ]
  },
  {
    "name": "kanso-profile-hint-slot-exit-down",
    "css": "aa-kanso-profile-hint-slot-exit-down",
    "file": "apps/kanso/src/examples/component-examples/auth-onboarding-surface-example.tsx",
    "line": 284,
    "surface": "Kanso · docs",
    "trigger": "exit",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "300ms",
    "durationMs": 300,
    "durationRaw": "300ms",
    "durationKind": "literal",
    "easing": "ease-in-out",
    "easingRaw": "ease-in-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": "both",
    "callSites": 1,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "300ms / ease-in-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "kanso-profile-hint-slot-face-exit"
    ]
  },
  {
    "name": "kanso-composer-typing-dot-pulse",
    "css": "aa-kanso-composer-typing-dot-pulse",
    "file": "apps/kanso/src/examples/component-examples/composer-example.tsx",
    "line": 165,
    "surface": "Kanso · docs",
    "trigger": "loop",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "0.9s",
    "durationMs": 900,
    "durationRaw": "0.9s",
    "durationKind": "literal",
    "easing": "ease-in-out",
    "easingRaw": "ease-in-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": "infinite",
    "fill": null,
    "callSites": 1,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "0.9s / ease-in-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "kanso-composer-typing-dot"
    ]
  },
  {
    "name": "kanso-usage-permalink-flash",
    "css": "aa-kanso-usage-permalink-flash",
    "file": "apps/kanso/src/kanso-docs.css",
    "line": 10804,
    "surface": "Kanso · docs",
    "trigger": "one-shot",
    "properties": [
      "opacity"
    ],
    "duration": "1.1s",
    "durationMs": 1100,
    "durationRaw": "1.1s",
    "durationKind": "literal",
    "easing": "ease-out",
    "easingRaw": "ease-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 1,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "1.1s / ease-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": true,
    "classNames": [
      "kanso-usage-permalink-host--anchored"
    ]
  },
  {
    "name": "onboarding-vt-fade-out",
    "css": "aa-onboarding-vt-fade-out",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 480,
    "surface": "Web · app",
    "trigger": "exit",
    "properties": [
      "opacity"
    ],
    "duration": "500ms",
    "durationMs": 500,
    "durationRaw": "500ms",
    "durationKind": "literal",
    "easing": "cubic-bezier(0.62, 0.61, 0.02, 1)",
    "easingRaw": "cubic-bezier(0.62, 0.61, 0.02, 1)",
    "easingKind": "literal-bezier",
    "customBezier": true,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": "both",
    "callSites": 0,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "500ms / cubic-bezier(0.62, 0.61, 0.02, 1)"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": false,
    "classNames": []
  },
  {
    "name": "onboarding-vt-fade-in",
    "css": "aa-onboarding-vt-fade-in",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 489,
    "surface": "Web · app",
    "trigger": "enter",
    "properties": [
      "opacity"
    ],
    "duration": "500ms",
    "durationMs": 500,
    "durationRaw": "500ms",
    "durationKind": "literal",
    "easing": "cubic-bezier(0.62, 0.61, 0.02, 1)",
    "easingRaw": "cubic-bezier(0.62, 0.61, 0.02, 1)",
    "easingKind": "literal-bezier",
    "customBezier": true,
    "delay": "250ms",
    "delayKind": "literal",
    "iteration": null,
    "fill": "both",
    "callSites": 0,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "500ms / cubic-bezier(0.62, 0.61, 0.02, 1)"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": false,
    "classNames": []
  },
  {
    "name": "shine-reverse",
    "css": "aa-shine-reverse",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 714,
    "surface": "Web · app",
    "trigger": "one-shot",
    "properties": [
      "transform",
      "opacity"
    ],
    "duration": "0.8s",
    "durationMs": 800,
    "durationRaw": "0.8s",
    "durationKind": "literal",
    "easing": "ease-in-out",
    "easingRaw": "ease-in-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": "forwards",
    "callSites": 0,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "0.8s / ease-in-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": false,
    "classNames": [
      "animate-shine-on-leave"
    ]
  },
  {
    "name": "fade-in",
    "css": "aa-fade-in",
    "file": "apps/analytics/src/app/globals.css",
    "line": 35,
    "surface": "Analytics",
    "trigger": "enter",
    "properties": [
      "opacity",
      "transform"
    ],
    "duration": "0.3s",
    "durationMs": 300,
    "durationRaw": "0.3s",
    "durationKind": "literal",
    "easing": "ease-out",
    "easingRaw": "ease-out",
    "easingKind": "named",
    "customBezier": false,
    "delay": null,
    "delayKind": "unset",
    "iteration": null,
    "fill": null,
    "callSites": 0,
    "frequency": "rare",
    "consumerCount": 1,
    "variants": [
      "0.3s / ease-out"
    ],
    "tokenBacked": false,
    "brokenRefs": [],
    "reducedMotion": false,
    "classNames": [
      "animate-fade-in"
    ]
  }
];

/** Keyframes defined in the repo with no consumer. */
export const ORPHANS = [
  {
    "name": "t-badge-slide-in",
    "file": "apps/web/src/app/(protected)/[workspaceId]/(main)/components/global-sidebar/sidebar-trailing-indicator-container.tsx",
    "line": 11
  },
  {
    "name": "onboarding-slot-exit-blur",
    "file": "apps/web/src/app/(protected)/[workspaceId]/onboarding/components/slot-text.tsx",
    "line": 37
  },
  {
    "name": "sign-in-slot-exit-blur",
    "file": "apps/web/src/app/(public)/auth/components/email-step.tsx",
    "line": 42
  },
  {
    "name": "sign-in-slot-exit-fade",
    "file": "apps/web/src/app/(public)/auth/components/email-step.tsx",
    "line": 43
  },
  {
    "name": "onboarding-step-blur-in",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 320
  },
  {
    "name": "onboarding-vt-blur-out",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 498
  },
  {
    "name": "onboarding-vt-blur-in",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 507
  },
  {
    "name": "shine-border-infinite",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 696
  },
  {
    "name": "shine-border-once",
    "file": "apps/web/src/app/styles/globals.css",
    "line": 705
  },
  {
    "name": "balloon-float",
    "file": "apps/analytics/src/app/globals.css",
    "line": 50
  },
  {
    "name": "balloon-pop",
    "file": "apps/analytics/src/app/globals.css",
    "line": 55
  },
  {
    "name": "particle-fly",
    "file": "apps/analytics/src/app/globals.css",
    "line": 61
  }
];

export const STATS = {
  "scannedFiles": 4406,
  "totalKeyframes": 60,
  "live": 48,
  "orphans": 12,
  "tokenBackedDuration": 11,
  "tokenBackedEasing": 1,
  "appLocalEasing": 10,
  "reducedMotionCovered": 36,
  "brokenRefs": 1,
  "multiVariant": 2,
  "distinctBeziers": 11,
  "distinctDurations": 21,
  "distinctDurationSpellings": 24,
  "beziers": {
    "cubic-bezier(0.16, 1, 0.3, 1)": 40,
    "cubic-bezier(0.22, 1, 0.36, 1)": 23,
    "cubic-bezier(0.62, 0.61, 0.02, 1)": 9,
    "cubic-bezier(0.2, 0, 0, 1)": 2,
    "cubic-bezier(0.34, 1.36, 0.64, 1)": 1,
    "cubic-bezier(0.4, 0, 0.2, 1)": 1,
    "cubic-bezier(0.75, 0, 0.175, 1)": 1,
    "cubic-bezier(0.34, 1.45, 0.64, 1)": 1,
    "cubic-bezier(0.7, 0, 0.2, 1)": 1,
    "cubic-bezier(0.5, 0, 0, 1)": 1,
    "cubic-bezier(0.33, 0.72, 0.2, 1)": 1
  },
  "ambient": {
    "transitions": {
      "lane": 1,
      "opacity": 84,
      "colors": 322,
      "none": 23,
      "all": 25,
      "transform": 36,
      "shadow": 3,
      "first": 1,
      "only": 1,
      "chunks": 1,
      "duration": 1
    },
    "durations": {
      "100": 1,
      "150": 54,
      "180": 3,
      "200": 77,
      "240": 11,
      "300": 23,
      "500": 3,
      "600": 1,
      "700": 3,
      "fast": 5,
      "[var": 3,
      "[800ms": 1,
      "[400ms": 2
    },
    "easings": {
      "out": 33,
      "in-out": 18,
      "fast": 10,
      "linear": 2
    },
    "animateUtilities": {
      "pulse": 36,
      "spin": 14,
      "none": 3,
      "shimmer-processing": 2,
      "highlight-fade-to-bookmark": 3,
      "highlight-fade": 2,
      "reaction-float": 1,
      "in": 3,
      "after-loading": 1
    }
  }
};
