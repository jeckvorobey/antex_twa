import { describe, expect, it } from 'vitest';

import { MANAGER_DEFAULT_PATH, resolveWorkspaceRedirect } from '@utils/manager-workspace';

describe('manager workspace routing', () => {
  it('uses dashboard as the manager workspace entry point', () => {
    expect(MANAGER_DEFAULT_PATH).toBe('/manager/dashboard');
  });

  it('redirects manager away from client workspace', () => {
    expect(resolveWorkspaceRedirect(2, '/exchange')).toBe(MANAGER_DEFAULT_PATH);
  });

  it('keeps manager inside manager workspace', () => {
    expect(resolveWorkspaceRedirect(2, '/manager/chats/12')).toBeNull();
  });

  it('redirects regular user away from manager workspace', () => {
    expect(resolveWorkspaceRedirect(9, '/manager/chats')).toBe('/');
  });
});
