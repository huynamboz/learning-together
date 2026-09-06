/**
 * Where a dropdown menu should sit relative to its trigger.
 *
 * A menu anchored below its trigger falls off the bottom of the screen when the trigger sits near
 * the fold — the last filter in a toolbar, a field at the end of a long form. Flipping above the
 * trigger fixes that, but flipping whenever the menu is merely tall trades one clipped menu for a
 * jumpier one, so the rule below only flips when the other side genuinely fits better.
 */

export type MenuPlacement = 'top' | 'bottom';

export type PlacementInput = {
  /** Trigger box in viewport coordinates, as `getBoundingClientRect()` reports it. */
  triggerTop: number;
  triggerBottom: number;
  viewportHeight: number;
  /** How tall the menu wants to be before any clamping. */
  contentHeight: number;
  /** Space between the trigger and the menu. */
  gap?: number;
  /** Breathing room kept against the viewport edge. */
  margin?: number;
  /** A menu shorter than this is not worth opening, so the roomier side wins outright. */
  minHeight?: number;
};

export type MenuPlacementResult = {
  placement: MenuPlacement;
  maxHeight: number;
};

/**
 * Prefers opening downward — that is what people expect and what keeps the trigger visible while
 * they read. Flips upward only when the menu cannot fit below and there is more room above, which
 * also covers the mirror case: a trigger near the top of the screen always has more room below, so
 * it stays pointing down.
 */
export function resolveMenuPlacement(input: PlacementInput): MenuPlacementResult {
  const gap = input.gap ?? 8;
  const margin = input.margin ?? 12;
  const minHeight = input.minHeight ?? 120;

  const below = Math.max(0, input.viewportHeight - input.triggerBottom - gap - margin);
  const above = Math.max(0, input.triggerTop - gap - margin);
  const wanted = Math.max(0, input.contentHeight);

  const flip = below < wanted && above > below;
  const placement: MenuPlacement = flip ? 'top' : 'bottom';
  const room = flip ? above : below;

  // Clamping to `room` is what stops a flipped menu from running off the other edge; the floor
  // keeps a scrollable sliver rather than collapsing to nothing on a very short viewport.
  return { placement, maxHeight: Math.max(minHeight, Math.min(wanted || room, room)) };
}

/** Rough height of a menu before it is in the DOM, so the first frame opens on the right side. */
export function estimateMenuHeight(optionCount: number, optionHeight = 42, padding = 12): number {
  return Math.max(optionHeight, optionCount * optionHeight) + padding;
}
