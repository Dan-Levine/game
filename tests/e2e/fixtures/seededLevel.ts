// Known-good seed for the Phase 1 hardcoded level (9 apples, 9 mugs, 9 donuts).
// The seed only affects drop positions, not item counts.
export const PHASE1_SEED = 'phase1-default';
export const PHASE1_EXPECTED_TYPES = ['kitchen_apple', 'kitchen_mug', 'kitchen_donut'] as const;
export const PHASE1_ITEMS_PER_TYPE = 9;
export const PHASE1_TOTAL_ITEMS = PHASE1_ITEMS_PER_TYPE * PHASE1_EXPECTED_TYPES.length;
