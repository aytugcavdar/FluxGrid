import { test, expect } from '@playwright/test';
import { waitForAppReady, checkConsoleErrors, expectNoConsoleErrors } from './helpers/testHelpers';

/**
 * Smoke Tests
 * Quick tests to verify basic app functionality
 * These tests should run fast and catch critical issues
 */
test.describe('Smoke Tests', () => {
  test('should load the app without errors', async ({ page }) => {
    const errors = await checkConsoleErrors(page);
    
    await page.goto('/');
    await waitForAppReady(page);
    
    // Verify page title
    await expect(page).toHaveTitle(/FluxGrid|Quantum Block Puzzle/i);
    
    // Verify no critical console errors
    expectNoConsoleErrors(page, errors);
  });

  test('should render main UI elements', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Verify body is visible
    await expect(page.locator('body')).toBeVisible();
    
    // Verify app root element exists
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await waitForAppReady(page);
    
    // Verify app loads on mobile
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    await waitForAppReady(page);
    
    // Verify app loads on tablet
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle page reload', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Reload page
    await page.reload();
    await waitForAppReady(page);
    
    // Verify app still works after reload
    await expect(page.locator('body')).toBeVisible();
  });
});
