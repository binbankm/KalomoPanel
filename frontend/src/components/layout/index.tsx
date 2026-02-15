import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import {
  LayoutDashboard,
  Globe,
  Network,
  Shield,
  Lock,
  BarChart3,
  Code2,
  Database,
  FileText,
  HardDrive,
  Users,
  UserCog,
  Settings,
  FileClock,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '仪表盘', permission: null },
  { path: '/domains', icon: Globe, label: '域名管理', permission: 'domain:view' },
  { path: '/dns', icon: Network, label: 'DNS管理', permission: 'dns:view' },
  { path: '/ssl', icon: Lock, label: 'SSL/TLS', permission: 'ssl:view' },
  { path: '/firewall', icon: Shield, label: '防火墙', permission: 'firewall:view' },
  { path: '/analytics', icon: BarChart3, label: '分析统计', permission: 'analytics:view' },
  { path: '/workers', icon: Code2, label: 'Workers', permission: 'workers:view' },
  { path: '/kv', icon: Database, label: 'KV存储', permission: 'kv:view' },
  { path: '/pages', icon: FileText, label: 'Pages', permission: 'pages:view' },
  { path: '/r2', icon: HardDrive, label: 'R2存储', permission: 'r2:view' },
]

const adminItems = [
  { path: '/users', icon: Users, label: '用户管理', permission: 'user:view' },
  { path: '/roles', icon: UserCog, label: '角色权限', permission: 'role:view' },
  { path: '/logs', icon: FileClock, label: '操作日志', permission: 'logs:view' },
  { path: '/settings', icon: Settings, label: '系统设置', permission: 'settings:view' },
]

export function Layout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const hasPermission = (permission: string | null) => {
    if (!permission) return true
    if (!user?.permissions) return false
    return user.permissions.includes(permission) || user.permissions.includes('settings:manage')
  }

  const visibleMenuItems = menuItems.filter(item => hasPermission(item.permission))
  const visibleAdminItems = adminItems.filter(item => hasPermission(item.permission))

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">CF Admin</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="hidden lg:flex items-center gap-2 p-6 border-b">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl">CF Admin</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                  主要功能
                </p>
                <ul className="space-y-1">
                  {visibleMenuItems.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          )
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>

              {visibleAdminItems.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                    系统管理
                  </p>
                  <ul className="space-y-1">
                    {visibleAdminItems.map((item) => (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </nav>

            {/* User section */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                  {user?.name?.[0] || user?.username?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name || user?.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                退出登录
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
