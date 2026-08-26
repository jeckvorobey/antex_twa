import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('semantic error state contract', () => {
  it('provides a reusable error state with an alert role and retry action', () => {
    const errorState = read('src/components/ui/AntexErrorState.vue');

    expect(errorState).toContain('role="alert"');
    expect(errorState).toContain('icon="error_outline"');
    expect(errorState).toContain("const emit = defineEmits<{ retry: [] }>();");
    expect(errorState).toContain("@action=\"emit('retry')\"");
  });

  it('uses ErrorState for manager request failures', () => {
    for (const page of [
      'src/pages/manager/ManagerOrdersPage.vue',
      'src/pages/manager/ManagerOrderPage.vue',
      'src/pages/manager/ManagerChatPage.vue',
      'src/pages/manager/ManagerChatsPage.vue',
    ]) {
      const source = read(page);
      expect(source).toContain("import AntexErrorState from '@components/ui/AntexErrorState.vue'");
      expect(source).toContain('<AntexErrorState');
    }
  });
});
