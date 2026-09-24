import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  History,
  RefreshCw,
  Search,
  WalletCards,
  X,
} from 'lucide-react'

import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const formatRupiah = (value) => {
  const number = Number(value || 0)

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number)
}

const formatDate = (value) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getPaymentMethodLabel = (method) => {
  const labels = {
    cash: 'Cash',
    qris: 'QRIS',
    transfer: 'Transfer',
    debit: 'Debit',
    credit: 'Credit',
    bon: 'Bon / Kasbon',
    partial: 'Partial',
  }

  return labels[method] || method || '-'
}

const getPaymentStatusLabel = (status) => {
  const labels = {
    completed: 'Lunas',
    pending: 'Menunggu Konfirmasi',
    partial: 'Sebagian Dibayar',
    unpaid: 'Belum Dibayar',
    cancelled: 'Dibatalkan',
  }

  return labels[status] || status || '-'
}

const getPaymentStatusClass = (status) => {
  const classes = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    partial: 'bg-orange-100 text-orange-700',
    unpaid: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
  }

  return (
    classes[status] ||
    'bg-gray-100 text-gray-700'
  )
}

const getPaymentStatusIcon = (status) => {
  if (status === 'completed') {
    return <CheckCircle2 size={15} />
  }

  if (status === 'partial') {
    return <WalletCards size={15} />
  }

  if (status === 'unpaid') {
    return <AlertCircle size={15} />
  }

  if (status === 'pending') {
    return <Clock3 size={15} />
  }

  return null
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

function PaymentHistory() {
  const navigate = useNavigate()

  /*
  |--------------------------------------------------------------------------
  | Data
  |--------------------------------------------------------------------------
  */

  const [payments, setPayments] = useState([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [error, setError] = useState('')

  /*
  |--------------------------------------------------------------------------
  | Filters
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState('all')

  const [methodFilter, setMethodFilter] =
    useState('all')

  const [page, setPage] = useState(1)
  const [perPage] = useState(10)

  const [pagination, setPagination] =
    useState({
      current_page: 1,
      last_page: 1,
      total: 0,
      per_page: 10,
    })

  /*
  |--------------------------------------------------------------------------
  | Payment Modal
  |--------------------------------------------------------------------------
  */

  const [paymentModalOpen, setPaymentModalOpen] =
    useState(false)

  const [selectedPayment, setSelectedPayment] =
    useState(null)

  const [paymentMethod, setPaymentMethod] =
    useState('cash')

  const [paymentAmount, setPaymentAmount] =
    useState('')

  const [paymentNote, setPaymentNote] =
    useState('')

  const [paymentLoading, setPaymentLoading] =
    useState(false)

  const [paymentError, setPaymentError] =
    useState('')

  /*
  |--------------------------------------------------------------------------
  | Fetch payment histories
  |--------------------------------------------------------------------------
  */

  const fetchPaymentHistories = async (
    showLoader = true
  ) => {
    try {
      if (showLoader) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      setError('')

      const params = {
        page,
        per_page: perPage,
      }

      if (search.trim()) {
        params.search = search.trim()
      }

      if (statusFilter !== 'all') {
        params.payment_status =
          statusFilter
      }

      if (methodFilter !== 'all') {
        params.payment_method =
          methodFilter
      }

      const response = await api.get(
        '/payment-histories',
        {
          params,
        }
      )

      const responseData =
        response.data?.data ||
        response.data

      /*
      |----------------------------------------------------------------
      | Laravel pagination
      |----------------------------------------------------------------
      */

      if (
        responseData &&
        Array.isArray(responseData.data)
      ) {
        setPayments(
          responseData.data
        )

        setPagination({
          current_page:
            responseData.current_page ||
            1,

          last_page:
            responseData.last_page ||
            1,

          total:
            responseData.total ??
            responseData.data.length,

          per_page:
            responseData.per_page ||
            perPage,
        })

        return
      }

      /*
      |----------------------------------------------------------------
      | Non pagination response
      |----------------------------------------------------------------
      */

      if (
        Array.isArray(responseData)
      ) {
        setPayments(responseData)

        setPagination({
          current_page: 1,
          last_page: 1,
          total: responseData.length,
          per_page:
            responseData.length ||
            perPage,
        })

        return
      }

      setPayments([])

      setPagination({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: perPage,
      })
    } catch (err) {
      console.error(
        'Fetch payment histories error:',
        err
      )

      const message =
        err.response?.data?.message ||
        err.message ||
        'Gagal mengambil riwayat tagihan.'

      setError(message)
      setPayments([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Fetch ketika pagination / filter berubah
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchPaymentHistories()
  }, [
    page,
    statusFilter,
    methodFilter,
  ])

  /*
  |--------------------------------------------------------------------------
  | Search debounce
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)

      /*
      |----------------------------------------------------------------
      | Search hanya fetch jika halaman sekarang sudah 1.
      | Jika bukan 1, perubahan page akan menjalankan fetch melalui
      | effect pagination.
      |----------------------------------------------------------------
      */

      if (page === 1) {
        fetchPaymentHistories(false)
      }
    }, 400)

    return () => {
      clearTimeout(timer)
    }
  }, [search])

  /*
  |--------------------------------------------------------------------------
  | Normalize transaction data
  |--------------------------------------------------------------------------
  */

  const normalizedPayments = useMemo(() => {
    return payments.map(
      (transaction) => {
        const total =
          Number(
            transaction.total || 0
          )

        const paid =
          Number(
            transaction.paid || 0
          )

        const remaining =
          Number(
            transaction.remaining_amount ??
              Math.max(
                total - paid,
                0
              )
          )

        const paymentHistories =
          Array.isArray(
            transaction.payment_histories
          )
            ? transaction.payment_histories
            : []

        /*
        |--------------------------------------------------------------
        | Ambil pembayaran terakhir
        |--------------------------------------------------------------
        */

        const sortedPaymentHistories = [
          ...paymentHistories,
        ].sort((a, b) => {
          const dateA = new Date(
            a.payment_date ||
              a.created_at ||
              0
          ).getTime()

          const dateB = new Date(
            b.payment_date ||
              b.created_at ||
              0
          ).getTime()

          return dateB - dateA
        })

        const lastPayment =
          sortedPaymentHistories[0] ||
          null

        return {
          ...transaction,

          transactionNumber:
            transaction.transaction_number ||
            '-',

          customer:
            transaction.customer ||
            null,

          user:
            transaction.user ||
            null,

          total,

          paid,

          remaining,

          paymentStatus:
            transaction.payment_status ||
            (
              remaining <= 0
                ? 'completed'
                : paid > 0
                  ? 'partial'
                  : 'unpaid'
            ),

          originalPaymentMethod:
            transaction.payment_method ||
            '-',

          paymentHistories,

          lastPayment,
        }
      }
    )
  }, [payments])

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  const statistics = useMemo(() => {
    let unpaid = 0
    let partial = 0
    let completed = 0
    let totalOutstanding = 0

    normalizedPayments.forEach(
      (payment) => {
        if (
          payment.paymentStatus ===
          'unpaid'
        ) {
          unpaid++
        }

        if (
          payment.paymentStatus ===
          'partial'
        ) {
          partial++
        }

        if (
          payment.paymentStatus ===
          'completed'
        ) {
          completed++
        }

        totalOutstanding +=
          Number(
            payment.remaining || 0
          )
      }
    )

    return {
      unpaid,
      partial,
      completed,
      totalOutstanding,
    }
  }, [normalizedPayments])

  /*
  |--------------------------------------------------------------------------
  | Reset filters
  |--------------------------------------------------------------------------
  */

  const handleResetFilter = () => {
    setSearch('')
    setStatusFilter('all')
    setMethodFilter('all')
    setPage(1)
  }

  /*
  |--------------------------------------------------------------------------
  | Page change
  |--------------------------------------------------------------------------
  */

  const goToPage = (newPage) => {
    if (
      newPage < 1 ||
      newPage > pagination.last_page
    ) {
      return
    }

    setPage(newPage)
  }

  /*
  |--------------------------------------------------------------------------
  | Open payment modal
  |--------------------------------------------------------------------------
  */

  const handleOpenPaymentModal = (
    payment
  ) => {
    if (
      payment.remaining <= 0 ||
      payment.paymentStatus ===
        'completed'
    ) {
      return
    }

    setSelectedPayment(payment)

    setPaymentMethod('cash')

    setPaymentAmount(
      String(payment.remaining)
    )

    setPaymentNote('')

    setPaymentError('')

    setPaymentModalOpen(true)
  }

  /*
  |--------------------------------------------------------------------------
  | Close payment modal
  |--------------------------------------------------------------------------
  */

  const handleClosePaymentModal = () => {
    if (paymentLoading) {
      return
    }

    setPaymentModalOpen(false)
    setSelectedPayment(null)

    setPaymentMethod('cash')
    setPaymentAmount('')
    setPaymentNote('')
    setPaymentError('')
  }

  /*
  |--------------------------------------------------------------------------
  | Submit payment
  |--------------------------------------------------------------------------
  */

  const handleSubmitPayment = async (
    event
  ) => {
    event.preventDefault()

    if (!selectedPayment) {
      return
    }

    const amount =
      Number(paymentAmount)

    const remaining =
      Number(
        selectedPayment.remaining || 0
      )

    /*
    |----------------------------------------------------------------
    | Validation
    |----------------------------------------------------------------
    */

    if (
      !paymentAmount ||
      Number.isNaN(amount) ||
      amount <= 0
    ) {
      setPaymentError(
        'Nominal pembayaran harus lebih dari Rp0.'
      )

      return
    }

    if (amount > remaining) {
      setPaymentError(
        'Nominal pembayaran tidak boleh melebihi sisa tagihan.'
      )

      return
    }

    try {
      setPaymentLoading(true)
      setPaymentError('')

      await api.post(
        `/transactions/${selectedPayment.id}/payments`,
        {
          amount,
          payment_method:
            paymentMethod,
          note:
            paymentNote.trim() ||
            null,
        }
      )

      handleClosePaymentModal()

      /*
      |----------------------------------------------------------------
      | Refresh data setelah pembayaran
      |----------------------------------------------------------------
      */

      await fetchPaymentHistories(
        false
      )
    } catch (err) {
      console.error(
        'Payment error:',
        err
      )

      const message =
        err.response?.data?.message ||
        err.message ||
        'Gagal mencatat pembayaran.'

      setPaymentError(message)
    } finally {
      setPaymentLoading(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Open detail
  |--------------------------------------------------------------------------
  */

  const handleDetail = (
    transactionId
  ) => {
    navigate(
      `/payment-history/${transactionId}`
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <DashboardLayout
        title="Riwayat Tagihan"
        description="Kelola kasbon, credit, dan pembayaran sebagian"
        activeMenu="payment-history"
      >
        <div className="flex min-h-[500px] items-center justify-center">

          <div className="flex items-center gap-3 text-gray-500">

            <RefreshCw
              size={22}
              className="animate-spin"
            />

            <span>
              Memuat riwayat tagihan...
            </span>

          </div>

        </div>
      </DashboardLayout>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <DashboardLayout
      title="Riwayat Tagihan"
      description="Kelola kasbon, credit, dan pembayaran sebagian"
      activeMenu="payment-history"
    >
      <div className="space-y-6 p-6">

        {/* ==========================================================
            HEADER
        ========================================================== */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <History size={23} />
              </div>

              <div>

                <h1 className="text-2xl font-bold text-gray-900">
                  Riwayat Tagihan
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Kelola transaksi kasbon,
                  credit, dan pembayaran
                  sebagian.
                </p>

              </div>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              fetchPaymentHistories(false)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >

            <RefreshCw
              size={17}
              className={
                refreshing
                  ? 'animate-spin'
                  : ''
              }
            />

            Refresh

          </button>

        </div>

        {/* ==========================================================
            ERROR
        ========================================================== */}

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div>

              <p className="font-semibold">
                Gagal mengambil data
              </p>

              <p className="mt-1">
                {error}
              </p>

            </div>

          </div>
        )}

        {/* ==========================================================
            STATISTICS
        ========================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Unpaid */}

          <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  Belum Dibayar
                </p>

                <p className="mt-2 text-2xl font-bold text-red-600">
                  {statistics.unpaid}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <AlertCircle size={21} />
              </div>

            </div>

          </div>

          {/* Partial */}

          <div className="rounded-xl border border-orange-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  Sebagian Dibayar
                </p>

                <p className="mt-2 text-2xl font-bold text-orange-600">
                  {statistics.partial}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <WalletCards size={21} />
              </div>

            </div>

          </div>

          {/* Completed */}

          <div className="rounded-xl border border-green-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  Lunas
                </p>

                <p className="mt-2 text-2xl font-bold text-green-600">
                  {statistics.completed}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <CheckCircle2 size={21} />
              </div>

            </div>

          </div>

          {/* Outstanding */}

          <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  Total Sisa Tagihan
                </p>

                <p className="mt-2 text-xl font-bold text-blue-600">
                  {formatRupiah(
                    statistics.totalOutstanding
                  )}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <WalletCards size={21} />
              </div>

            </div>

          </div>

        </div>

        {/* ==========================================================
            FILTER
        ========================================================== */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">

            {/* Search */}

            <div className="lg:col-span-2">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Cari
              </label>

              <div className="relative">

                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(
                      event.target.value
                    )
                  }}
                  placeholder="Nomor transaksi..."
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch('')
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={17} />
                  </button>
                )}

              </div>

            </div>

            {/* Status */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status Pembayaran
              </label>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value
                  )

                  setPage(1)
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >

                <option value="all">
                  Semua Status
                </option>

                <option value="unpaid">
                  Belum Dibayar
                </option>

                <option value="partial">
                  Sebagian Dibayar
                </option>

                <option value="completed">
                  Lunas
                </option>

              </select>

            </div>

            {/* Method */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Jenis Transaksi
              </label>

              <select
                value={methodFilter}
                onChange={(event) => {
                  setMethodFilter(
                    event.target.value
                  )

                  setPage(1)
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >

                <option value="all">
                  Semua
                </option>

                <option value="credit">
                  Credit
                </option>

                <option value="bon">
                  Bon / Kasbon
                </option>

                <option value="partial">
                  Partial
                </option>

              </select>

            </div>

          </div>

          {(search ||
            statusFilter !== 'all' ||
            methodFilter !== 'all') && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">

              <p className="text-sm text-gray-500">

                Menampilkan{' '}

                <span className="font-medium text-gray-900">
                  {pagination.total}
                </span>{' '}

                data

              </p>

              <button
                type="button"
                onClick={
                  handleResetFilter
                }
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Reset Filter
              </button>

            </div>
          )}

        </div>

        {/* ==========================================================
            TABLE
        ========================================================== */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="min-w-[1250px] w-full">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    #
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Transaksi
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Pelanggan
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Jenis
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Total
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Dibayar
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Sisa
                  </th>

                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Pembayaran Terakhir
                  </th>

                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Aksi
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {normalizedPayments.length ===
                0 ? (
                  <tr>

                    <td
                      colSpan="10"
                      className="px-5 py-14 text-center"
                    >

                      <History
                        size={40}
                        className="mx-auto text-gray-300"
                      />

                      <p className="mt-3 text-sm font-medium text-gray-600">
                        Tidak ada riwayat
                        tagihan
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        Belum ada data yang
                        sesuai dengan filter.
                      </p>

                    </td>

                  </tr>
                ) : (
                  normalizedPayments.map(
                    (
                      payment,
                      index
                    ) => (
                      <tr
                        key={
                          payment.id ||
                          index
                        }
                        className="hover:bg-gray-50"
                      >

                        {/* Number */}

                        <td className="px-5 py-4 text-sm text-gray-500">

                          {(
                            pagination.current_page -
                            1
                          ) *
                            pagination.per_page +
                            index +
                            1}

                        </td>

                        {/* Transaction */}

                        <td className="px-5 py-4">

                          <button
                            type="button"
                            onClick={() =>
                              handleDetail(
                                payment.id
                              )
                            }
                            className="text-left"
                          >

                            <p className="font-semibold text-blue-600 hover:text-blue-700">
                              {
                                payment.transactionNumber
                              }
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {formatDate(
                                payment.transaction_date
                              )}
                            </p>

                          </button>

                        </td>

                        {/* Customer */}

                        <td className="px-5 py-4">

                          <p className="text-sm font-medium text-gray-900">
                            {payment.customer
                              ?.name ||
                              'Umum'}
                          </p>

                          {payment.customer
                            ?.phone && (
                            <p className="mt-1 text-xs text-gray-500">
                              {
                                payment.customer
                                  .phone
                              }
                            </p>
                          )}

                        </td>

                        {/* Method */}

                        <td className="px-5 py-4">

                          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                            {
                              getPaymentMethodLabel(
                                payment.originalPaymentMethod
                              )
                            }
                          </span>

                        </td>

                        {/* Total */}

                        <td className="px-5 py-4 text-right text-sm font-medium text-gray-900">
                          {formatRupiah(
                            payment.total
                          )}
                        </td>

                        {/* Paid */}

                        <td className="px-5 py-4 text-right text-sm font-medium text-green-600">
                          {formatRupiah(
                            payment.paid
                          )}
                        </td>

                        {/* Remaining */}

                        <td className="px-5 py-4 text-right">

                          <span
                            className={
                              'text-sm font-bold ' +
                              (
                                payment.remaining >
                                0
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              )
                            }
                          >
                            {formatRupiah(
                              payment.remaining
                            )}
                          </span>

                        </td>

                        {/* Status */}

                        <td className="px-5 py-4 text-center">

                          <span
                            className={
                              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ' +
                              getPaymentStatusClass(
                                payment.paymentStatus
                              )
                            }
                          >

                            {getPaymentStatusIcon(
                              payment.paymentStatus
                            )}

                            {
                              getPaymentStatusLabel(
                                payment.paymentStatus
                              )
                            }

                          </span>

                        </td>

                        {/* Last Payment */}

                        <td className="px-5 py-4 text-center">

                          {payment.lastPayment ? (
                            <div>

                              <p className="text-sm font-semibold text-gray-800">
                                {formatRupiah(
                                  payment.lastPayment
                                    .amount
                                )}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {getPaymentMethodLabel(
                                  payment.lastPayment
                                    .payment_method
                                )}
                              </p>

                              <p className="mt-1 text-[11px] text-gray-400">
                                {formatDate(
                                  payment.lastPayment
                                    .payment_date ||
                                    payment.lastPayment
                                      .created_at
                                )}
                              </p>

                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Belum ada pembayaran
                            </span>
                          )}

                        </td>

                        {/* Action */}

                        <td className="px-5 py-4">

                          <div className="flex items-center justify-center gap-2">

                            {/* Detail */}

                            <button
                              type="button"
                              onClick={() =>
                                handleDetail(
                                  payment.id
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >

                              <Eye
                                size={15}
                              />

                              Detail

                            </button>

                            {/* Bayar */}

                            {payment.paymentStatus !==
                              'completed' &&
                              payment.remaining >
                                0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenPaymentModal(
                                      payment
                                    )
                                  }
                                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
                                >

                                  <WalletCards
                                    size={15}
                                  />

                                  Bayar

                                </button>
                              )}

                          </div>

                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

          {/* ========================================================
              PAGINATION
          ======================================================== */}

          {pagination.last_page > 1 && (
            <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-sm text-gray-500">

                Halaman{' '}

                <span className="font-medium text-gray-900">
                  {pagination.current_page}
                </span>{' '}

                dari{' '}

                <span className="font-medium text-gray-900">
                  {pagination.last_page}
                </span>

                {' '}(
                {pagination.total} data)

              </p>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={() =>
                    goToPage(
                      pagination.current_page -
                        1
                    )
                  }
                  disabled={
                    pagination.current_page <=
                    1
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >

                  <ChevronLeft
                    size={17}
                  />

                  Sebelumnya

                </button>

                <button
                  type="button"
                  onClick={() =>
                    goToPage(
                      pagination.current_page +
                        1
                    )
                  }
                  disabled={
                    pagination.current_page >=
                    pagination.last_page
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >

                  Berikutnya

                  <ChevronRight
                    size={17}
                  />

                </button>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* ============================================================
          PAYMENT MODAL
      ============================================================ */}

      {paymentModalOpen &&
        selectedPayment && (
          <div
            className="
              fixed
              inset-0
              z-[100]
              flex
              items-center
              justify-center
              bg-slate-950/50
              p-4
              backdrop-blur-sm
            "
          >

            <div
              className="
                w-full
                max-w-lg
                overflow-hidden
                rounded-2xl
                bg-white
                shadow-2xl
              "
            >

              {/* Modal Header */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-b
                  border-gray-200
                  px-6
                  py-4
                "
              >

                <div>

                  <h2 className="text-lg font-bold text-gray-900">
                    Tambah Pembayaran
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    {
                      selectedPayment
                        .transactionNumber
                    }
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    handleClosePaymentModal
                  }
                  disabled={paymentLoading}
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-lg
                    text-gray-400
                    transition
                    hover:bg-gray-100
                    hover:text-gray-600
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <X size={19} />
                </button>

              </div>

              {/* Modal Body */}

              <form
                onSubmit={
                  handleSubmitPayment
                }
              >

                <div className="space-y-5 px-6 py-5">

                  {/* Summary */}

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">

                    <div className="grid grid-cols-3 gap-3">

                      <div>

                        <p className="text-xs text-gray-500">
                          Total
                        </p>

                        <p className="mt-1 text-sm font-bold text-gray-900">
                          {formatRupiah(
                            selectedPayment.total
                          )}
                        </p>

                      </div>

                      <div>

                        <p className="text-xs text-gray-500">
                          Sudah Dibayar
                        </p>

                        <p className="mt-1 text-sm font-bold text-green-600">
                          {formatRupiah(
                            selectedPayment.paid
                          )}
                        </p>

                      </div>

                      <div>

                        <p className="text-xs text-gray-500">
                          Sisa
                        </p>

                        <p className="mt-1 text-sm font-bold text-red-600">
                          {formatRupiah(
                            selectedPayment.remaining
                          )}
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* Error */}

                  {paymentError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">

                      <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                      />

                      <span>
                        {paymentError}
                      </span>

                    </div>
                  )}

                  {/* Payment Method */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Metode Pembayaran
                    </label>

                    <select
                      value={
                        paymentMethod
                      }
                      onChange={(event) =>
                        setPaymentMethod(
                          event.target.value
                        )
                      }
                      disabled={
                        paymentLoading
                      }
                      className="
                        w-full
                        rounded-lg
                        border
                        border-gray-300
                        bg-white
                        px-3
                        py-2.5
                        text-sm
                        outline-none
                        focus:border-blue-500
                        focus:ring-2
                        focus:ring-blue-100
                        disabled:bg-gray-100
                      "
                    >

                      <option value="cash">
                        Cash
                      </option>

                      <option value="transfer">
                        Transfer
                      </option>

                      <option value="qris">
                        QRIS
                      </option>

                      <option value="debit">
                        Debit
                      </option>

                    </select>

                  </div>

                  {/* Amount */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Nominal Pembayaran
                    </label>

                    <div className="relative">

                      <span
                        className="
                          absolute
                          left-3
                          top-1/2
                          -translate-y-1/2
                          text-sm
                          font-medium
                          text-gray-500
                        "
                      >
                        Rp
                      </span>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={
                          paymentAmount
                        }
                        onChange={(
                          event
                        ) =>
                          setPaymentAmount(
                            event.target
                              .value
                          )
                        }
                        disabled={
                          paymentLoading
                        }
                        placeholder="0"
                        className="
                          w-full
                          rounded-lg
                          border
                          border-gray-300
                          py-2.5
                          pl-10
                          pr-3
                          text-sm
                          outline-none
                          focus:border-blue-500
                          focus:ring-2
                          focus:ring-blue-100
                          disabled:bg-gray-100
                        "
                      />

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setPaymentAmount(
                          String(
                            selectedPayment.remaining
                          )
                        )
                      }
                      disabled={
                        paymentLoading
                      }
                      className="
                        mt-2
                        text-xs
                        font-medium
                        text-blue-600
                        hover:text-blue-700
                        disabled:opacity-50
                      "
                    >
                      Bayar penuh{' '}
                      {formatRupiah(
                        selectedPayment.remaining
                      )}
                    </button>

                  </div>

                  {/* Note */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Catatan{' '}
                      <span className="font-normal text-gray-400">
                        (opsional)
                      </span>
                    </label>

                    <textarea
                      rows="3"
                      value={
                        paymentNote
                      }
                      onChange={(
                        event
                      ) =>
                        setPaymentNote(
                          event.target
                            .value
                        )
                      }
                      disabled={
                        paymentLoading
                      }
                      placeholder="Tambahkan catatan pembayaran..."
                      className="
                        w-full
                        resize-none
                        rounded-lg
                        border
                        border-gray-300
                        px-3
                        py-2.5
                        text-sm
                        outline-none
                        focus:border-blue-500
                        focus:ring-2
                        focus:ring-blue-100
                        disabled:bg-gray-100
                      "
                    />

                  </div>

                </div>

                {/* Modal Footer */}

                <div
                  className="
                    flex
                    items-center
                    justify-end
                    gap-3
                    border-t
                    border-gray-200
                    bg-gray-50
                    px-6
                    py-4
                  "
                >

                  <button
                    type="button"
                    onClick={
                      handleClosePaymentModal
                    }
                    disabled={
                      paymentLoading
                    }
                    className="
                      rounded-lg
                      border
                      border-gray-300
                      bg-white
                      px-4
                      py-2.5
                      text-sm
                      font-medium
                      text-gray-700
                      hover:bg-gray-50
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={
                      paymentLoading
                    }
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      rounded-lg
                      bg-blue-600
                      px-4
                      py-2.5
                      text-sm
                      font-semibold
                      text-white
                      shadow-sm
                      hover:bg-blue-700
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >

                    {paymentLoading && (
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />
                    )}

                    {paymentLoading
                      ? 'Menyimpan...'
                      : 'Simpan Pembayaran'}

                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

    </DashboardLayout>
  )
}

export default PaymentHistory