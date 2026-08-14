export const MANAGER_ROLE = 2;
export const MANAGER_DEFAULT_PATH = '/manager/chats';

export function isManagerRole(role: number | null | undefined): boolean {
  return role === MANAGER_ROLE;
}

export function resolveWorkspaceRedirect(
  role: number | null | undefined,
  currentPath: string,
): string | null {
  if (isManagerRole(role)) {
    return currentPath.startsWith('/manager') ? null : MANAGER_DEFAULT_PATH;
  }
  return currentPath.startsWith('/manager') ? '/' : null;
}
