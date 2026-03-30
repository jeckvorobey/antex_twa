import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const miniappRoot = resolve(process.cwd());

const pageFiles = [
  resolve(miniappRoot, 'src/pages/HomePage.vue'),
  resolve(miniappRoot, 'src/pages/ExchangePage.vue'),
  resolve(miniappRoot, 'src/pages/HistoryPage.vue'),
  resolve(miniappRoot, 'src/pages/ProfilePage.vue'),
];

describe('miniapp ssot without app status bar', () => {
  it('does not reference AppStatusBar in page sources', () => {
    for (const pageFile of pageFiles) {
      expect(readFileSync(pageFile, 'utf8')).not.toContain('AppStatusBar');
    }
  });

  it('does not keep AppStatusBar component file', () => {
    expect(existsSync(resolve(miniappRoot, 'src/components/ui/AppStatusBar.vue'))).toBe(false);
  });
});
