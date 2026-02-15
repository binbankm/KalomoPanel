import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { LoginPage } from '@/pages/login'
import { Layout } from '@/components/layout'
import { DashboardPage } from '@/pages/dashboard'
import { DomainsPage } from '@/pages/domains'
import { DNSPage } from '@/pages/dns'
import { SSLPage } from '@/pages/ssl'
import { FirewallPage } from '@/pages/firewall'
import { AnalyticsPage } from '@/pages/analytics'
import { WorkersPage } from '@/pages/workers'
import { KVPage } from '@/pages/kv'
import { PagesPage } from '@/pages/pages'
import { R2Page } from '@/pages/r2'
import { UsersPage } from '@/pages/users'
import { RolesPage } from '@/pages/roles'
import { SettingsPage } from '@/pages/settings'
import { LogsPage } from '@/pages/logs'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="domains" element={<DomainsPage />} />
        <Route path="dns" element={<DNSPage />} />
        <Route path="ssl" element={<SSLPage />} />
        <Route path="firewall" element={<FirewallPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="workers" element={<WorkersPage />} />
        <Route path="kv" element={<KVPage />} />
        <Route path="pages" element={<PagesPage />} />
        <Route path="r2" element={<R2Page />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="logs" element={<LogsPage />} />
      </Route>
    </Routes>
  )
}

export default App
