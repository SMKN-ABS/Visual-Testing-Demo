const { test, expect } = require('@playwright/test');

test.describe('To-Do App — UI / Accessibility / Responsive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page title is present', async ({ page }) => {
    await expect(page).toHaveTitle('React Starter');
  });

  test('input has accessible placeholder text', async ({ page }) => {
    const input = page.locator('[placeholder="Enter a task"]');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', 'Enter a task');
  });

  test('Add button is visible and enabled', async ({ page }) => {
    const btn = page.locator('button:has-text("Add")');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('task structure has checkbox and delete button', async ({ page }) => {
    await page.fill('[placeholder="Enter a task"]', 'Test structure');
    await page.click('button:has-text("Add")');

    const li = page.locator('li').first();
    await expect(li.locator('input[type="checkbox"]')).toBeVisible();
    await expect(li.locator('button:has-text("Delete")')).toBeVisible();
    await expect(li.locator('button:has-text("Delete")')).toBeEnabled();
  });

  test('counter updates reactively across operations', async ({ page }) => {
    const counter = page.locator('text=/Total tasks:/i');

    await expect(counter).toHaveText(/Total tasks: 0/i);

    await page.fill('[placeholder="Enter a task"]', 'One');
    await page.click('button:has-text("Add")');
    await expect(counter).toHaveText(/Total tasks: 1/i);

    await page.fill('[placeholder="Enter a task"]', 'Two');
    await page.click('button:has-text("Add")');
    await expect(counter).toHaveText(/Total tasks: 2/i);

    await page.locator('button:has-text("Delete")').first().click();
    await expect(counter).toHaveText(/Total tasks: 1/i);
  });
});
