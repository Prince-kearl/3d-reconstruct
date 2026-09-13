import type { SegmentationResult } from "@/lib/segmentation/types";

/**
 * A cheap, deterministic fingerprint of a mask's content — used to detect
 * whether the mask has changed since multi-view views were generated against
 * it (staleness), in a way that's stable across reloads (unlike a
 * session-local incrementing counter, which would reset on every page load
 * and falsely mark everything stale).
 */
export function computeMaskFingerprint(mask: SegmentationResult): string {
  let sum = 0;
  for (let i = 0; i < mask.data.length; i++) sum += mask.data[i]!;
  return `${mask.width}x${mask.height}:${sum.toFixed(3)}`;
}
