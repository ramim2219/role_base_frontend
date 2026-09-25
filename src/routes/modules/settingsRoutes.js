import { lazy } from "react";

export const settingsRoutes = [
  {
    name: "Profile",
    path: "/profile",
    component: lazy(() => import("../../pages/Profile")),
    isPrivate: true,
    menuKey: "profile",
    showInMenu: false,          // accessible but not in sidebar
  },
  {
    name: "Settings",
    path: "/settings",
    component: lazy(() => import("../../pages/Settings")),
    isPrivate: true,
    menuKey: "settings",
    showInMenu: true,
    icon: "Settings",
  },
];