import { useState } from 'react'
import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'

function DashboardLayout({
  children,
  title,
  description,
  activeMenu,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar
        open={sidebarOpen}
        activeMenu={activeMenu}
      />

      <div
        className={`min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : ''
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
            >
              ☰
            </button>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {title}
              </h2>

              {description && (
                <p className="hidden text-sm text-slate-500 sm:block">
                  {description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"
            >
              🔔

              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 sm:flex">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {user?.name || 'Pengguna'}
                </p>

                <p className="text-xs text-slate-500">
                  {user?.role === 'admin'
                    ? 'Administrator'
                    : 'Kasir'}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout