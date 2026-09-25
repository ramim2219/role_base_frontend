import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AdminLayout from "../components/layout/AdminLayout";
import ProtectedRoute from "./ProtectedRoute";
import TitleHandler from "../components/TitleHandler";
import SpinLoader from "../components/SpinLoader";

import { allRoutes, routeTitles } from "./allRoutes";
import NotFound from "../pages/NotFound";

export default function AppRoutes() {
  const publicRoutes = allRoutes.filter((r) => !r.isPrivate);
  const privateRoutes = allRoutes.filter((r) => r.isPrivate);

  return (
    <BrowserRouter>
      <TitleHandler titles={routeTitles} appName="Admin Panel" />

      <Suspense fallback={<SpinLoader />}>
        <Routes>
          {/* Public */}
          {publicRoutes.map(({ path, component: Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}

          {/* Private (wrapped in AdminLayout) */}
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