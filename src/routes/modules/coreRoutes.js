import { lazy } from "react";

export const coreRoutes = [
  {
    name: "Dashboard",
    path: "/",
    component: lazy(() => import("../../pages/Dashboard")),
    isPrivate: true,
    menuKey: "dashboard",
    showInMenu: true,
    icon: "LayoutDashboard",
  },
  {
    name: "Users",
    path: "/users",
    component: lazy(() => import("../../pages/Users")),
    isPrivate: true,
    menuKey: "users",
    showInMenu: true,
    icon: "Users",
  },
  // Add more core routes here
];