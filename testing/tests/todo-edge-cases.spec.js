const { test, expect } = require('@playwright/test');

test.describe('To-Do App — Edge Cases & Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('empty input should not create a task', async ({ page }) => {
    await page.click('button:has-text("Add")');
    await expect(page.locator('li')).toHaveCount(0);
    await expect(page.locator('text=/Total tasks: 0/i')).toBeVisible();
  });

  test('whitespace-only input should not create a task', async ({ page }) => {
    await page.fill('[placeholder="Enter a task"]', '     ');
    await page.click('button:has-text("Add")');
    await expect(page.locator('li')).toHaveCount(0);
    await expect(page.locator('text=/Total tasks: 0/i')).toBeVisible();
  });

  test('user can add duplicate task names', async ({ page }) => {
    await page.fill('[placeholder="Enter a task"]', 'Water plants');
    await page.click('button:has-text("Add")');
    await page.fill('[placeholder="Enter a task"]', 'Water plants');
    await page.click('button:has-text("Add")');

    await expect(page.locator('li')).toHaveCount(2);
    await expect(page.locator('text=/Total tasks: 2/i')).toBeVisible();
  });

  test('input field is cleared after adding a task', async ({ page }) => {
    await page.fill('[placeholder="Enter a task"]', 'Clean room');
    await page.click('button:has-text("Add")');
    await expect(page.locator('[placeholder="Enter a task"]')).toHaveValue('');
  });

  test('long task name is accepted (truncated by app)', async ({ page }) => {
    const longName = 'A'.repeat(200);
    await page.fill('[placeholder="Enter a task"]', longName);
    await page.click('button:has-text("Add")');

    await expect(page.locator('li')).toHaveCount(1);
    // App truncates the name; verify it's non-empty and task exists
    const text = await page.locator('li').first().textContent();
    expect(text.replace('Delete', '').trim().length).toBeGreaterThan(0);
  });

  test('special characters in task name are preserved', async ({ page }) => {
    const special = 'Task <script>alert(1)</script> & more! 🎉';
    await page.fill('[placeholder="Enter a task"]', special);
    await page.click('button:has-text("Add")');

    await expect(page.locator('li').first()).toContainText(special);
    // Verify no unexpected script injection side-effects
    await expect(page.locator('script')).toHaveCount(1); // only the react bundle
  });
});
