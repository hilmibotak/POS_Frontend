import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  RefreshCw,
  Search,
  ShoppingCart,
  X,
} from 'lucide-react'

import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getTransactionNumber(transaction) {
  return (
    transaction?.transaction_number ||
    transaction?.invoice_number ||
    transaction?.number ||
    `TRX-${transaction?.id || '-'}`
  )
}

function getCustomerName(transaction) {
  return (
    transaction?.customer?.name ||
    transaction?.customer_name ||
    'Pelanggan Umum'
  )
}

function getCashierName(transaction) {
  return (
    transaction?.user?.name ||
    transaction?.cashier?.name ||
    transaction?.cashier_name ||
    '-'
  )
}

function getPaymentMethodLabel(method) {
  const labels = {
    cash: 'Tunai',
    qris: 'QRIS',
    transfer: 'Transfer',
    debit: 'Debit',
    credit: 'Kredit',
    bon: 'Bon',
  }

  return labels[method] || method || '-'
}

function getPaymentMethodClass(method) {
  const classes = {
    cash: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    qris: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    transfer: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    debit: 'bg-violet-50 text-violet-700 ring-violet-600/20',
    credit: 'bg-purple-50 text-purple-700 ring-purple-600/20',
    bon: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  }

  return (
    classes[method] ||
    'bg-gray-50 text-gray-700 ring-gray-600/20'
  )
}

function getPaymentStatusLabel(status) {
  const labels = {
    completed: 'Lunas',
    pending: 'Menunggu',
  }

  return labels[status] || status || '-'
}

function getPaymentStatusClass(status) {
  const classes = {
    completed:
      'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    pending:
      'bg-amber-50 text-amber-700 ring-amber-600/20',
  }

  return (
    classes[status] ||
    'bg-gray-50 text-gray-700 ring-gray-600/20'
  )
}

function getTransactionStatusLabel(status) {
  const labels = {
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    pending: 'Menunggu',
  }

  return labels[status] || status || '-'
}

function getTransactionStatusClass(status) {
  const classes = {
    completed:
      'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    cancelled:
      'bg-red-50 text-red-700 ring-red-600/20',
    pending:
      'bg-amber-50 text-amber-700 ring-amber-600/20',
  }

  return (
    classes[status] ||
    'bg-gray-50 text-gray-700 ring-gray-600/20'
  )
}

export default function Transactions() {
  const navigate = useNavigate()

  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  })

  const [search, setSearch] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [transactionStatus, setTransactionStatus] =
    useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [page, setPage] = useState(1)

  /*
  |--------------------------------------------------------------------------
  | Ambil Data Transaksi
  |--------------------------------------------------------------------------
  */

  const fetchTransactions = async (pageNumber = page) => {
    try {
      setLoading(true)
      setError('')

      const params = {
        page: pageNumber,
      }

      if (search.trim()) {
        params.search = search.trim()
      }

      if (paymentStatus) {
        params.payment_status = paymentStatus
      }

      if (paymentMethod) {
        params.payment_method = paymentMethod
      }

      if (transactionStatus) {
        params.status = transactionStatus
      }

      const response = await api.get('/transactions', {
        params,
      })

      console.log(
        'TRANSACTIONS RESPONSE:',
        response.data
      )

      const responseData = response.data?.data

      let transactionData = []
      let paginationData = {
        current_page: pageNumber,
        last_page: 1,
        per_page: 10,
        total: 0,
      }

      /*
       * Laravel pagination:
       *
       * response.data
       *   └── data
       *       ├── current_page
       *       ├── data
       *       ├── last_page
       *       ├── per_page
       *       └── total
       */

      if (Array.isArray(responseData)) {
        transactionData = responseData
      } else if (
        Array.isArray(responseData?.data)
      ) {
        transactionData = responseData.data

        paginationData = {
          current_page:
            responseData.current_page || pageNumber,
          last_page:
            responseData.last_page || 1,
          per_page:
            responseData.per_page || 10,
          total:
            responseData.total ||
            transactionData.length,
        }
      } else if (
        Array.isArray(response.data)
      ) {
        transactionData = response.data
      }

      setTransactions(transactionData)
      setPagination(paginationData)
    } catch (err) {
      console.error(
        'TRANSACTIONS ERROR:',
        err.response?.data || err
      )

      setError(
        err.response?.data?.message ||
          'Gagal mengambil riwayat transaksi.'
      )

      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchTransactions(page)
  }, [
    page,
    paymentStatus,
    paymentMethod,
    transactionStatus,
  ])

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const handleSearchSubmit = (event) => {
    event.preventDefault()

    if (page !== 1) {
      setPage(1)
      return
    }

    fetchTransactions(1)
  }

  /*
  |--------------------------------------------------------------------------
  | Reset Filter
  |--------------------------------------------------------------------------
  */

  const handleResetFilters = () => {
    setSearch('')
    setPaymentStatus('')
    setPaymentMethod('')
    setTransactionStatus('')
    setPage(1)
  }

  /*
  |--------------------------------------------------------------------------
  | Statistik
  |--------------------------------------------------------------------------
  */

  const statistics = useMemo(() => {
    const totalTransactions =
      pagination.total || transactions.length

    const completedTransactions =
      transactions.filter(
        (transaction) =>
          transaction.payment_status === 'completed'
      ).length

    const pendingTransactions =
      transactions.filter(
        (transaction) =>
          transaction.payment_status === 'pending'
      ).length

    const totalSales = transactions.reduce(
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

    return {
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      totalSales,
    }
  }, [transactions, pagination.total])

  /*
  |--------------------------------------------------------------------------
  | Filter Aktif
  |--------------------------------------------------------------------------
  */

  const hasActiveFilters =
    search.trim() ||
    paymentStatus ||
    paymentMethod ||
    transactionStatus

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Riwayat Transaksi
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Lihat dan kelola seluruh riwayat transaksi
              penjualan.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              fetchTransactions(page)
            }
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                loading ? 'animate-spin' : ''
              }
            />

            Refresh
          </button>
        </div>

        {/* =====================================================
            STATISTICS
        ====================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Total Transaksi */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Transaksi
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {statistics.totalTransactions}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ShoppingCart size={21} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Seluruh transaksi tersimpan
            </p>
          </div>

          {/* Selesai */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pembayaran Selesai
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {statistics.completedTransactions}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <span className="text-lg font-bold">
                  ✓
                </span>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Pembayaran sudah dikonfirmasi
            </p>
          </div>

          {/* Pending */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Menunggu Pembayaran
                </p>

                <p className="mt-2 text-2xl font-bold text-amber-600">
                  {statistics.pendingTransactions}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <span className="text-lg font-bold">
                  !
                </span>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              QRIS, transfer, atau bon
            </p>
          </div>

          {/* Penjualan */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Penjualan
                </p>

                <p className="mt-2 text-xl font-bold text-slate-900">
                  {formatRupiah(
                    statistics.totalSales
                  )}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <span className="text-sm font-bold">
                  Rp
                </span>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Dari data halaman saat ini
            </p>
          </div>
        </div>

        {/* =====================================================
            SEARCH & FILTER
        ====================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-col gap-3 md:flex-row"
            >
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Cari nomor transaksi atau pelanggan..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Search size={17} />
                Cari
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowFilters((prev) => !prev)
                }
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition ${
                  showFilters ||
                  paymentStatus ||
                  paymentMethod ||
                  transactionStatus
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Filter size={17} />

                Filter
              </button>
            </form>

            {showFilters && (
              <div className="grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-3">
                {/* Payment Status */}

                <div>
                  <label
                    htmlFor="payment-status"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Status Pembayaran
                  </label>

                  <select
                    id="payment-status"
                    value={paymentStatus}
                    onChange={(event) => {
                      setPaymentStatus(
                        event.target.value
                      )
                      setPage(1)
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Semua Status
                    </option>

                    <option value="completed">
                      Lunas
                    </option>

                    <option value="pending">
                      Menunggu
                    </option>
                  </select>
                </div>

                {/* Payment Method */}

                <div>
                  <label
                    htmlFor="payment-method"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Metode Pembayaran
                  </label>

                  <select
                    id="payment-method"
                    value={paymentMethod}
                    onChange={(event) => {
                      setPaymentMethod(
                        event.target.value
                      )
                      setPage(1)
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Semua Metode
                    </option>

                    <option value="cash">
                      Tunai
                    </option>

                    <option value="qris">
                      QRIS
                    </option>

                    <option value="transfer">
                      Transfer
                    </option>

                    <option value="debit">
                      Debit
                    </option>

                    <option value="credit">
                      Kredit
                    </option>

                    <option value="bon">
                      Bon
                    </option>
                  </select>
                </div>

                {/* Transaction Status */}

                <div>
                  <label
                    htmlFor="transaction-status"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Status Transaksi
                  </label>

                  <select
                    id="transaction-status"
                    value={transactionStatus}
                    onChange={(event) => {
                      setTransactionStatus(
                        event.target.value
                      )
                      setPage(1)
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Semua Status
                    </option>

                    <option value="completed">
                      Selesai
                    </option>

                    <option value="cancelled">
                      Dibatalkan
                    </option>
                  </select>
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">
                  Filter sedang diterapkan pada
                  riwayat transaksi.
                </p>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
                >
                  <X size={16} />

                  Reset Filter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 md:flex-row md:items-center md:justify-between">
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                fetchTransactions(page)
              }
              className="font-semibold underline underline-offset-2"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* =====================================================
            TABLE
        ====================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  Daftar Transaksi
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Menampilkan{' '}
                  {transactions.length} transaksi
                </p>
              </div>

              {pagination.total > 0 && (
                <p className="text-sm text-slate-400">
                  Total {pagination.total} transaksi
                </p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Memuat riwayat transaksi...
              </p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <ShoppingCart size={25} />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-800">
                Belum ada transaksi
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Riwayat transaksi akan muncul di
                sini setelah transaksi dibuat.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      #
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Transaksi
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Tanggal
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Kasir
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Pelanggan
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Pembayaran
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Total
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {transactions.map(
                    (transaction, index) => {
                      const transactionNumber =
                        getTransactionNumber(
                          transaction
                        )

                      const customerName =
                        getCustomerName(
                          transaction
                        )

                      const cashierName =
                        getCashierName(
                          transaction
                        )

                      const paymentMethod =
                        transaction.payment_method

                      const paymentStatus =
                        transaction.payment_status ||
                        'completed'

                      const transactionStatusValue =
                        transaction.status ||
                        'completed'

                      const total = Number(
                        transaction.total ||
                          transaction.grand_total ||
                          transaction.total_amount ||
                          0
                      )

                      const rowNumber =
                        (pagination.current_page - 1) *
                          pagination.per_page +
                        index +
                        1

                      return (
                        <tr
                          key={
                            transaction.id ||
                            transactionNumber
                          }
                          className="transition hover:bg-slate-50"
                        >
                          {/* No */}

                          <td className="px-6 py-4 text-sm text-slate-500">
                            {rowNumber}
                          </td>

                          {/* Transaction */}

                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/transactions/${transaction.id}`
                                )
                              }
                              className="text-left"
                            >
                              <p className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                                {transactionNumber}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                ID #{transaction.id}
                              </p>
                            </button>
                          </td>

                          {/* Date */}

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {formatDate(
                              transaction.transaction_date ||
                                transaction.created_at
                            )}
                          </td>

                          {/* Cashier */}

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {cashierName}
                          </td>

                          {/* Customer */}

                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-slate-700">
                              {customerName}
                            </p>
                          </td>

                          {/* Payment */}

                          <td className="px-6 py-4">
                            <div className="flex flex-col items-start gap-2">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getPaymentMethodClass(
                                  paymentMethod
                                )}`}
                              >
                                {getPaymentMethodLabel(
                                  paymentMethod
                                )}
                              </span>

                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getPaymentStatusClass(
                                  paymentStatus
                                )}`}
                              >
                                {getPaymentStatusLabel(
                                  paymentStatus
                                )}
                              </span>
                            </div>
                          </td>

                          {/* Status */}

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getTransactionStatusClass(
                                transactionStatusValue
                              )}`}
                            >
                              {getTransactionStatusLabel(
                                transactionStatusValue
                              )}
                            </span>
                          </td>

                          {/* Total */}

                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-bold text-slate-900">
                              {formatRupiah(total)}
                            </p>
                          </td>

                          {/* Action */}

                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/transactions/${transaction.id}`
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Eye size={15} />

                              Detail
                            </button>
                          </td>
                        </tr>
                      )
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ===================================================
              PAGINATION
          ==================================================== */}

          {!loading &&
            transactions.length > 0 && (
              <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Halaman{' '}
                  <span className="font-semibold text-slate-700">
                    {pagination.current_page}
                  </span>{' '}
                  dari{' '}
                  <span className="font-semibold text-slate-700">
                    {pagination.last_page}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      pagination.current_page <=
                        1 || loading
                    }
                    onClick={() =>
                      setPage(
                        pagination.current_page - 1
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />

                    Sebelumnya
                  </button>

                  <button
                    type="button"
                    disabled={
                      pagination.current_page >=
                        pagination.last_page ||
                      loading
                    }
                    onClick={() =>
                      setPage(
                        pagination.current_page + 1
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Berikutnya

                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>
    </DashboardLayout>
  )
}