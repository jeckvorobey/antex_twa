import { describe, expect, it } from 'vitest';

import { MANAGER_DEFAULT_PATH, resolveWorkspaceRedirect } from '@utils/manager-workspace';
import { resolveManagerRouteGuard } from '../../src/router/manager-route.guard';

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

  it('keeps a legacy administrator with manager API access inside manager workspace', () => {
    expect(resolveWorkspaceRedirect(1, '/manager/chats/12')).toBeNull();
  });

  it('redirects regular user away from manager workspace', () => {
    expect(resolveWorkspaceRedirect(9, '/manager/chats')).toBe('/');
  });

  it('blocks manager-only route resolution before its layout can mount', () => {
    expect(resolveManagerRouteGuard(9, true)).toEqual({ name: 'home', replace: true });
    expect(resolveManagerRouteGuard(undefined, true)).toEqual({ name: 'home', replace: true });
    expect(resolveManagerRouteGuard(2, true)).toBe(true);
    expect(resolveManagerRouteGuard(1, true)).toBe(true);
    expect(resolveManagerRouteGuard(9, false)).toBe(true);
  });
});
