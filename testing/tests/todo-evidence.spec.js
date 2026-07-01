const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const EVIDENCE_DIR = path.join(__dirname, '..', 'evidence');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

// Clean previous evidence
for (const f of fs.readdirSync(EVIDENCE_DIR)) {
  if (f.endsWith('.png')) fs.unlinkSync(path.join(EVIDENCE_DIR, f));
}

const results = [];
let step = 0;

async function stepAction(page, label, fn) {
  step += 1;
  const id = String(step).padStart(2, '0');
  const okPath = path.join(EVIDENCE_DIR, `${id}-success-${label.replace(/\s+/g, '_')}.png`);
  const failPath = path.join(EVIDENCE_DIR, `${id}-FAILED-${label.replace(/\s+/g, '_')}.png`);
  try {
    await fn();
    await page.screenshot({ path: okPath, fullPage: true });
    results.push({ step: id, label, status: 'PASS', shot: path.basename(okPath) });
    // eslint-disable-next-line no-console
    console.log(`[PASS] ${id} — ${label}`);
  } catch (err) {
    await page.screenshot({ path: failPath, fullPage: true });
    results.push({ step: id, label, status: 'FAIL', shot: path.basename(failPath), error: err.message });
    // eslint-disable-next-line no-console
    console.error(`[FAIL] ${id} — ${label}: ${err.message}`);
    throw err;
  }
}

test.describe('Todo App — feature evidence with screenshots', () => {
  test('verify all features step by step', async ({ page }) => {
    // 1. Load page
    await stepAction(page, 'load home page', async () => {
      await page.goto('/');
      await expect(page).toHaveTitle('React Starter');
    });

    // 2. Input visible with correct placeholder
    await stepAction(page, 'input has accessible placeholder', async () => {
      const input = page.locator('[placeholder="Enter a task"]');
      await expect(input).toBeVisible();
      await expect(input).toHaveAttribute('placeholder', 'Enter a task');
    });

    // 3. Add button visible & enabled
    await stepAction(page, 'Add button visible and enabled', async () => {
      const btn = page.locator('button:has-text("Add")');
      await expect(btn).toBeVisible();
      await expect(btn).toBeEnabled();
    });

    // 4. Counter starts at 0
    await stepAction(page, 'counter shows Total tasks: 0', async () => {
      await expect(page.locator('text=/Total tasks: 0/i')).toBeVisible();
    });

    // 5. Empty input does not create a task
    await stepAction(page, 'empty input creates no task', async () => {
      await page.click('button:has-text("Add")');
      await expect(page.locator('li')).toHaveCount(0);
    });

    // 6. Whitespace-only input does not create a task
    await stepAction(page, 'whitespace input creates no task', async () => {
      await page.fill('[placeholder="Enter a task"]', '     ');
      await page.click('button:has-text("Add")');
      await expect(page.locator('li')).toHaveCount(0);
    });

    // 7. Add a task
    await stepAction(page, 'add task Buy groceries', async () => {
      await page.fill('[placeholder="Enter a task"]', 'Buy groceries');
      await page.click('button:has-text("Add")');
      const item = page.locator('li').filter({ hasText: 'Buy groceries' });
      await expect(item).toBeVisible();
      await expect(item).not.toHaveClass(/completed/);
      await expect(page.locator('text=/Total tasks: 1/i')).toBeVisible();
    });

    // 8. Input cleared after add
    await stepAction(page, 'input cleared after add', async () => {
      await expect(page.locator('[placeholder="Enter a task"]')).toHaveValue('');
    });

    // 9. Task structure: checkbox + delete
    await stepAction(page, 'task has checkbox and delete button', async () => {
      const li = page.locator('li').first();
      await expect(li.locator('input[type="checkbox"]')).toBeVisible();
      await expect(li.locator('button:has-text("Delete")')).toBeVisible();
      await expect(li.locator('button:has-text("Delete")')).toBeEnabled();
    });

    // 10. Complete a task
    await stepAction(page, 'mark task completed', async () => {
      const cb = page.locator('input[type="checkbox"]').first();
      await cb.check();
      await expect(page.locator('li').first()).toHaveClass(/completed/);
      await expect(cb).toBeChecked();
    });

    // 11. Uncheck a task
    await stepAction(page, 'uncheck completed task', async () => {
      const cb = page.locator('input[type="checkbox"]').first();
      await cb.uncheck();
      await expect(page.locator('li').first()).not.toHaveClass(/completed/);
      await expect(cb).not.toBeChecked();
    });

    // 12. Add multiple tasks
    await stepAction(page, 'add Task B and Task C', async () => {
      for (const t of ['Task B', 'Task C']) {
        await page.fill('[placeholder="Enter a task"]', t);
        await page.click('button:has-text("Add")');
      }
      await expect(page.locator('li')).toHaveCount(3);
      await expect(page.locator('text=/Total tasks: 3/i')).toBeVisible();
    });

    // 13. Duplicate names allowed
    await stepAction(page, 'add duplicate name Task C', async () => {
      await page.fill('[placeholder="Enter a task"]', 'Task C');
      await page.click('button:has-text("Add")');
      await expect(page.locator('li')).toHaveCount(4);
      await expect(page.locator('text=/Total tasks: 4/i')).toBeVisible();
    });

    // 14. Delete the duplicate (middle-ish) task
    await stepAction(page, 'delete a middle task', async () => {
      await page.locator('li').nth(1).locator('button:has-text("Delete")').click();
      await expect(page.locator('li')).toHaveCount(3);
    });

    // 15. Counter reacts to delete
    await stepAction(page, 'counter reacts to delete', async () => {
      await expect(page.locator('text=/Total tasks: 3/i')).toBeVisible();
    });

    // 16. Special characters preserved & no script injection
    await stepAction(page, 'special chars preserved no XSS', async () => {
      const special = 'Task <script>alert(1)</script> & more! 🎉';
      await page.fill('[placeholder="Enter a task"]', special);
      await page.click('button:has-text("Add")');
      await expect(page.locator('li').last()).toContainText(special);
      await expect(page.locator('script')).toHaveCount(1);
    });

    // 17. Long task name accepted
    await stepAction(page, 'long task name accepted', async () => {
      await page.fill('[placeholder="Enter a task"]', 'A'.repeat(200));
      await page.click('button:has-text("Add")');
      await expect(page.locator('li')).toHaveCount(5);
      const text = await page.locator('li').last().textContent();
      expect(text.replace('Delete', '').trim().length).toBeGreaterThan(0);
    });

    // 18. Complete all then delete all
    await stepAction(page, 'complete all then delete all', async () => {
      for (const cb of await page.locator('input[type="checkbox"]').all()) {
        await cb.check();
      }
      await expect(page.locator('li.completed')).toHaveCount(5);
      while (await page.locator('button:has-text("Delete")').count() > 0) {
        await page.locator('button:has-text("Delete")').first().click();
      }
      await expect(page.locator('li')).toHaveCount(0);
      await expect(page.locator('text=/Total tasks: 0/i')).toBeVisible();
      await expect(page.locator('[placeholder="Enter a task"]')).toBeEmpty();
    });

    // Final summary screenshot
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'FINAL-state.png'), fullPage: true });

    // Write results manifest
    fs.writeFileSync(
      path.join(EVIDENCE_DIR, 'results.json'),
      JSON.stringify({ total: results.length, passed: results.filter((r) => r.status === 'PASS').length, failed: results.filter((r) => r.status === 'FAIL').length, results },
        null, 2)
    );
  });
});
