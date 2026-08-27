import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const pagePath = resolve(process.cwd(), 'src/pages/manager/ManagerChatsPage.vue');
const itemPath = resolve(process.cwd(), 'src/components/manager/ConversationListItem.vue');
const searchPath = resolve(process.cwd(), 'src/components/manager/ManagerChatSearch.vue');
const filtersPath = resolve(process.cwd(), 'src/components/manager/ManagerChatFilters.vue');
const listPath = resolve(process.cwd(), 'src/components/manager/ManagerConversationList.vue');

describe('manager chats Penpot composition', () => {
  it('delegates search, filters and repeated rows to reusable components', () => {
    const page = readFileSync(pagePath, 'utf8');

    expect(existsSync(searchPath)).toBe(true);
    expect(existsSync(filtersPath)).toBe(true);
    expect(existsSync(listPath)).toBe(true);
    expect(page).toContain('<AppHeaderBar');
    expect(page).toContain('<ManagerChatSearch');
    expect(page).toContain('<ManagerChatFilters');
    expect(page).toContain('<ManagerConversationList');
    expect(page).not.toContain('<ManagerPageHeader');
  });

  it('places the order number before client and preview like Conversation Row', () => {
    const item = readFileSync(itemPath, 'utf8');
    const orderIndex = item.indexOf('manager-conversation-item__order');
    const nameIndex = item.indexOf('manager-conversation-item__name');
    const previewIndex = item.indexOf('manager-conversation-item__preview');

    expect(orderIndex).toBeGreaterThan(-1);
    expect(orderIndex).toBeLessThan(nameIndex);
    expect(nameIndex).toBeLessThan(previewIndex);
  });
});
