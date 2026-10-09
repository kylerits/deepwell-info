import { defineConfig } from '@playwright/test';
const chromium = { browserName: 'chromium' as const, launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] } };
// Harness limits, not site budgets: headless Chromium renders WebGL through SwiftShader on every
// host. A page at `full` keeps the field's render loop busy at ~9 cores, and the first shader
// compile blocks the main thread for up to ~15 s, which delays `client:idle` hydration. Two pages
// at once starve each other, so the run is serial and waits get a longer window.
export default defineConfig({
  testDir: 'tests/e2e', outputDir: 'test-results', fullyParallel: true, reporter: 'list', timeout: 120_000,
  workers: 1, expect: { timeout: 30_000 },
  projects: [
    { name: 'pilot', use: { ...chromium, baseURL: 'http://127.0.0.1:4401' } },
    { name: 'public', use: { ...chromium, baseURL: 'http://127.0.0.1:4402' } },
  ],
  webServer: [
    { command: 'node scripts/serve-static.mjs dist-pilot 4401', url: 'http://127.0.0.1:4401/', reuseExistingServer: !process.env.CI },
    { command: 'node scripts/serve-static.mjs dist-public 4402', url: 'http://127.0.0.1:4402/', reuseExistingServer: !process.env.CI },
  ],
});
