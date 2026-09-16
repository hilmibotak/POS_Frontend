import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Package,
  Plus,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'

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

  const isAdmin = user?.role === 'admin'
  const isKasir = user?.role === 'kasir'

  const LOW_STOCK_LIMIT = 20

  /*
  |--------------------------------------------------------------------------
  | FORMAT RUPIAH
  |--------------------------------------------------------------------------
  */

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(value) || 0)
  }

  /*
  |--------------------------------------------------------------------------
  | FORMAT ANGKA
  |--------------------------------------------------------------------------
  */

  const formatNumber = (value) => {
    return new Intl.NumberFormat('id-ID').format(
      Number(value) || 0
    )
  }

  /*
  |--------------------------------------------------------------------------
  | FORMAT STOK
  |--------------------------------------------------------------------------
  */

  const formatStock = (value) => {
    const number = Number(value ?? 0)

    if (Number.isInteger(number)) {
      return number.toString()
    }

    return number.toLocaleString('id-ID', {
      maximumFractionDigits: 3,
    })
  }

  /*
  |--------------------------------------------------------------------------
  | FORMAT TANGGAL
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | CEK HARI INI
  |--------------------------------------------------------------------------
  */

  const isToday = (date) => {
    if (!date) {
      return false
    }

    const transactionDate = new Date(date)
    const today = new Date()

    if (
      Number.isNaN(transactionDate.getTime())
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

  /*
  |--------------------------------------------------------------------------
  | GET TRANSACTION DATE
  |--------------------------------------------------------------------------
  */

  const getTransactionDate = (transaction) => {
    return (
      transaction?.created_at ||
      transaction?.transaction_date ||
      transaction?.date ||
      null
    )
  }

  /*
  |--------------------------------------------------------------------------
  | GET TRANSACTION TOTAL
  |--------------------------------------------------------------------------
  */

  const getTransactionTotal = (transaction) => {
    return Number(
      transaction?.total ||
        transaction?.grand_total ||
        transaction?.total_amount ||
        0
    )
  }

  /*
  |--------------------------------------------------------------------------
  | FETCH DASHBOARD
  |--------------------------------------------------------------------------
  */

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

      /*
      |--------------------------------------------------------------------------
      | PRODUCTS
      |--------------------------------------------------------------------------
      */

      const productsResponseData =
        productsResponse.data?.data

      let productsData = []

      if (Array.isArray(productsResponseData)) {
        productsData = productsResponseData
      } else if (
        Array.isArray(productsResponse.data)
      ) {
        productsData = productsResponse.data
      } else if (
        Array.isArray(
          productsResponseData?.data
        )
      ) {
        productsData =
          productsResponseData.data
      }

      setProducts(productsData)

      /*
      |--------------------------------------------------------------------------
      | TRANSACTIONS
      |--------------------------------------------------------------------------
      */

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
    } catch (err) {
      console.error(
        'Gagal mengambil data dashboard:',
        err
      )

      setError(
        err.response?.data?.message ||
          'Gagal mengambil data dashboard.'
      )
    } finally {
      setLoading(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchDashboardData()
  }, [])

  /*
  |--------------------------------------------------------------------------
  | ACTIVE PRODUCTS
  |--------------------------------------------------------------------------
  */

  const activeProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.is_active !== false
    )
  }, [products])

  /*
  |--------------------------------------------------------------------------
  | TODAY TRANSACTIONS
  |--------------------------------------------------------------------------
  */

  const todayTransactions = useMemo(() => {
    return transactions.filter(
      (transaction) =>
        isToday(
          getTransactionDate(transaction)
        )
    )
  }, [transactions])

  /*
  |--------------------------------------------------------------------------
  | TODAY SALES
  |--------------------------------------------------------------------------
  */

  const todaySales = useMemo(() => {
    return todayTransactions.reduce(
      (total, transaction) => {
        return (
          total +
          getTransactionTotal(transaction)
        )
      },
      0
    )
  }, [todayTransactions])

  /*
  |--------------------------------------------------------------------------
  | LOW STOCK
  |--------------------------------------------------------------------------
  */

  const lowStockProducts = useMemo(() => {
    return activeProducts.filter(
      (product) => {
        const stock =
          Number(product.stock) || 0

        return stock < LOW_STOCK_LIMIT
      }
    )
  }, [activeProducts])

  /*
  |--------------------------------------------------------------------------
  | OUT OF STOCK
  |--------------------------------------------------------------------------
  */

  const outOfStockProducts = useMemo(() => {
    return activeProducts.filter(
      (product) => {
        const stock =
          Number(product.stock) || 0

        return stock <= 0
      }
    )
  }, [activeProducts])

  /*
  |--------------------------------------------------------------------------
  | STOCK STATUS
  |--------------------------------------------------------------------------
  */

  const stockStatus = useMemo(() => {
    const lowStock = lowStockProducts.length
    const outOfStock =
      outOfStockProducts.length

    const safeStock =
      activeProducts.length -
      lowStock

    return {
      safe: Math.max(safeStock, 0),
      low: lowStock,
      empty: outOfStock,
    }
  }, [
    activeProducts,
    lowStockProducts,
    outOfStockProducts,
  ])

  /*
  |--------------------------------------------------------------------------
  | TOTAL STOCK VALUE
  |--------------------------------------------------------------------------
  */

  const totalStockValue = useMemo(() => {
    return activeProducts.reduce(
      (total, product) => {
        return (
          total +
          Number(product.stock || 0) *
            Number(
              product.purchase_price || 0
            )
        )
      },
      0
    )
  }, [activeProducts])

  /*
  |--------------------------------------------------------------------------
  | TOTAL SELLING VALUE
  |--------------------------------------------------------------------------
  */

  const totalSellingValue = useMemo(() => {
    return activeProducts.reduce(
      (total, product) => {
        return (
          total +
          Number(product.stock || 0) *
            Number(
              product.selling_price || 0
            )
        )
      },
      0
    )
  }, [activeProducts])

  /*
  |--------------------------------------------------------------------------
  | BEST PRODUCTS
  |--------------------------------------------------------------------------
  */

  const bestProducts = useMemo(() => {
    const productSales = {}

    transactions.forEach((transaction) => {
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
            brand:
              product.brand ||
              item.brand ||
              '',
            size:
              product.size ||
              item.size ||
              '',
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
    })

    return Object.values(productSales)
      .sort(
        (a, b) =>
          b.quantity -
          a.quantity
      )
      .slice(0, 5)
  }, [transactions])

  /*
  |--------------------------------------------------------------------------
  | RECENT TRANSACTIONS
  |--------------------------------------------------------------------------
  */

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        return (
          new Date(
            getTransactionDate(b) || 0
          ) -
          new Date(
            getTransactionDate(a) || 0
          )
        )
      })
      .slice(0, 5)
  }, [transactions])

  /*
  |--------------------------------------------------------------------------
  | ADMIN STATISTICS
  |--------------------------------------------------------------------------
  */

  const adminStats = [
    {
      title: 'Penjualan Hari Ini',
      value: formatRupiah(todaySales),
      description: `${todayTransactions.length} transaksi hari ini`,
      icon: CircleDollarSign,
      iconStyle:
        'bg-blue-50 text-blue-600',
    },
    {
      title: 'Transaksi Hari Ini',
      value: formatNumber(
        todayTransactions.length
      ),
      description:
        'Transaksi yang tercatat hari ini',
      icon: ClipboardList,
      iconStyle:
        'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Produk Aktif',
      value: formatNumber(
        activeProducts.length
      ),
      description:
        'Produk yang tersedia di toko',
      icon: Package,
      iconStyle:
        'bg-violet-50 text-violet-600',
    },
    {
      title: 'Stok Menipis',
      value: formatNumber(
        lowStockProducts.length
      ),
      description: `Stok kurang dari ${LOW_STOCK_LIMIT}`,
      icon: AlertTriangle,
      iconStyle:
        'bg-orange-50 text-orange-600',
    },
  ]

  /*
  |--------------------------------------------------------------------------
  | CASHIER STATISTICS
  |--------------------------------------------------------------------------
  */

  const cashierStats = [
    {
      title: 'Penjualan Hari Ini',
      value: formatRupiah(todaySales),
      description:
        'Total penjualan hari ini',
      icon: CircleDollarSign,
      iconStyle:
        'bg-blue-50 text-blue-600',
    },
    {
      title: 'Transaksi Hari Ini',
      value: formatNumber(
        todayTransactions.length
      ),
      description:
        'Jumlah transaksi hari ini',
      icon: ShoppingCart,
      iconStyle:
        'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Produk Tersedia',
      value: formatNumber(
        activeProducts.length
      ),
      description:
        'Produk yang dapat dijual',
      icon: Package,
      iconStyle:
        'bg-violet-50 text-violet-600',
    },
  ]

  const stats = isAdmin
    ? adminStats
    : cashierStats

  /*
  |--------------------------------------------------------------------------
  | STATUS TRANSACTION
  |--------------------------------------------------------------------------
  */

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700'

      case 'cancelled':
        return 'bg-red-50 text-red-700'

      case 'pending':
        return 'bg-amber-50 text-amber-700'

      default:
        return 'bg-slate-100 text-slate-600'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Selesai'

      case 'cancelled':
        return 'Dibatalkan'

      case 'pending':
        return 'Pending'

      default:
        return status || '-'
    }
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

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
      {/* ==========================================================
          ERROR
      =========================================================== */}

      {error && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-red-800">
              Gagal memuat dashboard
            </p>

            <p className="mt-1 text-xs text-red-600">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDashboardData}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </button>
        </div>
      )}

      {/* ==========================================================
          WELCOME HEADER
      =========================================================== */}

      <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 shadow-lg shadow-blue-100">
        <div className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-28 right-20 h-64 w-64 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-50 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                BuildPOS aktif
              </div>

              <p className="text-sm font-medium text-blue-100">
                Selamat datang kembali,
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Halo, {user?.name || 'Pengguna'} 👋
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">
                {isAdmin
                  ? 'Pantau penjualan, transaksi, produk, dan kondisi stok toko melalui dashboard BuildPOS.'
                  : 'Kelola transaksi penjualan dan akses informasi produk dengan cepat melalui BuildPOS.'}
              </p>
            </div>

            <div className="relative flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate('/cashier')
                }
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Buat Transaksi
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() =>
                    navigate('/stock')
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 active:scale-[0.98]"
                >
                  <Boxes className="h-4 w-4" />
                  Lihat Stok
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================
          LOADING
      =========================================================== */}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="h-80 animate-pulse rounded-2xl bg-white" />
            <div className="h-80 animate-pulse rounded-2xl bg-white" />
          </div>
        </div>
      ) : (
        <>
          {/* ========================================================
              STATISTICS
          ========================================================= */}

          <section
            className={`grid gap-4 ${
              isAdmin
                ? 'sm:grid-cols-2 xl:grid-cols-4'
                : 'sm:grid-cols-2 xl:grid-cols-3'
            }`}
          >
            {stats.map((stat) => {
              const Icon = stat.icon

              return (
                <div
                  key={stat.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-500">
                        {stat.title}
                      </p>

                      <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900">
                        {stat.value}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {stat.description}
                      </p>
                    </div>

                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconStyle}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              )
            })}
          </section>

          {/* ========================================================
              QUICK ACTION KASIR
          ========================================================= */}

          {isKasir && (
            <section className="mt-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <ShoppingCart className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Siap melayani transaksi?
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Buka halaman kasir untuk
                      membuat transaksi baru.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate('/cashier')
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  Buat Transaksi
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          )}

          {/* ========================================================
              ADMIN STOCK ALERT
          ========================================================= */}

          {isAdmin &&
            lowStockProducts.length > 0 && (
              <section className="mt-6 overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-orange-100 bg-orange-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                      <AlertTriangle className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-bold text-slate-900">
                        Perhatian: Stok Menipis
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {lowStockProducts.length}{' '}
                        produk memiliki stok
                        kurang dari{' '}
                        {LOW_STOCK_LIMIT}.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate('/stock')
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
                  >
                    Periksa Stok
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {lowStockProducts
                    .slice(0, 5)
                    .map((product) => {
                      const stock =
                        Number(
                          product.stock
                        ) || 0

                      const brand =
                        product.brand?.trim() ||
                        ''

                      const size =
                        product.size?.trim() ||
                        ''

                      const unit =
                        product.base_unit
                          ?.symbol ||
                        product.baseUnit
                          ?.symbol ||
                        product.unit
                          ?.symbol ||
                        ''

                      return (
                        <div
                          key={product.id}
                          className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {product.name}
                            </p>

                            {(brand || size) && (
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {brand}

                                {brand &&
                                  size &&
                                  ' • '}

                                {size}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-6 sm:justify-end">
                            <div className="text-right">
                              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                Stok
                              </p>

                              <p className="mt-1 text-sm font-bold text-red-600">
                                {formatStock(
                                  stock
                                )}{' '}
                                {unit}
                              </p>
                            </div>

                            <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
                              {stock <= 0
                                ? 'Habis'
                                : 'Menipis'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                </div>

                {lowStockProducts.length >
                  5 && (
                  <div className="border-t border-slate-100 px-5 py-3 text-center sm:px-6">
                    <button
                      type="button"
                      onClick={() =>
                        navigate('/stock')
                      }
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Lihat{' '}
                      {lowStockProducts.length -
                        5}{' '}
                      produk lainnya
                    </button>
                  </div>
                )}
              </section>
            )}

          {/* ========================================================
              ADMIN OVERVIEW
          ========================================================= */}

          {isAdmin && (
            <section className="mt-6 grid gap-6 xl:grid-cols-2">
              {/* INVENTORY VALUE */}

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Nilai Persediaan
                    </p>

                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                      {formatRupiah(
                        totalStockValue
                      )}
                    </h2>

                    <p className="mt-2 text-xs text-slate-400">
                      Berdasarkan harga beli
                      seluruh produk aktif
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">
                      Harga Jual Stok
                    </p>

                    <p className="mt-1 truncate text-sm font-bold text-slate-800">
                      {formatRupiah(
                        totalSellingValue
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">
                      Produk Aktif
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {formatNumber(
                        activeProducts.length
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* STOCK CONDITION */}

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Kondisi Stok
                    </p>

                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                      Ringkasan Persediaan
                    </h2>

                    <p className="mt-2 text-xs text-slate-400">
                      Kondisi stok produk aktif
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <Boxes className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">
                        Stok Aman
                      </span>

                      <span className="font-bold text-emerald-600">
                        {stockStatus.safe}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{
                          width:
                            activeProducts.length > 0
                              ? `${
                                  (stockStatus.safe /
                                    activeProducts.length) *
                                  100
                                }%`
                              : '0%',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">
                        Stok Menipis
                      </span>

                      <span className="font-bold text-orange-600">
                        {stockStatus.low}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-orange-500 transition-all"
                        style={{
                          width:
                            activeProducts.length > 0
                              ? `${
                                  (stockStatus.low /
                                    activeProducts.length) *
                                  100
                                }%`
                              : '0%',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">
                        Stok Habis
                      </span>

                      <span className="font-bold text-red-600">
                        {stockStatus.empty}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-red-500 transition-all"
                        style={{
                          width:
                            activeProducts.length > 0
                              ? `${
                                  (stockStatus.empty /
                                    activeProducts.length) *
                                  100
                                }%`
                              : '0%',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ========================================================
              BEST PRODUCT + LOW STOCK
          ========================================================= */}

          {isAdmin && (
            <section className="mt-6 grid gap-6 xl:grid-cols-2">
              {/* BEST PRODUCT */}

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                  <div>
                    <h2 className="font-bold text-slate-900">
                      Produk Terlaris
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      Berdasarkan jumlah produk
                      terjual
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>

                <div className="p-6">
                  {bestProducts.length ===
                  0 ? (
                    <div className="rounded-xl bg-slate-50 px-5 py-10 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                        <BarChart3 className="h-5 w-5" />
                      </div>

                      <p className="mt-4 text-sm font-semibold text-slate-600">
                        Belum ada data
                        penjualan
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Data produk terlaris
                        akan muncul setelah
                        ada transaksi.
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
                            className="flex items-center gap-4"
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                index === 0
                                  ? 'bg-amber-100 text-amber-700'
                                  : index === 1
                                    ? 'bg-slate-200 text-slate-700'
                                    : index === 2
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-slate-50 text-slate-500'
                              }`}
                            >
                              {index + 1}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {product.name}
                              </p>

                              {(product.brand ||
                                product.size) && (
                                <p className="mt-0.5 truncate text-xs text-slate-400">
                                  {product.brand ||
                                    ''}

                                  {product.brand &&
                                    product.size &&
                                    ' • '}

                                  {product.size ||
                                    ''}
                                </p>
                              )}

                              <p className="mt-1 text-xs text-slate-500">
                                {formatStock(
                                  product.quantity
                                )}{' '}
                                terjual
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-700">
                                {formatRupiah(
                                  product.total
                                )}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* LOW STOCK */}

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                  <div>
                    <h2 className="font-bold text-slate-900">
                      Stok Menipis
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      Produk dengan stok di
                      bawah{' '}
                      {LOW_STOCK_LIMIT}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>

                <div className="p-6">
                  {lowStockProducts.length ===
                  0 ? (
                    <div className="rounded-xl bg-emerald-50 px-5 py-10 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                        <Package className="h-5 w-5" />
                      </div>

                      <p className="mt-4 text-sm font-semibold text-emerald-700">
                        Semua stok aman
                      </p>

                      <p className="mt-1 text-xs text-emerald-600">
                        Tidak ada produk
                        dengan stok di
                        bawah{' '}
                        {LOW_STOCK_LIMIT}.
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

                            const unit =
                              product
                                .base_unit
                                ?.symbol ||
                              product
                                .baseUnit
                                ?.symbol ||
                              product.unit
                                ?.symbol ||
                              ''

                            return (
                              <button
                                key={
                                  product.id
                                }
                                type="button"
                                onClick={() =>
                                  navigate(
                                    '/stock'
                                  )
                                }
                                className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-orange-200 hover:bg-orange-50/50"
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                                  <Package className="h-4 w-4" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-slate-800">
                                    {
                                      product.name
                                    }
                                  </p>

                                  <p className="mt-0.5 text-xs text-slate-400">
                                    Stok kurang
                                    dari{' '}
                                    {
                                      LOW_STOCK_LIMIT
                                    }
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="text-sm font-bold text-red-600">
                                    {formatStock(
                                      stock
                                    )}
                                  </p>

                                  <p className="text-[11px] text-slate-400">
                                    {unit}
                                  </p>
                                </div>
                              </button>
                            )
                          }
                        )}
                    </div>
                  )}
                </div>

                {lowStockProducts.length >
                  5 && (
                  <div className="border-t border-slate-100 px-6 py-3 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        navigate('/stock')
                      }
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Lihat semua stok menipis
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ========================================================
              RECENT TRANSACTIONS
          ========================================================= */}

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ClipboardList className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Transaksi Terbaru
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Aktivitas transaksi terbaru
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate('/transactions')
                }
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Lihat Semua
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Transaksi
                    </th>

                    <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Pelanggan
                    </th>

                    <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Total
                    </th>

                    <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Waktu
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentTransactions.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-14 text-center"
                      >
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                          <ClipboardList className="h-5 w-5" />
                        </div>

                        <p className="mt-4 text-sm font-semibold text-slate-600">
                          Belum ada transaksi
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Transaksi terbaru
                          akan muncul di
                          sini.
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
                          transaction.customer
                            ?.name ||
                          transaction.customer_name ||
                          'Pelanggan Umum'

                        const total =
                          getTransactionTotal(
                            transaction
                          )

                        const status =
                          transaction.status ||
                          'completed'

                        return (
                          <tr
                            key={
                              transaction.id
                            }
                            className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50"
                          >
                            <td className="px-6 py-4">
                              <p className="text-sm font-semibold text-slate-800">
                                {
                                  transactionNumber
                                }
                              </p>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                  <Users className="h-4 w-4" />
                                </div>

                                <span className="text-sm text-slate-600">
                                  {
                                    customerName
                                  }
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-slate-800">
                                {formatRupiah(
                                  total
                                )}
                              </p>
                            </td>

                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                                  status
                                )}`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                {getStatusLabel(
                                  status
                                )}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Clock3 className="h-4 w-4 text-slate-400" />

                                {formatDate(
                                  getTransactionDate(
                                    transaction
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      }
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ========================================================
              BOTTOM QUICK ACTION
          ========================================================= */}

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              onClick={() =>
                navigate('/cashier')
              }
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                <ShoppingCart className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">
                  Buat Transaksi
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Buka halaman kasir
                </p>
              </div>

              <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
            </button>

            <button
              type="button"
              onClick={() =>
                navigate('/products')
              }
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition group-hover:bg-violet-600 group-hover:text-white">
                <Package className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">
                  Data Produk
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Kelola dan lihat produk
                </p>
              </div>

              <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-600" />
            </button>

            <button
              type="button"
              onClick={() =>
                navigate('/transactions')
              }
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                <ClipboardList className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">
                  Riwayat Transaksi
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Lihat transaksi terbaru
                </p>
              </div>

              <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
            </button>
          </section>
        </>
      )}
    </DashboardLayout>
  )
}

export default Dashboard