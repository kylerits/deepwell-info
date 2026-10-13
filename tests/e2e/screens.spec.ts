import { expect, test } from '@playwright/test';
import { open, scrollToFraction } from './helpers';
// Same compositor args as glass.spec/motion.spec: at `off` the static field's huge gradients and blend modes make
// SwiftShader GPU-compositing screenshots take tens of seconds.
test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--disable-gpu-compositing'] } });

for (const level of ['full', 'reduced', 'off'] as const)
  for (const width of [390, 1440])
    test(`screens ${level} @${width}`, async ({ page }, info) => {
      const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await open(page, { level, cover: 'scp-4999' });
      for (const d of [0, 0.5, 1]) {
        await scrollToFraction(page, d);
        await page.screenshot({ path: `artifacts/screens/${level}-${info.project.name}-${width}-d${d}.png` });
      }
      expect(errors).toEqual([]);
    });
