const { test, expect } = require('@playwright/test');
const { installScreenshotTestNameHook } = require('./helpers/screenshot-testname');

test.describe('To-Do App — Core User Flows', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await installScreenshotTestNameHook(page, testInfo);
    await page.goto('/');
  });

  // ── Flow 1: Add a Task ────────────────────────────────────────────────
  test('user can add a task and see it in the list', async ({ page }) => {
    const taskName = 'Buy groceries';

    await expect(page.locator('[placeholder="Enter a task"]')).toBeVisible();
    await page.fill('[placeholder="Enter a task"]', taskName);
    await page.click('button:has-text("Add")');

    const taskItem = page.locator('li').filter({ hasText: taskName });
    await expect(taskItem).toBeVisible();
    await expect(taskItem).not.toHaveClass(/completed/);
    await expect(page.locator('text=/Total tasks: 1/i')).toBeVisible();
  });

  // ── Flow 2: Complete a Task ───────────────────────────────────────────
  test('user can mark a task as completed', async ({ page }) => {
    await page.fill('[placeholder="Enter a task"]', 'Walk the dog');
    await page.click('button:has-text("Add")');

    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check();

    const taskItem = page.locator('li').filter({ hasText: 'Walk the dog' });
    await expect(taskItem).toHaveClass(/completed/);
    await expect(checkbox).toBeChecked();
  });

  // ── Flow 3: Uncheck a Task ────────────────────────────────────────────
  test('user can uncheck a completed task', async ({ page }) => {
    await page.fill('[placeholder="Enter a task"]', 'Read book');
    await page.click('button:has-text("Add")');

    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check();
    await expect(page.locator('li').first()).toHaveClass(/completed/);

    await checkbox.uncheck();
    await expect(page.locator('li').first()).not.toHaveClass(/completed/);
    await expect(checkbox).not.toBeChecked();
  });

  // ── Flow 4: Delete a Task ─────────────────────────────────────────────
  test('user can delete a task', async ({ page }) => {
    await page.fill('[placeholder="Enter a task"]', 'Call dentist');
    await page.click('button:has-text("Add")');

    await page.click('button:has-text("Delete")');

    await expect(page.locator('li').filter({ hasText: 'Call dentist' })).toHaveCount(0);
    await expect(page.locator('text=/Total tasks: 0/i')).toBeVisible();
  });

  // ── Flow 5: Manage Multiple Tasks ─────────────────────────────────────
  test('user can add multiple tasks, complete some, and delete selectively', async ({ page }) => {
    const tasks = ['Task A', 'Task B', 'Task C'];

    for (const task of tasks) {
      await page.fill('[placeholder="Enter a task"]', task);
      await page.click('button:has-text("Add")');
    }

    await expect(page.locator('li')).toHaveCount(3);
    await expect(page.locator('text=/Total tasks: 3/i')).toBeVisible();

    // Complete Task A
    await page.locator('li').filter({ hasText: 'Task A' }).locator('input[type="checkbox"]').check();
    await expect(page.locator('li').filter({ hasText: 'Task A' })).toHaveClass(/completed/);

    // Complete Task B
    await page.locator('li').filter({ hasText: 'Task B' }).locator('input[type="checkbox"]').check();

    // Delete Task B
    await page.locator('li').filter({ hasText: 'Task B' }).locator('button:has-text("Delete")').click();

    // Verify final state
    await expect(page.locator('li')).toHaveCount(2);
    await expect(page.locator('li').filter({ hasText: 'Task A' })).toHaveClass(/completed/);
    await expect(page.locator('li').filter({ hasText: 'Task C' })).not.toHaveClass(/completed/);
    await expect(page.locator('text=/Total tasks: 2/i')).toBeVisible();
  });

  // ── Flow 6: Delete from Middle ────────────────────────────────────────
  test('user can delete the middle task in a list of three', async ({ page }) => {
    for (const task of ['First', 'Middle', 'Last']) {
      await page.fill('[placeholder="Enter a task"]', task);
      await page.click('button:has-text("Add")');
    }

    await page.locator('li').nth(1).locator('button:has-text("Delete")').click();

    await expect(page.locator('li')).toHaveCount(2);
    await expect(page.locator('li').first()).toHaveText(/First/);
    await expect(page.locator('li').last()).toHaveText(/Last/);
  });

  // ── Flow 7: Complete All and Delete All ───────────────────────────────
  test('user can complete all tasks then delete them all', async ({ page }) => {
    for (const task of ['Alpha', 'Beta', 'Gamma']) {
      await page.fill('[placeholder="Enter a task"]', task);
      await page.click('button:has-text("Add")');
    }

    for (const cb of await page.locator('input[type="checkbox"]').all()) {
      await cb.check();
    }
    await expect(page.locator('li.completed')).toHaveCount(3);

    while (await page.locator('button:has-text("Delete")').count() > 0) {
      await page.locator('button:has-text("Delete")').first().click();
    }

    await expect(page.locator('li')).toHaveCount(0);
    await expect(page.locator('text=/Total tasks: 0/i')).toBeVisible();
    await expect(page.locator('[placeholder="Enter a task"]')).toBeEmpty();
  });
});
