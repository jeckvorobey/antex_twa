import type { RouteLocationRaw } from 'vue-router';

import { isManagerRole } from '@utils/manager-workspace';

const USER_HOME_ROUTE: RouteLocationRaw = { name: 'home', replace: true };

/** Не допускает неподтверждённую роль к загрузке manager layout и его API lifecycle. */
export function resolveManagerRouteGuard(
  role: number | null | undefined,
  managerOnly: boolean,
): true | RouteLocationRaw {
  if (!managerOnly || isManagerRole(role)) {
    return true;
  }
  return USER_HOME_ROUTE;
}
