import { test, expect } from '@playwright/test';

test('share link restores selected days', async ({ page }) => {
  // Open app
  await page.goto('/');

  // Select two working days (title Workday/Arbeitstag)
  const workdayButton = page.locator('button[title*="Workday"], button[title*="Arbeitstag"]');
  await expect(workdayButton.first()).toBeVisible();
  await workdayButton.nth(0).click();
  await workdayButton.nth(1).click();

  // Open Share tab (Teilen)
  const shareTab = page.getByRole('tab', { name: /Share|Teilen/ });
  await shareTab.click();

  // Click Copy link (Link kopieren)
  const copyBtn = page.getByRole('button', { name: /Copy link|Link kopieren/ });
  await copyBtn.click();

  // Read link from clipboard
  const link = await page.evaluate(async () => await navigator.clipboard.readText());
  expect(link).toContain('#plan=');

  // Navigate to the shared link
  await page.goto(link);

  // Ensure state is restored: selected days table has at least 2 rows
  // Switch to Vacation tab (Urlaub) just in case
  const vacationTab = page.getByRole('tab', { name: /Vacation|Urlaub/ });
  await vacationTab.click();

  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCountGreaterThan(1);
});

