import { Page, expect } from '@playwright/test';

// Page object wrapping window.__game__ debug surface, plus DOM probes.
export class GamePage {
  constructor(public readonly page: Page) {}

  async open(opts: { seed?: string | number } = {}): Promise<void> {
    const params = new URLSearchParams();
    if (opts.seed !== undefined) params.set('seed', String(opts.seed));
    const qs = params.toString();
    await this.page.goto(qs ? `/?${qs}` : '/');
  }

  async waitReady(timeoutMs = 30_000): Promise<void> {
    await this.page.waitForFunction(
      () => !!(window as unknown as { __game__?: { isReady: () => boolean } }).__game__?.isReady(),
      undefined,
      { timeout: timeoutMs },
    );
  }

  async items(): Promise<Array<{ id: string; typeId: string; isInTray: boolean }>> {
    return this.page.evaluate(
      () =>
        (window as unknown as {
          __game__: { getItems: () => Array<{ id: string; typeId: string; isInTray: boolean }> };
        }).__game__.getItems(),
    );
  }

  async commitFirstByType(typeId: string): Promise<boolean> {
    return this.page.evaluate(
      ({ t }) =>
        (window as unknown as {
          __game__: { commitFirstByType: (id: string) => Promise<boolean> };
        }).__game__.commitFirstByType(t),
      { t: typeId },
    );
  }

  async commitNByType(typeId: string, n: number): Promise<void> {
    for (let i = 0; i < n; i++) {
      const ok = await this.commitFirstByType(typeId);
      expect(ok, `commit #${i + 1} of ${typeId}`).toBe(true);
      // Give the arc animation time to finish.
      await this.page.waitForTimeout(380);
    }
  }

  async tray(): Promise<Array<{ typeId: string; itemId: string } | null>> {
    return this.page.evaluate(
      () =>
        (window as unknown as {
          __game__: { getTrayState: () => Array<{ typeId: string; itemId: string } | null> };
        }).__game__.getTrayState(),
    );
  }

  async events(): Promise<Array<{ name: string; payload: unknown }>> {
    return this.page.evaluate(
      () =>
        (window as unknown as {
          __game__: { getEventLog: () => Array<{ name: string; payload: unknown }> };
        }).__game__.getEventLog(),
    );
  }

  async clearEvents(): Promise<void> {
    await this.page.evaluate(() =>
      (window as unknown as { __game__: { clearEventLog: () => void } }).__game__.clearEventLog(),
    );
  }

  async fps(): Promise<number> {
    return this.page.evaluate(
      () => (window as unknown as { __game__: { getFps: () => number } }).__game__.getFps(),
    );
  }
}
