import { test, expect } from '@playwright/test';

test.describe('NIST SP 800-22 Exhaustive Methodology & 4096B Defaults', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[PAGE LOG] ${msg.type()}: ${msg.text()}`));
    await page.goto('/');
  });

  test('should have 4096 default bytes and Exhaustive mode option', async ({ page }) => {
    await page.click('a.nav-link[href="#test"]');
    const testSection = page.locator('#test');
    await expect(testSection).toBeVisible();

    const bytesInput = page.locator('#entropy-bytes');
    await expect(bytesInput).toHaveValue('4096');

    const modeSelect = page.locator('#entropy-mode');
    await expect(modeSelect).toHaveValue('exhaustive');

    // Verify option exists in dropdown
    const exhaustiveOption = modeSelect.locator('option[value="exhaustive"]');
    await expect(exhaustiveOption).toBeAttached();
  });

  test('should execute exhaustive test, pause status polling, and render 10-bin histogram', async ({ page }) => {
    test.setTimeout(90000); // 100 runs can take ~8-15s

    await page.click('a.nav-link[href="#test"]');

    // Run exhaustive test with 512 bytes per sample for rapid browser test execution
    await page.fill('#entropy-bytes', '512');
    await page.selectOption('#entropy-mode', 'exhaustive');

    // Check that PQEPollController exists
    const controllerExists = await page.evaluate(() => typeof window.PQEPollController !== 'undefined');
    expect(controllerExists).toBe(true);

    // Click run test
    const submitBtn = page.locator('button:has-text("Run test")');
    await submitBtn.click();

    // Verify polling was paused during the test
    const isPausedDuring = await page.evaluate(() => window.PQEPollController.isPaused());
    expect(isPausedDuring).toBe(true);

    // Wait for completion status
    const statusBanner = page.locator('#entropy-status');
    await expect(statusBanner).toContainText('Exhaustive analysis complete', { timeout: 60000 });

    // Verify polling was resumed after test completion
    const isPausedAfter = await page.evaluate(() => window.PQEPollController.isPaused());
    expect(isPausedAfter).toBe(false);

    // Verify Exhaustive Panel is visible and populated
    const exPanel = page.locator('#exhaustive-panel');
    await expect(exPanel).toBeVisible();

    // Verify pass rate and threshold
    const passRate = page.locator('#ex-stat-pass-rate');
    await expect(passRate).toContainText('%');

    const threshold = page.locator('#ex-stat-threshold');
    await expect(threshold).toContainText('96.');

    // Verify 10-bin SVG histogram has 10 rects
    const histogramBars = page.locator('#chart-pvalue-histogram rect');
    await expect(histogramBars).toHaveCount(10);

    // Verify breakdown table has 5 tests
    const tableRows = page.locator('#exhaustive-tests-table tr');
    await expect(tableRows).toHaveCount(5);

    // Verify overall verdict badge
    const verdictBadge = page.locator('#exhaustive-verdict-badge');
    await expect(verdictBadge).toContainText(/PASSED|REJECTED/);

    await page.screenshot({ path: 'screenshots/exhaustive-nist-results.png', fullPage: true });
  });
});
