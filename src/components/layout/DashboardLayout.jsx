import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Package,
  UserCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

function DashboardLayout({
  children,
  title,
  description,
  activeMenu,
}) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notificationOpen, setNotificationOpen] =
    useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [lowStockProducts, setLowStockProducts] =
    useState([])

  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  /*
  |--------------------------------------------------------------------------
  | User
  |--------------------------------------------------------------------------
  */

  const userInitial =
    user?.name?.charAt(0)?.toUpperCase() || 'U'

  const roleLabel =
    user?.role === 'admin'
      ? 'Administrator'
      : user?.role === 'kasir'
        ? 'Kasir'
        : 'Pengguna'

  /*
  |--------------------------------------------------------------------------
  | Low Stock
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!user) {
      return
    }

    const fetchLowStockProducts = async () => {
      try {
        const response = await api.get('/products')

        const responseData = response.data?.data

        let products = []

        if (Array.isArray(responseData)) {
          products = responseData
        } else if (
          Array.isArray(responseData?.data)
        ) {
          products = responseData.data
        }

        const lowStock = products.filter((product) => {
          if (product.is_active === false) {
            return false
          }

          const stock = Number(product.stock) || 0

          return stock < 20
        })

        setLowStockProducts(lowStock)
      } catch (error) {
        console.error(
          'Gagal mengambil data stok:',
          error
        )

        setLowStockProducts([])
      }
    }

    fetchLowStockProducts()
  }, [user])

  /*
  |--------------------------------------------------------------------------
  | Close Dropdown
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false)
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      )
    }
  }, [])

  /*
  |--------------------------------------------------------------------------
  | Sidebar
  |--------------------------------------------------------------------------
  */

  const handleSidebarToggle = () => {
    setSidebarOpen((previous) => !previous)

    setNotificationOpen(false)
    setProfileOpen(false)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  /*
  |--------------------------------------------------------------------------
  | Notification
  |--------------------------------------------------------------------------
  */

  const handleNotificationToggle = () => {
    setNotificationOpen((previous) => !previous)
    setProfileOpen(false)
  }

  const handleViewStock = () => {
    setNotificationOpen(false)
    navigate('/stock')
  }

  /*
  |--------------------------------------------------------------------------
  | Profile
  |--------------------------------------------------------------------------
  */

  const handleProfileToggle = () => {
    setProfileOpen((previous) => !previous)
    setNotificationOpen(false)
  }

  const handleProfile = () => {
    setProfileOpen(false)
    navigate('/profile')
  }

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const handleLogout = async () => {
    setProfileOpen(false)

    try {
      await logout()
    } catch (error) {
      console.error(
        'Gagal logout:',
        error
      )

      navigate('/login', {
        replace: true,
      })
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ============================================================
          SIDEBAR
      ============================================================ */}

      <Sidebar
        open={sidebarOpen}
        activeMenu={activeMenu}
        onClose={handleSidebarClose}
      />

      {/* ============================================================
          MAIN
      ============================================================ */}

      <div
        className={`
          min-h-screen
          transition-all
          duration-300
          ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'}
        `}
      >

        {/* ==========================================================
            NAVBAR
        ========================================================== */}

        <header
          className="
            sticky
            top-0
            z-30
            border-b
            border-slate-200/80
            bg-white/95
            shadow-sm
            backdrop-blur
          "
        >
          <div
            className="
              flex
              h-[76px]
              items-center
              justify-between
              px-4
              sm:px-6
              lg:px-8
            "
          >

            {/* ======================================================
                LEFT SIDE
            ====================================================== */}

            <div
              className="
                flex
                min-w-0
                items-center
                gap-3
              "
            >

              {/* Sidebar Toggle */}

              <button
                type="button"
                title={
                  sidebarOpen
                    ? 'Tutup Sidebar'
                    : 'Buka Sidebar'
                }
                aria-label={
                  sidebarOpen
                    ? 'Tutup Sidebar'
                    : 'Buka Sidebar'
                }
                onClick={handleSidebarToggle}
                className="
                  inline-flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  text-slate-500
                  shadow-sm
                  transition-all
                  duration-200
                  hover:border-blue-200
                  hover:bg-blue-50
                  hover:text-blue-600
                  active:scale-95
                "
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Divider */}

              <div
                className="
                  hidden
                  h-8
                  w-px
                  bg-slate-200
                  sm:block
                "
              />

              {/* Page Title */}

              <div className="min-w-0">

                <h2
                  className="
                    truncate
                    text-lg
                    font-bold
                    tracking-tight
                    text-slate-900
                    sm:text-xl
                  "
                >
                  {title || 'Dashboard'}
                </h2>

                {description && (
                  <p
                    className="
                      mt-0.5
                      hidden
                      truncate
                      text-xs
                      font-medium
                      text-slate-400
                      md:block
                    "
                  >
                    {description}
                  </p>
                )}

              </div>

            </div>

            {/* ======================================================
                RIGHT SIDE
            ====================================================== */}

            <div
              className="
                flex
                items-center
                gap-2
                sm:gap-3
              "
            >

              {/* ====================================================
                  NOTIFICATION
              ==================================================== */}

              <div
                ref={notificationRef}
                className="relative"
              >

                <button
                  type="button"
                  title="Notifikasi stok"
                  aria-label="Notifikasi stok"
                  aria-expanded={notificationOpen}
                  onClick={handleNotificationToggle}
                  className={`
                    relative
                    inline-flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    border
                    transition-all
                    duration-200
                    active:scale-95
                    ${
                      notificationOpen
                        ? 'border-blue-200 bg-blue-50 text-blue-600 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-500 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600'
                    }
                  `}
                >
                  <Bell className="h-[18px] w-[18px]" />

                  {lowStockProducts.length > 0 && (
                    <span
                      className="
                        absolute
                        -right-1
                        -top-1
                        flex
                        min-h-5
                        min-w-5
                        items-center
                        justify-center
                        rounded-full
                        border-2
                        border-white
                        bg-red-500
                        px-1
                        text-[10px]
                        font-bold
                        leading-none
                        text-white
                      "
                    >
                      {lowStockProducts.length > 99
                        ? '99+'
                        : lowStockProducts.length}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}

                {notificationOpen && (
                  <div
                    className="
                      absolute
                      right-0
                      top-12
                      z-50
                      w-[340px]
                      max-w-[calc(100vw-2rem)]
                      overflow-hidden
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      shadow-2xl
                      shadow-slate-900/10
                    "
                  >

                    {/* Header */}

                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        border-b
                        border-slate-100
                        bg-slate-50
                        px-4
                        py-4
                      "
                    >
                      <div>
                        <p
                          className="
                            text-sm
                            font-bold
                            text-slate-900
                          "
                        >
                          Notifikasi
                        </p>

                        <p
                          className="
                            mt-0.5
                            text-xs
                            text-slate-500
                          "
                        >
                          Kondisi stok barang
                        </p>
                      </div>

                      <div
                        className="
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-xl
                          bg-orange-100
                          text-orange-600
                        "
                      >
                        <Bell className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Empty */}

                    {lowStockProducts.length === 0 ? (
                      <div
                        className="
                          px-5
                          py-9
                          text-center
                        "
                      >
                        <div
                          className="
                            mx-auto
                            mb-3
                            flex
                            h-14
                            w-14
                            items-center
                            justify-center
                            rounded-2xl
                            bg-emerald-50
                            text-emerald-600
                          "
                        >
                          <Package className="h-6 w-6" />
                        </div>

                        <p
                          className="
                            text-sm
                            font-bold
                            text-slate-800
                          "
                        >
                          Stok aman
                        </p>

                        <p
                          className="
                            mt-1
                            text-xs
                            leading-5
                            text-slate-500
                          "
                        >
                          Tidak ada barang aktif
                          dengan stok di bawah 20.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Product List */}

                        <div
                          className="
                            max-h-80
                            overflow-y-auto
                          "
                        >
                          {lowStockProducts.map(
                            (product) => {
                              const stock =
                                Number(product.stock) || 0

                              const unit =
                                product.base_unit?.symbol ||
                                product.baseUnit?.symbol ||
                                product.base_unit?.name ||
                                product.baseUnit?.name ||
                                ''

                              return (
                                <button
                                  key={product.id}
                                  type="button"
                                  onClick={handleViewStock}
                                  className="
                                    group
                                    flex
                                    w-full
                                    items-start
                                    gap-3
                                    border-b
                                    border-slate-100
                                    px-4
                                    py-3.5
                                    text-left
                                    transition
                                    hover:bg-slate-50
                                  "
                                >

                                  {/* Icon */}

                                  <div
                                    className="
                                      mt-0.5
                                      flex
                                      h-10
                                      w-10
                                      shrink-0
                                      items-center
                                      justify-center
                                      rounded-xl
                                      bg-orange-50
                                      text-orange-600
                                    "
                                  >
                                    <Package className="h-4 w-4" />
                                  </div>

                                  {/* Product */}

                                  <div className="min-w-0 flex-1">

                                    <p
                                      className="
                                        truncate
                                        text-sm
                                        font-semibold
                                        text-slate-800
                                      "
                                    >
                                      {product.name}
                                    </p>

                                    {(product.brand ||
                                      product.size) && (
                                      <p
                                        className="
                                          mt-0.5
                                          truncate
                                          text-xs
                                          text-slate-500
                                        "
                                      >
                                        {product.brand || ''}

                                        {product.brand &&
                                        product.size
                                          ? ' • '
                                          : ''}

                                        {product.size || ''}
                                      </p>
                                    )}

                                    <p
                                      className="
                                        mt-1
                                        text-xs
                                        font-semibold
                                        text-orange-600
                                      "
                                    >
                                      Stok: {stock} {unit}
                                    </p>

                                  </div>

                                  {/* Arrow */}

                                  <span
                                    className="
                                      mt-2
                                      text-slate-300
                                      transition
                                      group-hover:translate-x-1
                                      group-hover:text-blue-500
                                    "
                                  >
                                    →
                                  </span>

                                </button>
                              )
                            }
                          )}
                        </div>

                        {/* Footer */}

                        <div
                          className="
                            border-t
                            border-slate-100
                            bg-slate-50/50
                            p-3
                          "
                        >
                          <button
                            type="button"
                            onClick={handleViewStock}
                            className="
                              w-full
                              rounded-xl
                              bg-orange-50
                              px-3
                              py-2.5
                              text-sm
                              font-semibold
                              text-orange-600
                              transition
                              hover:bg-orange-100
                              active:scale-[0.99]
                            "
                          >
                            Lihat Semua Stok
                          </button>
                        </div>
                      </>
                    )}

                  </div>
                )}

              </div>

              {/* Divider */}

              <div
                className="
                  hidden
                  h-8
                  w-px
                  bg-slate-200
                  sm:block
                "
              />

              {/* ====================================================
                  PROFILE
              ==================================================== */}

              <div
                ref={profileRef}
                className="relative"
              >

                <button
                  type="button"
                  title="Menu pengguna"
                  aria-label="Menu pengguna"
                  aria-expanded={profileOpen}
                  onClick={handleProfileToggle}
                  className={`
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    px-1.5
                    py-1.5
                    transition-all
                    duration-200
                    sm:gap-3
                    sm:pl-2.5
                    sm:pr-2
                    ${
                      profileOpen
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    }
                  `}
                >

                  {/* User Info */}

                  <div
                    className="
                      hidden
                      text-right
                      sm:block
                    "
                  >
                    <p
                      className="
                        max-w-[150px]
                        truncate
                        text-sm
                        font-semibold
                        text-slate-900
                      "
                    >
                      {user?.name || 'Pengguna'}
                    </p>

                    <p
                      className="
                        text-[11px]
                        font-medium
                        text-slate-400
                      "
                    >
                      {roleLabel}
                    </p>
                  </div>

                  {/* Avatar */}

                  <div
                    className="
                      relative
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-gradient-to-br
                      from-blue-500
                      to-blue-700
                      text-sm
                      font-bold
                      text-white
                      shadow-sm
                      shadow-blue-200
                    "
                  >
                    {userInitial}

                    <span
                      className="
                        absolute
                        -bottom-0.5
                        -right-0.5
                        h-3
                        w-3
                        rounded-full
                        border-2
                        border-white
                        bg-emerald-500
                      "
                    />
                  </div>

                  {/* Chevron */}

                  <ChevronDown
                    className={`
                      hidden
                      h-4
                      w-4
                      text-slate-400
                      transition-transform
                      duration-200
                      sm:block
                      ${profileOpen ? 'rotate-180' : ''}
                    `}
                  />

                </button>

                {/* ==================================================
                    PROFILE DROPDOWN
                ================================================== */}

                {profileOpen && (
                  <div
                    className="
                      absolute
                      right-0
                      top-12
                      z-50
                      w-[280px]
                      overflow-hidden
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      shadow-2xl
                      shadow-slate-900/10
                    "
                  >

                    {/* Profile Header */}

                    <div
                      className="
                        border-b
                        border-slate-100
                        bg-slate-50
                        px-4
                        py-4
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          gap-3
                        "
                      >

                        {/* Avatar */}

                        <div
                          className="
                            relative
                            flex
                            h-12
                            w-12
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            bg-gradient-to-br
                            from-blue-500
                            to-blue-700
                            text-sm
                            font-bold
                            text-white
                            shadow-sm
                          "
                        >
                          {userInitial}

                          <span
                            className="
                              absolute
                              -bottom-0.5
                              -right-0.5
                              h-3
                              w-3
                              rounded-full
                              border-2
                              border-white
                              bg-emerald-500
                            "
                          />
                        </div>

                        {/* User */}

                        <div className="min-w-0">

                          <p
                            className="
                              truncate
                              text-sm
                              font-bold
                              text-slate-900
                            "
                          >
                            {user?.name || 'Pengguna'}
                          </p>

                          <p
                            className="
                              mt-0.5
                              truncate
                              text-xs
                              text-slate-500
                            "
                          >
                            {user?.email || '-'}
                          </p>

                        </div>

                      </div>

                      {/* Role */}

                      <div className="mt-3">

                        <span
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-full
                            bg-blue-100
                            px-2.5
                            py-1
                            text-[11px]
                            font-bold
                            text-blue-700
                          "
                        >
                          <span
                            className="
                              h-1.5
                              w-1.5
                              rounded-full
                              bg-blue-500
                            "
                          />

                          {roleLabel}
                        </span>

                      </div>

                    </div>

                    {/* Menu */}

                    <div className="p-2">

                      {/* Profile */}

                      <button
                        type="button"
                        onClick={handleProfile}
                        className="
                          group
                          flex
                          w-full
                          items-center
                          gap-3
                          rounded-xl
                          px-3
                          py-2.5
                          text-left
                          transition
                          hover:bg-slate-50
                        "
                      >
                        <div
                          className="
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-slate-100
                            text-slate-500
                            transition
                            group-hover:bg-blue-50
                            group-hover:text-blue-600
                          "
                        >
                          <UserCircle className="h-4 w-4" />
                        </div>

                        <div>
                          <p
                            className="
                              text-sm
                              font-semibold
                              text-slate-700
                            "
                          >
                            Profil Saya
                          </p>

                          <p
                            className="
                              mt-0.5
                              text-[11px]
                              text-slate-400
                            "
                          >
                            Kelola informasi profil
                          </p>
                        </div>

                      </button>

                      {/* Logout */}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="
                          group
                          mt-1
                          flex
                          w-full
                          items-center
                          gap-3
                          rounded-xl
                          px-3
                          py-2.5
                          text-left
                          transition
                          hover:bg-red-50
                        "
                      >
                        <div
                          className="
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-red-50
                            text-red-500
                            transition
                            group-hover:bg-red-100
                          "
                        >
                          <LogOut className="h-4 w-4" />
                        </div>

                        <div>
                          <p
                            className="
                              text-sm
                              font-semibold
                              text-red-600
                            "
                          >
                            Keluar
                          </p>

                          <p
                            className="
                              mt-0.5
                              text-[11px]
                              text-red-400
                            "
                          >
                            Keluar dari akun
                          </p>
                        </div>

                      </button>

                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>
        </header>

        {/* ============================================================
            PAGE CONTENT
        ============================================================ */}

        <main
          className="
            p-4
            sm:p-6
            lg:p-8
          "
        >
          {children}
        </main>

      </div>

    </div>
  )
}

export default DashboardLayout