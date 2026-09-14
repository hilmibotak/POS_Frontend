import { useState } from 'react'
import {
  NavLink,
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

function Sidebar({ open }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [produkOpen, setProdukOpen] = useState(true)

  const isAdmin = user?.role === 'admin'
  const isKasir = user?.role === 'kasir'

  // ==============================
  // LOGOUT
  // ==============================

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      // Ganti halaman login dan hapus
      // halaman dashboard dari history terakhir
      navigate('/login', {
        replace: true,
      })
    }
  }

  // ==============================
  // MENU UTAMA
  // ==============================

  const menuItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: '▦',
    },
    {
      label: 'Kasir',
      path: '/cashier',
      icon: '▣',
    },
    {
      label: 'Riwayat Transaksi',
      path: '/transactions',
      icon: '↺',
    },
  ]

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ${
        open
          ? 'translate-x-0'
          : '-translate-x-full'
      }`}
    >

      {/* ==============================
          LOGO
      ============================== */}

      <div className="flex h-20 items-center border-b border-slate-200 px-6">
        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
            BP
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900">
              BuildPOS
            </h1>

            <p className="text-xs text-slate-500">
              Point of Sale
            </p>
          </div>

        </div>
      </div>


      {/* ==============================
          NAVIGATION
      ============================== */}

      <nav className="flex-1 overflow-y-auto px-4 py-5">

        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Menu Utama
        </p>

        <div className="space-y-1">

          {/* ==============================
              MENU UTAMA
          ============================== */}

          {menuItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >

              <span className="flex h-6 w-6 items-center justify-center">
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>

            </NavLink>
          ))}


          {/* ==============================
              ADMIN ONLY
          ============================== */}

          {isAdmin && (
            <>

              {/* PRODUK */}

              <button
                type="button"
                onClick={() =>
                  setProdukOpen(!produkOpen)
                }
                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >

                <span className="flex items-center gap-3">

                  <span className="flex h-6 w-6 items-center justify-center">
                    □
                  </span>

                  <span>
                    Produk
                  </span>

                </span>

                <span
                  className={`text-xs transition-transform ${
                    produkOpen
                      ? 'rotate-180'
                      : ''
                  }`}
                >
                  ▼
                </span>

              </button>


              {/* SUB MENU PRODUK */}

              {produkOpen && (
                <div className="ml-4 space-y-1 border-l border-slate-200 pl-3">

                  <NavLink
                    to="/products"
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2.5 text-sm transition ${
                        isActive
                          ? 'bg-blue-50 font-semibold text-blue-600'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`
                    }
                  >
                    Data Barang
                  </NavLink>


                  <NavLink
                    to="/categories"
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2.5 text-sm transition ${
                        isActive
                          ? 'bg-blue-50 font-semibold text-blue-600'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`
                    }
                  >
                    Kategori
                  </NavLink>


                  <NavLink
                    to="/units"
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2.5 text-sm transition ${
                        isActive
                          ? 'bg-blue-50 font-semibold text-blue-600'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`
                    }
                  >
                    Satuan
                  </NavLink>

                </div>
              )}


              {/* PELANGGAN */}

              <NavLink
                to="/customers"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >

                <span className="flex h-6 w-6 items-center justify-center">
                  ♙
                </span>

                <span>
                  Pelanggan
                </span>

              </NavLink>


              {/* STOK */}

              <NavLink
                to="/stock"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >

                <span className="flex h-6 w-6 items-center justify-center">
                  ▤
                </span>

                <span>
                  Stok
                </span>

              </NavLink>


              {/* LAPORAN */}

              <NavLink
                to="/reports"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >

                <span className="flex h-6 w-6 items-center justify-center">
                  ▥
                </span>

                <span>
                  Laporan
                </span>

              </NavLink>

            </>
          )}


          {/* ==============================
              KASIR ONLY
          ============================== */}

          {isKasir && (
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >

              <span className="flex h-6 w-6 items-center justify-center">
                □
              </span>

              <span>
                Barang
              </span>

            </NavLink>
          )}


          {/* ==============================
              PELANGGAN KASIR
          ============================== */}

          {isKasir && (
            <NavLink
              to="/customers"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >

              <span className="flex h-6 w-6 items-center justify-center">
                ♙
              </span>

              <span>
                Pelanggan
              </span>

            </NavLink>
          )}


          {/* ==============================
              MENU ADMIN
          ============================== */}

          {isAdmin && (
            <>

              <div className="my-5 border-t border-slate-200" />

              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Administrasi
              </p>


              {/* PEGAWAI */}

              <NavLink
                to="/employees"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >

                <span className="flex h-6 w-6 items-center justify-center">
                  ♙
                </span>

                <span>
                  Pegawai
                </span>

              </NavLink>


              {/* PENGATURAN */}

              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >

                <span className="flex h-6 w-6 items-center justify-center">
                  ⚙
                </span>

                <span>
                  Pengaturan
                </span>

              </NavLink>

            </>
          )}

        </div>


        {/* ==============================
            AKUN
        ============================== */}

        <div className="my-5 border-t border-slate-200" />

        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Akun
        </p>


        {/* PROFIL */}

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`
          }
        >

          <span className="flex h-6 w-6 items-center justify-center">
            ◉
          </span>

          <span>
            Profil
          </span>

        </NavLink>

        <NavLink
            to="/reports"
            className={({ isActive }) =>
                `flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
            }
            >
            Laporan
        </NavLink>

      </nav>


      {/* ==============================
          USER
      ============================== */}

      <div className="border-t border-slate-200 p-4">

        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
            {user?.name
              ?.charAt(0)
              ?.toUpperCase() || 'U'}
          </div>


          <div className="min-w-0 flex-1">

            <p className="truncate text-sm font-semibold text-slate-900">
              {user?.name || 'Pengguna'}
            </p>

            <p className="truncate text-xs text-slate-500">
              {user?.role === 'admin'
                ? 'Administrator'
                : 'Kasir'}
            </p>

          </div>

        </div>


        {/* ==============================
            LOGOUT BUTTON
        ============================== */}

        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >

          <span>
            ↪
          </span>

          <span>
            Keluar
          </span>

        </button>

      </div>

    </aside>
  )
}

export default Sidebar