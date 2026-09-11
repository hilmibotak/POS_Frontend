import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

function Dashboard() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const stats = [
    {
      title: 'Penjualan Hari Ini',
      value: 'Rp 4.850.000',
      description: '+12,5% dari kemarin',
      icon: 'Rp',
      iconClass: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Transaksi Hari Ini',
      value: '32',
      description: '+8 transaksi',
      icon: 'TRX',
      iconClass: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Total Produk',
      value: '248',
      description: 'Produk aktif',
      icon: 'PRD',
      iconClass: 'bg-violet-100 text-violet-600',
    },
    {
      title: 'Stok Menipis',
      value: '12',
      description: 'Perlu diperiksa',
      icon: 'STK',
      iconClass: 'bg-orange-100 text-orange-600',
    },
  ]

  const transactions = [
    {
      number: 'TRX-20260911-001',
      customer: 'Pelanggan Umum',
      total: 'Rp 450.000',
      status: 'Selesai',
      time: '09:15',
    },
    {
      number: 'TRX-20260911-002',
      customer: 'Toko Maju Jaya',
      total: 'Rp 1.250.000',
      status: 'Selesai',
      time: '10:02',
    },
    {
      number: 'TRX-20260911-003',
      customer: 'Pelanggan Umum',
      total: 'Rp 275.000',
      status: 'Selesai',
      time: '10:45',
    },
    {
      number: 'TRX-20260911-004',
      customer: 'CV Bangun Sejahtera',
      total: 'Rp 2.875.000',
      status: 'Selesai',
      time: '11:20',
    },
    {
      number: 'TRX-20260911-005',
      customer: 'Pelanggan Umum',
      total: 'Rp 325.000',
      status: 'Selesai',
      time: '12:05',
    },
  ]

  const bestProducts = [
    {
      name: 'Semen Portland 50kg',
      sold: '45 Sak',
      total: 'Rp 3.375.000',
    },
    {
      name: 'Batu Bata Merah',
      sold: '850 Buah',
      total: 'Rp 850.000',
    },
    {
      name: 'Pasir Bangunan',
      sold: '8 Kolbak',
      total: 'Rp 2.400.000',
    },
    {
      name: 'Besi Beton 10mm',
      sold: '35 Batang',
      total: 'Rp 1.925.000',
    },
  ]

  const lowStockProducts = [
    {
      name: 'Semen Portland 50kg',
      stock: '8 Sak',
      minimum: '10 Sak',
    },
    {
      name: 'Besi Beton 8mm',
      stock: '5 Batang',
      minimum: '15 Batang',
    },
    {
      name: 'Cat Tembok 5kg',
      stock: '3 Kaleng',
      minimum: '10 Kaleng',
    },
  ]

  const menuItems = [
    {
      label: 'Dashboard',
      icon: '▦',
      active: true,
    },
    {
      label: 'Kasir',
      icon: '▣',
    },
    {
      label: 'Riwayat Transaksi',
      icon: '↺',
    },
    {
      label: 'Produk',
      icon: '□',
    },
    {
      label: 'Pelanggan',
      icon: '♙',
    },
    {
      label: 'Stok',
      icon: '▤',
    },
    {
      label: 'Laporan',
      icon: '▥',
    },
  ]

  if (user?.role === 'admin') {
    menuItems.push({
      label: 'Pegawai',
      icon: '♙',
    })

    menuItems.push({
      label: 'Pengaturan',
      icon: '⚙',
    })
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
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

        {/* Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Menu Utama
          </p>

          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                item.active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center text-sm">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </button>
          ))}

          <div className="my-5 border-t border-slate-200" />

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Akun
          </p>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <span className="flex h-6 w-6 items-center justify-center">
              ◉
            </span>
            <span>Profil</span>
          </button>
        </nav>

        {/* User */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user?.name || 'Pengguna'}
              </p>

              <p className="truncate text-xs text-slate-500">
                {user?.role === 'admin' ? 'Administrator' : 'Kasir'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <span>↪</span>
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div
        className={`min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : ''
        }`}
      >
        {/* HEADER */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              ☰
            </button>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Dashboard
              </h2>

              <p className="hidden text-sm text-slate-500 sm:block">
                Ringkasan aktivitas toko hari ini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification */}
            <button
              type="button"
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"
            >
              🔔
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* User */}
            <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 sm:flex">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {user?.name || 'Pengguna'}
                </p>

                <p className="text-xs text-slate-500">
                  {user?.role === 'admin' ? 'Administrator' : 'Kasir'}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Welcome */}
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-sm">
            <p className="text-sm text-blue-100">
              Selamat datang kembali
            </p>

            <h3 className="mt-1 text-2xl font-bold">
              Halo, {user?.name || 'Pengguna'} 👋
            </h3>

            <p className="mt-2 max-w-xl text-sm text-blue-100">
              Pantau penjualan, transaksi, produk, dan kondisi stok
              toko dari dashboard BuildPOS.
            </p>
          </div>

          {/* STATISTICS */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {stat.value}
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-xs font-bold ${stat.iconClass}`}
                  >
                    {stat.icon}
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>

          {/* CHART + BEST PRODUCT */}
          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            {/* Sales Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Penjualan Mingguan
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Performa penjualan 7 hari terakhir
                  </p>
                </div>

                <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-blue-500">
                  <option>7 Hari</option>
                  <option>30 Hari</option>
                </select>
              </div>

              {/* Fake Chart */}
              <div className="mt-8">
                <div className="flex h-64 items-end justify-between gap-3 border-b border-l border-slate-200 px-3">
                  {[
                    ['Sen', 45],
                    ['Sel', 65],
                    ['Rab', 52],
                    ['Kam', 80],
                    ['Jum', 70],
                    ['Sab', 95],
                    ['Min', 60],
                  ].map(([day, height]) => (
                    <div
                      key={day}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <div
                        className="w-full max-w-10 rounded-t-lg bg-blue-500 transition hover:bg-blue-600"
                        style={{ height: `${height}%` }}
                      />

                      <span className="text-xs text-slate-500">
                        {day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Best Product */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h3 className="font-bold text-slate-900">
                  Produk Terlaris
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Produk dengan penjualan tertinggi
                </p>
              </div>

              <div className="space-y-4">
                {bestProducts.map((product, index) => (
                  <div
                    key={product.name}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {product.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {product.sold}
                      </p>
                    </div>

                    <p className="text-right text-xs font-semibold text-slate-700">
                      {product.total}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TRANSACTIONS + LOW STOCK */}
          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            {/* Transactions */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-200 p-6">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Transaksi Terbaru
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Aktivitas transaksi terbaru
                  </p>
                </div>

                <button
                  type="button"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Lihat Semua
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Transaksi
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Pelanggan
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Total
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.number}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {transaction.number}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {transaction.time}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {transaction.customer}
                        </td>

                        <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                          {transaction.total}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Low Stock */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Stok Menipis
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Produk yang perlu restock
                  </p>
                </div>

                <div className="rounded-lg bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-600">
                  {lowStockProducts.length}
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.name}
                    className="rounded-xl border border-orange-100 bg-orange-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">
                        {product.name}
                      </p>

                      <span className="whitespace-nowrap text-xs font-bold text-orange-600">
                        {product.stock}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Minimum: {product.minimum}
                      </span>

                      <span className="text-xs font-semibold text-orange-600">
                        Restock
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Kelola Stok
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard