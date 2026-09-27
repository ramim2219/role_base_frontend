import { lazy } from "react";

export const publicRoutes = [
  {
    name: "Login",
    path: "/login",
    component: lazy(() => import("../pages/Login")),
    isPrivate: false,
    showInMenu: false,
    guestOnly: true,        // ← add this line
  },
];