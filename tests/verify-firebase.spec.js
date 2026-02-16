const { test, expect } = require('@playwright/test');

const htmlFiles = ['index.html', 'progress-report.html', 'project-builder.html', 'sprint-planner.html', 'transcript-analyzer.html'];

for (const file of htmlFiles) {
  test(`Verify Firebase initialization in ${file}`, async ({ page }) => {
    await page.goto(`http://localhost:8000/${file}`);

    // Check if db is defined and working (has collection method)
    const isFirebaseInitialized = await page.evaluate(() => {
        try {
            // db is declared with const in global scope, so it should be available
            // checking if it has the collection method which is used in the app
            return typeof db !== 'undefined' && typeof db.collection === 'function';
        } catch (e) {
            return false;
        }
    });

    expect(isFirebaseInitialized).toBe(true);
  });
}
