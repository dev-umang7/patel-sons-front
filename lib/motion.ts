import type { Transition, Variants } from "motion/react";

/**
 * Motion language. Short for feedback, slightly longer for page-level change.
 * Mirrors the --ease-* tokens in globals.css. Reduced motion is honoured globally
 * through <MotionConfig reducedMotion="user"> in the app providers.
 */
export const duration = {
  instant: 0.08,
  fast: 0.14,
  base: 0.2,
  slow: 0.32,
  page: 0.36,
} as const;

export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const;

export const transition = {
  fast: { duration: duration.fast, ease: ease.out },
  base: { duration: duration.base, ease: ease.out },
  slow: { duration: duration.slow, ease: ease.out },
  spring: { type: "spring", stiffness: 420, damping: 36, mass: 0.8 },
} satisfies Record<string, Transition>;

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  enter: { opacity: 1, y: 0, transition: { duration: duration.page, ease: ease.out } },
};

export const listContainer: Variants = {
  initial: {},
  enter: { transition: { staggerChildren: 0.035, delayChildren: 0.04 } },
};

export const listItem: Variants = {
  initial: { opacity: 0, y: 4 },
  enter: { opacity: 1, y: 0, transition: transition.base },
};

export const fadeScale: Variants = {
  initial: { opacity: 0, scale: 0.98 },
  enter: { opacity: 1, scale: 1, transition: transition.base },
  exit: { opacity: 0, scale: 0.98, transition: transition.fast },
};
