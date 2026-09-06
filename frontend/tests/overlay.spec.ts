import { describe, expect, it } from 'vitest';
import { estimateMenuHeight, resolveMenuPlacement } from '../utils/overlay';

const field = (top: number, viewportHeight = 800, contentHeight = 288) =>
  resolveMenuPlacement({ triggerTop: top, triggerBottom: top + 48, viewportHeight, contentHeight });

describe('dropdown placement', () => {
  it('opens downward when the menu fits below the trigger', () => {
    expect(field(120).placement).toBe('bottom');
    expect(field(120).maxHeight).toBe(288);
  });

  it('flips above the trigger when the menu would run off the bottom of the screen', () => {
    const near = field(700);
    expect(near.placement).toBe('top');
    // Clamped to the room above so the flipped menu cannot run off the top edge either.
    expect(near.maxHeight).toBe(288);
  });

  it('keeps a trigger near the top of the screen pointing downward', () => {
    // Nothing fits above, so the tighter space below is still the better side.
    expect(field(8).placement).toBe('bottom');
  });

  it('scrolls a tall menu rather than letting it overflow the side it opens on', () => {
    const tall = resolveMenuPlacement({ triggerTop: 500, triggerBottom: 548, viewportHeight: 800, contentHeight: 600 });
    expect(tall.placement).toBe('top');
    expect(tall.maxHeight).toBe(480);
  });

  it('never collapses to an unusable sliver on a short viewport', () => {
    const cramped = resolveMenuPlacement({ triggerTop: 150, triggerBottom: 198, viewportHeight: 220, contentHeight: 288 });
    expect(cramped.maxHeight).toBeGreaterThanOrEqual(120);
  });

  it('estimates a height before the menu exists so the first frame opens on the right side', () => {
    expect(estimateMenuHeight(0)).toBe(54);
    expect(estimateMenuHeight(5)).toBe(222);
  });
});
