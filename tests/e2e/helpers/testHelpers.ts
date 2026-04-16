import { Page, expect } from '@playwright/test';

/**
 * E2E Test Helper Utilities
 * Reusable functions for common test operations
 */

/**
 * Wait for the app to be fully loaded and interactive
 */
export async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).toBeVisible();
}

/**
 * Navigate to a specific route in the app
 */
export async function navigateTo(page: Page, route: string): Promise<void> {
  await page.goto(route);
  await waitForAppReady(page);
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ 
    path: `playwright-report/screenshots/${name}.png`,
    fullPage: true 
  });
}

/**
 * Wait for an element to be visible with custom timeout
 */
export async function waitForElement(
  page: Page, 
  selector: string, 
  timeout: number = 10000
): Promise<void> {
  await expect(page.locator(selector)).toBeVisible({ timeout });
}

/**
 * Check if element exists without throwing error
 */
export async function elementExists(
  page: Page, 
  selector: string, 
  timeout: number = 5000
): Promise<boolean> {
  try {
    await page.locator(selector).waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Simulate game interaction (placeholder for actual game mechanics)
 */
export async function playGame(page: Page, moves: number = 5): Promise<void> {
  // This will need to be implemented based on actual game mechanics
  // For now, just wait to simulate gameplay
  await page.waitForTimeout(moves * 100);
}

/**
 * Clear local storage and cookies
 */
export async function clearAppData(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.context().clearCookies();
}

/**
 * Mock Firebase authentication for testing
 */
export async function mockAuth(page: Page, userId: string = 'test-user'): Promise<void> {
  await page.addInitScript((uid) => {
    // Mock Firebase auth state
    (window as any).__TEST_USER_ID__ = uid;
  }, userId);
}

/**
 * Wait for network requests to complete
 */
export async function waitForNetworkIdle(page: Page, timeout: number = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Check console for errors
 */
export async function checkConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  return errors;
}

/**
 * Verify no console errors occurred
 */
export async function expectNoConsoleErrors(page: Page, errors: string[]): Promise<void> {
  expect(errors).toHaveLength(0);
}
