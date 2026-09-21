import { test, expect } from '@playwright/test';

test.describe('PseudoQuantum Modern UI & Feature Flow', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[PAGE LOG] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message}`));
    await page.goto('/');
  });

  test('should render modern dark theme, background grid, and brand mark', async ({ page }) => {
    await expect(page.locator('.brand-mark').first()).toHaveText('PQ');
    await expect(page.locator('.background-grid')).toBeAttached();
    await expect(page.locator('.nav-menu')).toBeVisible();

    // Verify 6 nav items exist
    const navLinks = page.locator('.nav-link');
    await expect(navLinks).toHaveCount(6);
  });

  test('should execute live entropy generation and format switching', async ({ page }) => {
    // Check initial state
    const genButton = page.locator('#btn-generate-entropy');
    await expect(genButton).toBeVisible();

    const outputBox = page.locator('[data-output-box]');
    await expect(outputBox).toContainText('Awaiting');

    // Click generate entropy
    await genButton.click();

    // Verify output box updates with entropy data
    await expect(outputBox).not.toContainText('Awaiting', { timeout: 15000 });
    const hexOutput = (await outputBox.textContent())?.trim();
    expect(hexOutput).toBeTruthy();
    expect(hexOutput?.length).toBeGreaterThan(16);

    // Verify pipeline steps completed
    const completeSteps = page.locator('.pipeline-step.complete');
    await expect(completeSteps).toHaveCount(6);

    // Test format switching to BINARY
    const binPill = page.locator('#output-format-pills [data-format="bin"]');
    await binPill.click();
    await expect(binPill).toHaveClass(/active/);
    const binOutput = (await outputBox.textContent())?.trim();
    expect(binOutput).toMatch(/^[01 ]+$/);

    // Test format switching to BASE64
    const b64Pill = page.locator('#output-format-pills [data-format="b64"]');
    await b64Pill.click();
    await expect(b64Pill).toHaveClass(/active/);
    const b64Output = (await outputBox.textContent())?.trim();
    expect(b64Output?.length).toBeGreaterThan(0);

    // Screenshot of live generator
    await page.screenshot({ path: 'screenshots/modern-generator-completed.png', fullPage: true });
  });

  test('should navigate to NIST Analysis and execute entropy test with SVG charts', async ({ page }) => {
    await page.click('a.nav-link[href="#test"]');
    const testSection = page.locator('#test');
    await expect(testSection).toBeVisible();

    // Run quick test with 256 bytes
    await page.fill('#entropy-bytes', '256');
    await page.selectOption('#entropy-mode', 'quick');
    await page.click('button:has-text("Run test")');

    // Wait for completion status (Python NIST execution may take up to 25s)
    const statusBanner = page.locator('#entropy-status');
    await expect(statusBanner).toContainText('Analysis complete', { timeout: 30000 });

    // Verify test cards updated from PENDING to PASSED / FAILED
    const monobitBadge = page.locator('#card-monobit .test-badge');
    await expect(monobitBadge).not.toHaveText('PENDING');

    // Verify history table has at least 1 record
    const historyRows = page.locator('#test-history-table tr');
    await expect(historyRows).toHaveCount(1);

    // Verify SVG charts have rendered elements
    const chartBars = page.locator('#chart-bit-distribution .chart-bar');
    await expect(chartBars).toHaveCount(2);

    await page.screenshot({ path: 'screenshots/modern-nist-analysis.png', fullPage: true });
  });

  test('should navigate to Architecture & How It Works section', async ({ page }) => {
    await page.click('a.nav-link[href="#about"]');
    const aboutSection = page.locator('#about');
    await expect(aboutSection).toBeVisible();
    await expect(aboutSection.locator('h1')).toContainText('Architecture & How It Works');

    // Check architecture cards
    const archCards = page.locator('.arch-card');
    await expect(archCards).toHaveCount(4);

    await page.screenshot({ path: 'screenshots/modern-how-it-works.png', fullPage: true });
  });

  test('should trigger entropy pool reseed in settings', async ({ page }) => {
    await page.click('a.nav-link[href="#settings"]');
    const reseedBtn = page.locator('#btn-reseed-pool');
    await expect(reseedBtn).toBeVisible();

    await reseedBtn.click();
    const statusBanner = page.locator('#settings-status');
    await expect(statusBanner).toContainText('reseeded successfully', { timeout: 10000 });

    await page.screenshot({ path: 'screenshots/modern-settings.png', fullPage: true });
  });
});
