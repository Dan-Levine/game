import { test, expect } from '@playwright/test';
import { GamePage } from './pageObjects/GamePage';
import { PHASE1_SEED } from './fixtures/seededLevel';

test('committing 3 of a type triggers a match_cleared event', async ({ page }) => {
  const game = new GamePage(page);
  await game.open({ seed: PHASE1_SEED });
  await game.waitReady();

  await game.clearEvents();
  await game.commitNByType('kitchen_apple', 3);

  // The third commit clears the tray.
  const tray = await game.tray();
  expect(tray.filter((s) => s !== null)).toEqual([]);

  const events = await game.events();
  const matches = events.filter((e) => e.name === 'match_cleared');
  expect(matches.length).toBe(1);
  expect((matches[0]!.payload as { type: { id: string }; count: number }).type.id).toBe(
    'kitchen_apple',
  );
});

test('committing 3 non-matching items leaves them in the tray', async ({ page }) => {
  const game = new GamePage(page);
  await game.open({ seed: PHASE1_SEED });
  await game.waitReady();

  await game.clearEvents();
  await game.commitFirstByType('kitchen_apple');
  await page.waitForTimeout(380);
  await game.commitFirstByType('kitchen_mug');
  await page.waitForTimeout(380);
  await game.commitFirstByType('kitchen_donut');
  await page.waitForTimeout(380);

  const tray = await game.tray();
  const filled = tray.filter((s) => s !== null);
  expect(filled.length).toBe(3);

  const events = await game.events();
  expect(events.filter((e) => e.name === 'match_cleared')).toHaveLength(0);
});
