import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Send, FileText, BarChart3, Settings, Sun, Moon, Sparkles, Zap, Menu, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import clsx from 'clsx'

const Layout = () => {
  const location = useLocation()
  const { user, isConnected } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Close sidebar when resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Lock body scroll when sidebar open on mobile
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home, badge: null },
    { path: '/campaigns/new', label: 'New Campaign', icon: Send, badge: 'new' },
    { path: '/templates', label: 'Templates', icon: FileText, badge: null },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, badge: null },
    { path: '/settings', label: 'Settings', icon: Settings, badge: null }
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(var(--color-bg-primary))' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b shadow-sm"
              style={{
                backgroundColor: 'rgb(var(--color-bg-secondary) / 0.8)',
                borderColor: 'rgb(var(--color-border))'
              }}>
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Hamburger - mobile only */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl transition-colors"
                style={{ color: 'rgb(var(--color-text-primary))' }}
                aria-label="Toggle navigation menu"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Logo & Brand */}
              <div className="flex items-center gap-2 sm:gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
                    <Zap className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="currentColor" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold gradient-text flex items-center gap-2">
                    Macsauce Bomber
                    <Sparkles className="w-5 h-5 text-primary-500 animate-pulse hidden sm:block" />
                  </h1>
                  <p className="text-xs font-medium hidden sm:block" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                    Professional Bulk Email Platform
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Theme Toggle & User Info */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="relative p-2.5 sm:p-3 rounded-xl hover-lift focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                style={{
                  backgroundColor: 'rgb(var(--color-bg-tertiary))',
                  borderWidth: '1px',
                  borderColor: 'rgb(var(--color-border))'
                }}
                aria-label="Toggle theme"
              >
                <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                  <Sun className={clsx(
                    "w-5 h-5 sm:w-6 sm:h-6 absolute inset-0 transition-all duration-300",
                    isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100",
                    "text-yellow-500"
                  )} />
                  <Moon className={clsx(
                    "w-5 h-5 sm:w-6 sm:h-6 absolute inset-0 transition-all duration-300",
                    isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0",
                    "text-blue-500"
                  )} />
                </div>
              </button>

              {/* User Connection Status */}
              {isConnected && user && (
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-md animate-scale-in"
                     style={{
                       backgroundColor: 'rgb(var(--color-bg-tertiary))',
                       borderWidth: '1px',
                       borderColor: 'rgb(var(--color-border))'
                     }}>
                  <div className="relative">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                    <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse-ring"></div>
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-xs font-medium" style={{ color: 'rgb(var(--color-text-tertiary))' }}>Connected</span>
                    <span className="text-sm font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>{user.email}</span>
                  </div>
                </div>
              )}

              {!isConnected && (
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 border-dashed border-yellow-500/50 bg-yellow-500/10">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm font-semibold text-yellow-600 dark:text-yellow-400 hidden sm:inline">
                    Not Connected
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Overlay Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={clsx(
            'w-72 min-h-[calc(100vh-65px)] sm:min-h-[calc(100vh-89px)] border-r backdrop-blur-sm z-50',
            'fixed top-[65px] sm:top-[89px] left-0 transition-transform duration-300 ease-in-out',
            'lg:sticky lg:top-[89px] lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          style={{
            backgroundColor: 'rgb(var(--color-bg-secondary))',
            borderColor: 'rgb(var(--color-border))'
          }}>
          <nav className="p-4 space-y-2">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  className={clsx(
                    'flex items-center justify-between gap-3 px-5 py-4 rounded-xl font-semibold transition-all duration-300 group relative overflow-hidden animate-slide-up',
                    isActive
                      ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40'
                      : 'hover-lift'
                  )}
                  {...(!isActive ? { style: {
                    backgroundColor: 'transparent',
                    color: 'rgb(var(--color-text-secondary))'
                  }} : {})}
                >
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-600/0 to-accent-600/0 group-hover:from-primary-600/10 group-hover:to-accent-600/10 transition-all duration-300"></div>
                  )}

                  <div className="flex items-center gap-3 relative z-10">
                    <div className={clsx(
                      "p-2 rounded-lg transition-all",
                      isActive ? "bg-white/20" : "bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-gray-800"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={clsx(isActive ? 'text-white' : 'group-hover:text-primary-600 dark:group-hover:text-primary-400')}>
                      {item.label}
                    </span>
                  </div>

                  {item.badge && (
                    <span className="relative z-10 px-2 py-0.5 text-[10px] font-bold uppercase bg-green-500 text-white rounded-full shadow-lg animate-pulse">
                      {item.badge}
                    </span>
                  )}

                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full shadow-lg"></div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t"
               style={{ borderColor: 'rgb(var(--color-border))' }}>
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 border"
                 style={{ borderColor: 'rgb(var(--color-border))' }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary-500" />
                <span className="text-xs font-bold text-primary-600 dark:text-primary-400">Pro Tips</span>
              </div>
              <p className="text-xs" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                Use templates to save time and maintain consistent messaging across campaigns.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden min-w-0">
          <div className="container mx-auto max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
