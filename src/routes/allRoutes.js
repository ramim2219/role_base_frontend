import { publicRoutes } from "./publicRoutes";
import { privateRoutes } from "./privateRoutes";

const routeModules = [...publicRoutes, ...privateRoutes];

export const allRoutes = routeModules.flatMap((r) => {
  if (r.isGroup && r.children) return r.children;
  return [r];
});

export const routeTitles = allRoutes.reduce((acc, r) => {
  acc[r.path] = r.name;
  return acc;
}, {});

// Sidebar menu (empty for now — only public routes, which have showInMenu: false)
export function getMenuRoutes(accessData = {}) {
  const hasAccess = (route) => {
    if (!route.menuKey) return true;
    if (!accessData || Object.keys(accessData).length === 0) return true;
    return accessData[route.menuKey]?.view !== false;
  };

  return routeModules
    .filter((r) => r.showInMenu)
    .map((r) => {
      if (r.isGroup && r.children) {
        const visibleChildren = r.children.filter(
          (c) => c.showInMenu !== false && hasAccess(c)
        );
        return { ...r, children: visibleChildren };
      }
      return r;
    })
    .filter((r) => {
      if (r.isGroup && r.children.length === 0) return false;
      if (!r.isGroup && !hasAccess(r)) return false;
      return true;
    });
}