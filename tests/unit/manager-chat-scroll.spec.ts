import { describe, expect, it } from 'vitest';

import { managerScrollBehavior, shouldAutoScrollMessages } from '@utils/manager-chat';

describe('manager chat automatic scrolling', () => {
  it('does not scroll when older messages are prepended', () => {
    expect(shouldAutoScrollMessages(20, 20)).toBe(false);
  });

  it('scrolls when a new latest message is appended', () => {
    expect(shouldAutoScrollMessages(20, 21)).toBe(true);
  });

  it('disables smooth scrolling when reduced motion is requested', () => {
    expect(managerScrollBehavior(true)).toBe('auto');
    expect(managerScrollBehavior(false)).toBe('smooth');
  });
});
