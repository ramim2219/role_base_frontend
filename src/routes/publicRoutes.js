import { lazy } from "react";

export const publicRoutes = [
  {
    name: "Login",
    path: "/login",
    component: lazy(() => import("../pages/Login")),
    isPrivate: false,
    showInMenu: false,
  },
//   {
//     name: "Signup",
//     path: "/signup",
//     component: lazy(() => import("../pages/Signup")),
//     isPrivate: false,
//     showInMenu: false,
//   },
];