function bannerScript() {
  return ({ id, text }) => {
    const render = () => {
      if (!document.body) return;

      const existing = document.getElementById(id);
      if (existing) existing.remove();

      const banner = document.createElement('div');
      banner.id = id;
      banner.textContent = `Test: ${text}`;
      banner.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'right:0',
        'box-sizing:border-box',
        'padding:8px 12px',
        'background:rgba(17,24,39,0.95)',
        'color:#ffffff',
        'font:600 13px/1.3 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        'border-bottom:1px solid #374151',
        'z-index:2147483647',
        'pointer-events:none',
      ].join(';');

      document.body.appendChild(banner);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', render, { once: true });
    } else {
      render();
    }
  };
}

async function installScreenshotTestNameHook(page, testInfo) {
  const bannerId = '__pw-test-name-banner__';
  const testTitle = testInfo.titlePath.slice(1).join(' › ');

  await page.addInitScript(bannerScript(), { id: bannerId, text: testTitle });

  const originalScreenshot = page.screenshot.bind(page);
  page.screenshot = async (options = {}) => {
    try {
      await page.evaluate(bannerScript(), { id: bannerId, text: testTitle });
    } catch (_) {
      // Ignore banner injection failures and still allow screenshot capture.
    }
    return originalScreenshot(options);
  };
}

module.exports = {
  installScreenshotTestNameHook,
};
