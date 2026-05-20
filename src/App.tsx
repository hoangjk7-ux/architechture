import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import AppLayout from "./components/layout/AppLayout.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import SystemsPage from "./pages/systems/page.tsx";
import VendorsPage from "./pages/vendors/page.tsx";
import ArchitecturePage from "./pages/architecture/page.tsx";
import IntegrationsPage from "./pages/integrations/page.tsx";
import RoadmapPage from "./pages/roadmap/page.tsx";
import UsersPage from "./pages/users/page.tsx";
import SettingsPage from "./pages/settings/page.tsx";

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/systems" element={<SystemsPage />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/flow-diagram" element={<Navigate to="/architecture" replace />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}
