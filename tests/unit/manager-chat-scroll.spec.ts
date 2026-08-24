import { describe, expect, it } from 'vitest';

import { shouldAutoScrollMessages } from '@utils/manager-chat';

describe('manager chat automatic scrolling', () => {
  it('does not scroll when older messages are prepended', () => {
    expect(shouldAutoScrollMessages(20, 20)).toBe(false);
  });

  it('scrolls when a new latest message is appended', () => {
    expect(shouldAutoScrollMessages(20, 21)).toBe(true);
  });
});
