import { lazy } from "react";

export const analyticsRoutes = [
  {
    name: "Analytics",
    path: "/analytics",          // virtual parent — not rendered itself
    icon: "BarChart3",
    showInMenu: true,
    isPrivate: true,
    isGroup: true,               // 👈 marks it as a sidebar group, not a route
    children: [
      {
        name: "Overview",
        path: "/analytics/overview",
        component: lazy(() => import("../../pages/Analytics/Overview")),
        isPrivate: true,
        menuKey: "analytics-overview",
        showInMenu: true,
      },
      {
        name: "Reports",
        path: "/analytics/reports",
        component: lazy(() => import("../../pages/Analytics/Reports")),
        isPrivate: true,
        menuKey: "analytics-reports",
        showInMenu: true,
      },
      {
        name: "Real-time",
        path: "/analytics/realtime",
        component: lazy(() => import("../../pages/Analytics/Realtime")),
        isPrivate: true,
        menuKey: "analytics-realtime",
        showInMenu: true,
      },
    ],
  },
];