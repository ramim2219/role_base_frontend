// src/routes/AppRoutes.jsx
import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AdminLayout from "../components/layout/AdminLayout";
import ProtectedRoute from "./ProtectedRoute";
import GuestRoute from "./GuestRoute";
import TitleHandler from "../components/TitleHandler";
import SpinLoader from "../components/SpinLoader";

import { allRoutes, routeTitles } from "./allRoutes";
import NotFound from "../pages/NotFound";

export default function AppRoutes() {
  // Public routes that stay OUTSIDE the app layout (no sidebar)
  const barePublicRoutes = allRoutes.filter(
    (r) => !r.isPrivate && r.useLayout === false
  );

  // Public routes that render INSIDE the layout (with sidebar area)
  const layoutPublicRoutes = allRoutes.filter(
    (r) => !r.isPrivate && r.useLayout === true
  );

  // Public routes with no layout preference → default to bare
  const defaultPublicRoutes = allRoutes.filter(
    (r) => !r.isPrivate && r.useLayout === undefined
  );

  const privateRoutes = allRoutes.filter((r) => r.isPrivate);

  return (
    <BrowserRouter>
      <TitleHandler titles={routeTitles} appName="Admin Panel" />

      <Suspense fallback={<SpinLoader />}>
        <Routes>
          {/* Bare public routes — no layout (login, 404, etc.) */}
          {barePublicRoutes.map(({ path, component: Component, guestOnly }) => (
            <Route
              key={path}
              path={path}
              element={
                guestOnly ? (
                  <GuestRoute>
                    <Component />
                  </GuestRoute>
                ) : (
                  <Component />
                )
              }
            />
          ))}

          {defaultPublicRoutes.map(({ path, component: Component, guestOnly }) => (
            <Route
              key={path}
              path={path}
              element={
                guestOnly ? (
                  <GuestRoute>
                    <Component />
                  </GuestRoute>
                ) : (
                  <Component />
                )
              }
            />
          ))}

          {/* Public routes inside the layout */}
          {layoutPublicRoutes.map(({ path, component: Component }) => (
            <Route key={path} element={<AdminLayout />}>
              <Route path={path} element={<Component />} />
            </Route>
          ))}

          {/* Private routes — inside layout + auth + permission guard */}
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {privateRoutes.map(({ path, component: Component }) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}