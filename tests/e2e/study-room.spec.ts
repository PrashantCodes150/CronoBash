// tests/e2e/study-room.spec.ts
import { test, expect } from '@playwright/test';

test.describe('CogniSweep Study Room E2E and Anti-Cheat Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Inject mock camera stream for media testing
    await page.goto('/study/d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a');
  });

  test('Should display onboarding modal on first entry', async ({ page }) => {
    const modalTitle = page.locator('text=FocusCam Arena Rules');
    await expect(modalTitle).toBeVisible();

    const acceptButton = page.locator('button:has-text("I Agree & Start Camera")');
    await expect(acceptButton).toBeVisible();
    
    await acceptButton.click();
    await expect(modalTitle).not.toBeVisible();
  });

  test('Should display user camera tile and active standings in room stats sidebar', async ({ page }) => {
    // Complete onboarding
    await page.locator('button:has-text("I Agree & Start Camera")').click();

    // Verify self camera tile exists
    const selfTile = page.locator('text=You');
    await expect(selfTile).toBeVisible();

    // Verify countdown timer in the sidebar is active
    const timer = page.locator('text=Time Remaining').locator('..').locator('span').nth(1);
    await expect(timer).toContainText(':');
  });

  test('Keyboard simulation triggers distraction warning flashes', async ({ page }) => {
    await page.locator('button:has-text("I Agree & Start Camera")').click();

    // Simulate keypress 'H' (for Hand-Down / Elbow trigger)
    await page.keyboard.press('h');

    // Confirm that the warning indicator overlay flashed on screen
    const distractionBadge = page.locator('text=Distraction #1');
    await expect(distractionBadge).toBeVisible();
  });

  test('Static frame loop detection alerts users of cheat risk', async ({ page }) => {
    await page.locator('button:has-text("I Agree & Start Camera")').click();

    // Simulate keypress 'D' (for static looped frame cheat detection)
    await page.keyboard.press('d');

    // Confirm cheat warning pops up
    const warningBadge = page.locator('text=Possible Fake Cam');
    await expect(warningBadge).toBeVisible();
  });
});
