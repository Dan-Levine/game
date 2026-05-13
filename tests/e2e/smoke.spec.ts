import { test, expect } from '@playwright/test';
import { GamePage } from './pageObjects/GamePage';
import { PHASE1_SEED, PHASE1_TOTAL_ITEMS } from './fixtures/seededLevel';

test('canvas mounts and game reaches InLevel', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const game = new GamePage(page);
  await game.open({ seed: PHASE1_SEED });

  await expect(page.locator('#renderCanvas')).toBeVisible();
  await expect(page.locator('#tray')).toBeVisible();
  await expect(page.locator('[data-testid="tray-slot-0"]')).toBeVisible();

  await game.waitReady();

  const items = await game.items();
  expect(items.length).toBe(PHASE1_TOTAL_ITEMS);

  // Give the engine a moment to stabilize. We only verify the engine is
  // running here — the 60 FPS device target lives in Phase 1.5 on real
  // hardware. Headless chromium uses a software renderer in CI and would
  // routinely fail a tight FPS gate even when the build is healthy.
  await page.waitForTimeout(1500);
  const fps = await game.fps();
  expect(fps, `engine should be ticking, got ${fps}`).toBeGreaterThanOrEqual(5);

  // Allow benign Babylon/Havok warnings; surface anything else as a failure.
  expect(pageErrors, 'page errors').toEqual([]);
  // Filter known-noisy Babylon messages (e.g., missing optional textures).
  const significantErrors = consoleErrors.filter(
    (e) => !/decode|texture|gltf|HTTP request|loadFile/i.test(e),
  );
  expect(significantErrors, 'console errors').toEqual([]);
});
