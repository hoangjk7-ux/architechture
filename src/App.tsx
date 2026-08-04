import { lazy } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import AppLayout from "./components/layout/AppLayout.tsx";
import { RouteBoundary } from "./shared/routing/RouteBoundary.tsx";
import { RequireRole } from "./components/auth/RequireRole.tsx";
import { routeRoles } from "./lib/permissions.ts";

const Index = lazy(() => import("./pages/Index.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const SystemsPage = lazy(() => import("./pages/systems/page.tsx"));
const VendorsPage = lazy(() => import("./pages/vendors/page.tsx"));
const ArchitecturePage = lazy(() => import("./pages/architecture/page.tsx"));
const IntegrationsPage = lazy(() => import("./pages/integrations/page.tsx"));
const RoadmapPage = lazy(() => import("./pages/roadmap/page.tsx"));
const UsersPage = lazy(() => import("./pages/users/page.tsx"));
const SettingsPage = lazy(() => import("./pages/settings/page.tsx"));

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <RouteBoundary>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<RequireRole roles={routeRoles.dashboard}><Index /></RequireRole>} />
              <Route path="/systems" element={<RequireRole roles={routeRoles.systems}><SystemsPage /></RequireRole>} />
              <Route path="/vendors" element={<RequireRole roles={routeRoles.vendors}><VendorsPage /></RequireRole>} />
              <Route path="/architecture" element={<RequireRole roles={routeRoles.architecture}><ArchitecturePage /></RequireRole>} />
              <Route path="/integrations" element={<RequireRole roles={routeRoles.integrations}><IntegrationsPage /></RequireRole>} />
              <Route path="/roadmap" element={<RequireRole roles={routeRoles.roadmap}><RoadmapPage /></RequireRole>} />
              <Route path="/users" element={<RequireRole roles={routeRoles.users}><UsersPage /></RequireRole>} />
              <Route path="/settings" element={<RequireRole roles={routeRoles.settings}><SettingsPage /></RequireRole>} />
              <Route
                path="/flow-diagram"
                element={<Navigate to="/architecture" replace />}
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RouteBoundary>
      </BrowserRouter>
    </DefaultProviders>
  );
}
