// src/routes/publicRoutes.js
import { lazy } from "react";

export const publicRoutes = [
  {
    name: "Login",
    path: "/login",
    component: lazy(() => import("../pages/Login")),
    isPrivate: false,
    showInMenu: false,
    guestOnly: true,
    useLayout: false,       // ← login stays bare (full-screen split layout)
  },
  {
    name: "Signup",
    path: "/signup",
    component: lazy(() => import("../pages/Signup")),
    isPrivate: false,
    showInMenu: false,
    guestOnly: true,
    useLayout: true,        // ← renders inside the app frame
  },
  {
    name: "Forbidden",
    path: "/403",
    component: lazy(() => import("../pages/Forbidden")),
    isPrivate: false,
    showInMenu: false,
    useLayout: true,        // ← renders inside the app frame
  },
];