import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names, letting the caller's classes win.
 *
 * `clsx` alone would produce `px-3 px-6` and leave the winner to CSS source
 * order, which for two utilities of equal specificity is whichever Tailwind
 * happened to emit first — so a `className` prop meant to override a default
 * would work or not depending on the rest of the app. `twMerge` resolves the
 * conflict by keeping the last one, which is what a caller means.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
