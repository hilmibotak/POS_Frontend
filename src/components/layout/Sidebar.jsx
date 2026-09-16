import { useState } from 'react'
import {
  BarChart3,
  Boxes,
  ChevronDown,
  CircleUserRound,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  UserRound,
  UsersRound,
  Warehouse,
  X,
} from 'lucide-react'
import {
  NavLink,
  useNavigate,
} from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Sidebar({
  open,
  activeMenu,
  onClose,
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [produkOpen, setProdukOpen] =
    useState(true)

  const isAdmin =
    user?.role === 'admin'

  const isKasir =
    user?.role === 'kasir'

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login', {
        replace: true,
      })
    }
  }

  const userInitial =
    user?.name
      ?.charAt(0)
      ?.toUpperCase() || 'U'

  const roleLabel =
    isAdmin
      ? 'Administrator'
      : isKasir
        ? 'Kasir'
        : 'Pengguna'

  const mainMenuItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Kasir',
      path: '/cashier',
      icon: ShoppingCart,
    },
    {
      label: 'Riwayat Transaksi',
      path: '/transactions',
      icon: ClipboardList,
    },
  ]

  const productMenuItems = [
    {
      label: 'Data Barang',
      path: '/products',
      icon: Package,
    },
    {
      label: 'Kategori',
      path: '/categories',
      icon: Tags,
    },
    {
      label: 'Satuan',
      path: '/units',
      icon: Boxes,
    },
  ]

  const adminMenuItems = [
    {
      label: 'Stok',
      path: '/stock',
      icon: Warehouse,
    },
    {
      label: 'Laporan',
      path: '/reports',
      icon: BarChart3,
    },
    {
      label: 'Pegawai',
      path: '/employees',
      icon: UsersRound,
    },
    {
      label: 'Pengaturan',
      path: '/settings',
      icon: Settings,
    },
  ]

  const kasirMenuItems = [
    {
      label: 'Barang',
      path: '/products',
      icon: Package,
    },
    {
      label: 'Pelanggan',
      path: '/customers',
      icon: UserRound,
    },
  ]

  const getMenuClass = ({
    isActive,
  }) => `
    group relative flex w-full items-center gap-3
    rounded-xl px-3 py-2.5
    text-sm font-medium
    transition-all duration-200
    ${
      isActive
        ? 'bg-blue-600 text-white shadow-md shadow-blue-200/60'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }
  `

  const getSubMenuClass = ({
    isActive,
  }) => `
    group flex w-full items-center gap-3
    rounded-lg px-3 py-2.5
    text-sm
    transition-all duration-200
    ${
      isActive
        ? 'bg-blue-50 font-semibold text-blue-600'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
    }
  `

  const renderMenuItem = (
    item
  ) => {
    const Icon = item.icon

    return (
      <NavLink
        key={item.label}
        to={item.path}
        title={item.label}
        onClick={onClose}
        className={getMenuClass}
      >
        {({ isActive }) => (
          <>
            {/* Active Indicator */}
            {isActive && (
              <span className="absolute -left-3 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-blue-500" />
            )}

            <span
              className={`
                flex h-9 w-9 shrink-0
                items-center justify-center
                rounded-lg
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-white/15'
                    : 'bg-slate-100 group-hover:bg-white'
                }
              `}
            >
              <Icon
                strokeWidth={1.9}
                className={`
                  h-[18px] w-[18px]
                  ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-500 group-hover:text-blue-600'
                  }
                `}
              />
            </span>

            <span className="truncate">
              {item.label}
            </span>
          </>
        )}
      </NavLink>
    )
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40
          flex w-[270px] flex-col
          border-r border-slate-200
          bg-white
          shadow-2xl shadow-slate-900/10
          transition-transform duration-300
          ${
            open
              ? 'translate-x-0'
              : '-translate-x-full'
          }
        `}
      >
        {/* =========================================================
            BRAND HEADER
        ========================================================= */}
        <div className="relative flex h-[78px] shrink-0 items-center border-b border-slate-200 px-5">
          {/* Decorative background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-blue-50" />
            <div className="absolute -bottom-14 -left-8 h-24 w-24 rounded-full bg-slate-50" />
          </div>

          <div className="relative flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-sm font-extrabold tracking-tight text-white shadow-lg shadow-blue-200">
                BP

                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-[2.5px] border-white bg-emerald-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              </div>

              <div className="min-w-0">
                <h1 className="text-[17px] font-bold tracking-tight text-slate-900">
                  BuildPOS
                </h1>

                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.13em] text-slate-400">
                  Point of Sale
                </p>
              </div>
            </div>

            {/* Mobile close */}
            <button
              type="button"
              title="Tutup sidebar"
              aria-label="Tutup sidebar"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* =========================================================
            NAVIGATION
        ========================================================= */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {/* MENU UTAMA */}
          <section>
            <div className="mb-3 flex items-center gap-2 px-3">
              <span className="h-1 w-1 rounded-full bg-blue-500" />

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Menu Utama
              </p>
            </div>

            <div className="space-y-1">
              {mainMenuItems.map(
                renderMenuItem
              )}
            </div>
          </section>

          {/* =====================================================
              ADMIN
          ===================================================== */}
          {isAdmin && (
            <>
              {/* MASTER DATA */}
              <section className="mt-7">
                <div className="mb-3 flex items-center gap-2 px-3">
                  <span className="h-1 w-1 rounded-full bg-blue-500" />

                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Master Data
                  </p>
                </div>

                {/* Produk Parent */}
                <button
                  type="button"
                  title="Produk"
                  aria-label="Buka menu Produk"
                  aria-expanded={
                    produkOpen
                  }
                  onClick={() =>
                    setProdukOpen(
                      (previous) =>
                        !previous
                    )
                  }
                  className={`
                    group flex w-full
                    items-center justify-between
                    rounded-xl px-3 py-2.5
                    text-sm font-medium
                    transition-all duration-200
                    ${
                      activeMenu ===
                      'products'
                        ? 'text-blue-600'
                        : 'text-slate-600'
                    }
                    hover:bg-slate-100
                    hover:text-slate-900
                  `}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`
                        flex h-9 w-9
                        items-center justify-center
                        rounded-lg
                        transition
                        ${
                          activeMenu ===
                          'products'
                            ? 'bg-blue-50'
                            : 'bg-slate-100 group-hover:bg-white'
                        }
                      `}
                    >
                      <Package
                        strokeWidth={1.9}
                        className={`
                          h-[18px] w-[18px]
                          ${
                            activeMenu ===
                            'products'
                              ? 'text-blue-600'
                              : 'text-slate-500 group-hover:text-blue-600'
                          }
                        `}
                      />
                    </span>

                    <span>Produk</span>
                  </span>

                  <span className="flex h-6 w-6 items-center justify-center rounded-md">
                    <ChevronDown
                      className={`
                        h-4 w-4
                        text-slate-400
                        transition-transform duration-200
                        ${
                          produkOpen
                            ? 'rotate-180'
                            : ''
                        }
                      `}
                    />
                  </span>
                </button>

                {/* Produk Submenu */}
                <div
                  className={`
                    grid transition-all duration-200
                    ${
                      produkOpen
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0'
                    }
                  `}
                >
                  <div className="overflow-hidden">
                    <div className="relative ml-[29px] mt-1 border-l border-slate-200 pl-3">
                      {/* Connector */}
                      <span className="absolute -left-px top-0 h-5 w-px bg-blue-200" />

                      <div className="space-y-1">
                        {productMenuItems.map(
                          (item) => {
                            const Icon =
                              item.icon

                            return (
                              <NavLink
                                key={
                                  item.label
                                }
                                to={
                                  item.path
                                }
                                title={
                                  item.label
                                }
                                onClick={
                                  onClose
                                }
                                className={
                                  getSubMenuClass
                                }
                              >
                                {({
                                  isActive,
                                }) => (
                                  <>
                                    <span
                                      className={`
                                        flex h-7 w-7
                                        items-center
                                        justify-center
                                        rounded-md
                                        ${
                                          isActive
                                            ? 'bg-blue-100'
                                            : 'bg-transparent'
                                        }
                                      `}
                                    >
                                      <Icon
                                        strokeWidth={
                                          1.8
                                        }
                                        className={`
                                          h-4 w-4
                                          ${
                                            isActive
                                              ? 'text-blue-600'
                                              : 'text-slate-400 group-hover:text-blue-600'
                                          }
                                        `}
                                      />
                                    </span>

                                    <span>
                                      {
                                        item.label
                                      }
                                    </span>

                                    {isActive && (
                                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
                                    )}
                                  </>
                                )}
                              </NavLink>
                            )
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* OPERASIONAL */}
              <section className="mt-7">
                <div className="mb-3 flex items-center gap-2 px-3">
                  <span className="h-1 w-1 rounded-full bg-blue-500" />

                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Operasional
                  </p>
                </div>

                <div className="space-y-1">
                  {adminMenuItems.map(
                    renderMenuItem
                  )}
                </div>
              </section>
            </>
          )}

          {/* =====================================================
              KASIR
          ===================================================== */}
          {isKasir && (
            <section className="mt-7">
              <div className="mb-3 flex items-center gap-2 px-3">
                <span className="h-1 w-1 rounded-full bg-blue-500" />

                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Data
                </p>
              </div>

              <div className="space-y-1">
                {kasirMenuItems.map(
                  renderMenuItem
                )}
              </div>
            </section>
          )}

          {/* =====================================================
              AKUN
          ===================================================== */}
          <section className="mt-7">
            <div className="mb-3 flex items-center gap-2 px-3">
              <span className="h-1 w-1 rounded-full bg-blue-500" />

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Akun
              </p>
            </div>

            <NavLink
              to="/profile"
              title="Profil"
              onClick={onClose}
              className={getMenuClass}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute -left-3 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-blue-500" />
                  )}

                  <span
                    className={`
                      flex h-9 w-9
                      shrink-0
                      items-center justify-center
                      rounded-lg
                      ${
                        isActive
                          ? 'bg-white/15'
                          : 'bg-slate-100'
                      }
                    `}
                  >
                    <CircleUserRound
                      strokeWidth={1.9}
                      className={`
                        h-[18px] w-[18px]
                        ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-500'
                        }
                      `}
                    />
                  </span>

                  <span>Profil</span>
                </>
              )}
            </NavLink>
          </section>
        </nav>

        {/* =========================================================
            USER FOOTER
        ========================================================= */}
        <div className="shrink-0 border-t border-slate-200 bg-slate-50/80 p-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* User */}
            <div className="p-3">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white shadow-sm shadow-blue-200">
                  {userInitial}

                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {user?.name ||
                      'Pengguna'}
                  </p>

                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">
                      {roleLabel}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <span
                  title="Status aktif"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              </div>
            </div>

            {/* Logout */}
            <div className="border-t border-slate-100 p-2">
              <button
                type="button"
                title="Keluar"
                aria-label="Keluar dari akun"
                onClick={
                  handleLogout
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut
                  strokeWidth={1.9}
                  className="h-4 w-4"
                />

                <span>
                  Keluar
                </span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar