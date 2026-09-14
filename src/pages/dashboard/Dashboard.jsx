import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [transactions, setTransactions] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ==========================================
  // ROLE
  // ==========================================

  const isAdmin = user?.role === 'admin'
  const isKasir = user?.role === 'kasir'

  // ==========================================
  // FORMAT RUPIAH
  // ==========================================

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(value) || 0)
  }

  // ==========================================
  // FORMAT TANGGAL
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return '-'
    }

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return '-'
    }

    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsedDate)
  }

  // ==========================================
  // CEK HARI INI
  // ==========================================

  const isToday = (date) => {
    if (!date) {
      return false
    }

    const transactionDate = new Date(date)
    const today = new Date()

    if (
      Number.isNaN(
        transactionDate.getTime()
      )
    ) {
      return false
    }

    return (
      transactionDate.getDate() ===
        today.getDate() &&
      transactionDate.getMonth() ===
        today.getMonth() &&
      transactionDate.getFullYear() ===
        today.getFullYear()
    )
  }

  // ==========================================
  // AMBIL DATA DASHBOARD
  // ==========================================

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      const [
        productsResponse,
        transactionsResponse,
      ] = await Promise.all([
        api.get('/products'),
        api.get('/transactions'),
      ])

      // ========================================
      // PRODUCTS
      // ========================================

      const productsResponseData =
        productsResponse.data?.data

      let productsData = []

      if (
        Array.isArray(
          productsResponseData
        )
      ) {
        productsData =
          productsResponseData
      } else if (
        Array.isArray(
          productsResponse.data
        )
      ) {
        productsData =
          productsResponse.data
      } else if (
        Array.isArray(
          productsResponseData?.data
        )
      ) {
        productsData =
          productsResponseData.data
      }

      setProducts(productsData)

      // ========================================
      // TRANSACTIONS
      // ========================================

      const transactionsResponseData =
        transactionsResponse.data?.data

      let transactionsData = []

      if (
        Array.isArray(
          transactionsResponseData
        )
      ) {
        transactionsData =
          transactionsResponseData
      } else if (
        Array.isArray(
          transactionsResponseData?.data
        )
      ) {
        transactionsData =
          transactionsResponseData.data
      } else if (
        Array.isArray(
          transactionsResponse.data
        )
      ) {
        transactionsData =
          transactionsResponse.data
      }

      setTransactions(transactionsData)

    } catch (error) {
      console.error(
        'Gagal mengambil data dashboard:',
        error
      )

      setError(
        error.response?.data?.message ||
          'Gagal mengambil data dashboard.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // ==========================================
  // TRANSAKSI HARI INI
  // ==========================================

  const todayTransactions =
    useMemo(() => {
      return transactions.filter(
        (transaction) => {
          return isToday(
            transaction.created_at ||
              transaction.transaction_date ||
              transaction.date
          )
        }
      )
    }, [transactions])

  // ==========================================
  // PENJUALAN HARI INI
  // ==========================================

  const todaySales =
    useMemo(() => {
      return todayTransactions.reduce(
        (total, transaction) => {
          return (
            total +
            Number(
              transaction.total ||
                transaction.grand_total ||
                transaction.total_amount ||
                0
            )
          )
        },
        0
      )
    }, [todayTransactions])

  // ==========================================
  // PRODUK AKTIF
  // ==========================================

  const activeProducts =
    useMemo(() => {
      return products.filter(
        (product) =>
          product.is_active !== false
      )
    }, [products])

  // ==========================================
  // STOK MENIPIS
  // ==========================================

  const lowStockProducts =
    useMemo(() => {
      return activeProducts.filter(
        (product) => {
          const stock =
            Number(product.stock) || 0

          const minimumStock =
            Number(
              product.minimum_stock ||
                product.min_stock ||
                product.min ||
                0
            )

          return stock <= minimumStock
        }
      )
    }, [activeProducts])

  // ==========================================
  // PRODUK TERLARIS
  // ==========================================

  const bestProducts =
    useMemo(() => {
      const productSales = {}

      transactions.forEach(
        (transaction) => {
          const items =
            transaction.details ||
            transaction.items ||
            transaction.transaction_details ||
            []

          if (!Array.isArray(items)) {
            return
          }

          items.forEach((item) => {
            const product =
              item.product || {}

            const productId =
              item.product_id ||
              product.id

            if (!productId) {
              return
            }

            if (!productSales[productId]) {
              productSales[productId] = {
                name:
                  product.name ||
                  item.product_name ||
                  'Produk',

                quantity: 0,

                total: 0,
              }
            }

            productSales[
              productId
            ].quantity += Number(
              item.quantity ||
                item.qty ||
                0
            )

            productSales[
              productId
            ].total += Number(
              item.subtotal ||
                item.total ||
                0
            )
          })
        }
      )

      return Object.values(
        productSales
      )
        .sort(
          (a, b) =>
            b.quantity -
            a.quantity
        )
        .slice(0, 5)

    }, [transactions])

  // ==========================================
  // TRANSAKSI TERBARU
  // ==========================================

  const recentTransactions =
    useMemo(() => {
      return [...transactions]
        .sort((a, b) => {
          return (
            new Date(
              b.created_at ||
                b.transaction_date ||
                b.date ||
                0
            ) -
            new Date(
              a.created_at ||
                a.transaction_date ||
                a.date ||
                0
            )
          )
        })
        .slice(0, 5)
    }, [transactions])

  // ==========================================
  // TOTAL NILAI STOK
  // ==========================================

  const totalStockValue =
    useMemo(() => {
      return activeProducts.reduce(
        (total, product) => {
          return (
            total +
            Number(
              product.stock || 0
            ) *
              Number(
                product.purchase_price ||
                  0
              )
          )
        },
        0
      )
    }, [activeProducts])

  // ==========================================
  // STATISTIK ADMIN
  // ==========================================

  const adminStats = [
    {
      title: 'Penjualan Hari Ini',

      value:
        formatRupiah(todaySales),

      description:
        `${todayTransactions.length} transaksi hari ini`,

      icon: 'Rp',

      iconClass:
        'bg-blue-100 text-blue-600',
    },

    {
      title: 'Transaksi Hari Ini',

      value:
        todayTransactions.length,

      description:
        'Transaksi yang tercatat hari ini',

      icon: 'TRX',

      iconClass:
        'bg-emerald-100 text-emerald-600',
    },

    {
      title: 'Total Produk',

      value:
        activeProducts.length,

      description:
        'Produk aktif di BuildPOS',

      icon: 'PRD',

      iconClass:
        'bg-violet-100 text-violet-600',
    },

    {
      title: 'Stok Menipis',

      value:
        lowStockProducts.length,

      description:
        'Produk perlu diperiksa',

      icon: 'STK',

      iconClass:
        'bg-orange-100 text-orange-600',
    },
  ]

  // ==========================================
  // STATISTIK KASIR
  // ==========================================

  const cashierStats = [
    {
      title: 'Penjualan Hari Ini',

      value:
        formatRupiah(todaySales),

      description:
        'Total penjualan hari ini',

      icon: 'Rp',

      iconClass:
        'bg-blue-100 text-blue-600',
    },

    {
      title: 'Transaksi Hari Ini',

      value:
        todayTransactions.length,

      description:
        'Jumlah transaksi hari ini',

      icon: 'TRX',

      iconClass:
        'bg-emerald-100 text-emerald-600',
    },

    {
      title: 'Produk Tersedia',

      value:
        activeProducts.length,

      description:
        'Produk yang dapat dijual',

      icon: 'PRD',

      iconClass:
        'bg-violet-100 text-violet-600',
    },
  ]

  // ==========================================
  // STATISTIK SESUAI ROLE
  // ==========================================

  const stats = isAdmin
    ? adminStats
    : cashierStats

  return (
    <DashboardLayout
      title="Dashboard"
      description={
        isAdmin
          ? 'Ringkasan aktivitas toko hari ini'
          : 'Ringkasan aktivitas kasir hari ini'
      }
      activeMenu="Dashboard"
    >

      {/* =====================================
          ERROR
      ====================================== */}

      {error && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">

          <p className="text-sm font-medium text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={
              fetchDashboardData
            }
            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
            Coba Lagi
          </button>

        </div>
      )}


      {/* =====================================
          WELCOME
      ====================================== */}

      <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-sm">

        <p className="text-sm text-blue-100">
          Selamat datang kembali
        </p>

        <h3 className="mt-1 text-2xl font-bold">
          Halo, {user?.name || 'Pengguna'} 👋
        </h3>

        <p className="mt-2 max-w-xl text-sm text-blue-100">
          {isAdmin
            ? 'Pantau penjualan, transaksi, produk, dan kondisi stok toko dari dashboard BuildPOS.'
            : 'Pantau aktivitas transaksi dan akses kasir dengan cepat melalui dashboard BuildPOS.'}
        </p>

      </div>


      {/* =====================================
          LOADING
      ====================================== */}

      {loading ? (

        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm text-slate-500">
            Memuat data dashboard...
          </p>

        </div>

      ) : (

        <>

          {/* =====================================
              QUICK ACTION KASIR
          ====================================== */}

          {isKasir && (
            <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Siap melayani transaksi?
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    Buat transaksi baru untuk pelanggan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate('/cashier')
                  }
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  + Buat Transaksi
                </button>

              </div>

            </div>
          )}


          {/* =====================================
              STATISTICS
          ====================================== */}

          <div
            className={`grid gap-4 ${
              isAdmin
                ? 'sm:grid-cols-2 xl:grid-cols-4'
                : 'sm:grid-cols-2 xl:grid-cols-3'
            }`}
          >

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


          {/* =====================================
              ADMIN ONLY
              INFO STOK
          ====================================== */}

          {isAdmin && (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">

              {/* NILAI PERSEDIAAN */}

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Nilai Persediaan
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Estimasi nilai stok berdasarkan harga beli
                    </p>

                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-600">
                    Rp
                  </div>

                </div>

                <p className="mt-5 text-3xl font-bold text-slate-900">
                  {formatRupiah(
                    totalStockValue
                  )}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  {activeProducts.length} produk aktif
                </p>

              </div>


              {/* KONDISI STOK */}

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Kondisi Stok
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Ringkasan kondisi persediaan
                    </p>

                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-sm font-bold text-orange-600">
                    STK
                  </div>

                </div>

                <div className="mt-5 flex items-end gap-3">

                  <p className="text-3xl font-bold text-slate-900">
                    {lowStockProducts.length}
                  </p>

                  <p className="pb-1 text-sm text-slate-500">
                    produk stok menipis
                  </p>

                </div>

                {lowStockProducts.length === 0 ? (

                  <p className="mt-3 text-sm text-emerald-600">
                    Semua stok masih berada di atas batas minimum.
                  </p>

                ) : (

                  <p className="mt-3 text-sm text-orange-600">
                    Beberapa produk perlu segera diperiksa.
                  </p>

                )}

              </div>

            </div>
          )}


          {/* =====================================
              ADMIN ONLY
              BEST PRODUCT + LOW STOCK
          ====================================== */}

          {isAdmin && (
            <div className="mt-6 grid gap-6 xl:grid-cols-2">

              {/* PRODUK TERLARIS */}

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-5">

                  <h3 className="font-bold text-slate-900">
                    Produk Terlaris
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Berdasarkan jumlah produk terjual
                  </p>

                </div>

                {bestProducts.length === 0 ? (

                  <div className="rounded-xl bg-slate-50 p-8 text-center">

                    <p className="text-sm font-medium text-slate-600">
                      Belum ada data penjualan.
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Produk terlaris akan muncul setelah ada transaksi.
                    </p>

                  </div>

                ) : (

                  <div className="space-y-4">

                    {bestProducts.map(
                      (
                        product,
                        index
                      ) => (

                        <div
                          key={`${product.name}-${index}`}
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
                              {product.quantity} terjual
                            </p>

                          </div>

                          <p className="text-right text-xs font-semibold text-slate-700">
                            {formatRupiah(
                              product.total
                            )}
                          </p>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>


              {/* STOK MENIPIS */}

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-5 flex items-start justify-between">

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

                {lowStockProducts.length === 0 ? (

                  <div className="rounded-xl bg-emerald-50 p-8 text-center">

                    <p className="text-sm font-semibold text-emerald-700">
                      Stok aman
                    </p>

                    <p className="mt-1 text-xs text-emerald-600">
                      Tidak ada produk yang berada di bawah stok minimum.
                    </p>

                  </div>

                ) : (

                  <div className="space-y-3">

                    {lowStockProducts
                      .slice(0, 5)
                      .map(
                        (product) => {

                          const stock =
                            Number(
                              product.stock
                            ) || 0

                          const minimum =
                            Number(
                              product.minimum_stock ||
                                product.min_stock ||
                                product.min ||
                                0
                            )

                          const unit =
                            product.base_unit?.symbol ||
                            product.unit?.symbol ||
                            ''

                          return (
                            <div
                              key={product.id}
                              className="rounded-xl border border-orange-100 bg-orange-50 p-4"
                            >

                              <div className="flex items-start justify-between gap-3">

                                <p className="text-sm font-semibold text-slate-800">
                                  {product.name}
                                </p>

                                <span className="whitespace-nowrap text-xs font-bold text-orange-600">
                                  {stock} {unit}
                                </span>

                              </div>

                              <div className="mt-2 flex items-center justify-between">

                                <span className="text-xs text-slate-500">
                                  Minimum: {minimum} {unit}
                                </span>

                                <span className="text-xs font-semibold text-orange-600">
                                  Perlu Restock
                                </span>

                              </div>

                            </div>
                          )
                        }
                      )}

                  </div>

                )}

              </div>

            </div>
          )}


          {/* =====================================
              TRANSAKSI TERBARU
          ====================================== */}

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

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
                onClick={() =>
                  navigate('/transactions')
                }
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Lihat Semua
              </button>

            </div>


            <div className="overflow-x-auto">

              <table className="w-full min-w-[700px]">

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

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Waktu
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {recentTransactions.length === 0 ? (

                    <tr>

                      <td
                        colSpan="5"
                        className="px-6 py-12 text-center"
                      >

                        <p className="text-sm font-semibold text-slate-600">
                          Belum ada transaksi
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Transaksi terbaru akan muncul di sini.
                        </p>

                      </td>

                    </tr>

                  ) : (

                    recentTransactions.map(
                      (transaction) => {

                        const transactionNumber =
                          transaction.transaction_number ||
                          transaction.invoice_number ||
                          transaction.number ||
                          `TRX-${transaction.id}`

                        const customerName =
                          transaction.customer?.name ||
                          transaction.customer_name ||
                          'Pelanggan Umum'

                        const total =
                          Number(
                            transaction.total ||
                              transaction.grand_total ||
                              transaction.total_amount ||
                              0
                          )

                        const status =
                          transaction.status ||
                          'completed'

                        return (
                          <tr
                            key={transaction.id}
                            className="border-b border-slate-100 transition hover:bg-slate-50"
                          >

                            <td className="px-6 py-4">

                              <p className="text-sm font-semibold text-slate-800">
                                {transactionNumber}
                              </p>

                            </td>

                            <td className="px-6 py-4 text-sm text-slate-600">
                              {customerName}
                            </td>

                            <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                              {formatRupiah(total)}
                            </td>

                            <td className="px-6 py-4">

                              <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
                                {status}
                              </span>

                            </td>

                            <td className="px-6 py-4 text-sm text-slate-500">
                              {formatDate(
                                transaction.created_at ||
                                  transaction.transaction_date ||
                                  transaction.date
                              )}
                            </td>

                          </tr>
                        )
                      }
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </>

      )}

    </DashboardLayout>
  )
}

export default Dashboard