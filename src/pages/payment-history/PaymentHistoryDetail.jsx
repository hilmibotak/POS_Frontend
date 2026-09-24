import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  History,
  RefreshCw,
  UserRound,
  WalletCards,
} from 'lucide-react'

import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'

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

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const getPaymentMethodLabel = (method) => {
  const labels = {
    bon: 'Kasbon',
    credit: 'Credit',
    partial: 'Partial',
    cash: 'Cash',
    transfer: 'Transfer',
    qris: 'QRIS',
    debit: 'Debit',
  }

  return labels[method] || method || '-'
}

const getStatusLabel = (status) => {
  const labels = {
    unpaid: 'Belum Lunas',
    partial: 'Sebagian',
    pending: 'Menunggu',
    completed: 'Lunas',
  }

  return labels[status] || status || '-'
}

const getStatusClass = (status) => {
  const classes = {
    unpaid:
      'bg-red-50 text-red-700 border-red-200',
    partial:
      'bg-yellow-50 text-yellow-700 border-yellow-200',
    pending:
      'bg-blue-50 text-blue-700 border-blue-200',
    completed:
      'bg-green-50 text-green-700 border-green-200',
  }

  return (
    classes[status] ||
    'bg-gray-50 text-gray-700 border-gray-200'
  )
}

function PaymentHistoryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [transaction, setTransaction] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const fetchTransaction = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get(
        `/transactions/${id}`
      )

      setTransaction(
        response?.data?.data || null
      )
    } catch (err) {
      console.error(
        'Gagal mengambil detail tagihan:',
        err
      )

      setError(
        err?.response?.data?.message ||
          'Gagal mengambil detail tagihan.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchTransaction()
    }
  }, [id])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />

            <p className="text-sm text-gray-500">
              Memuat detail tagihan...
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !transaction) {
    return (
      <DashboardLayout>
        <div className="space-y-6">

          <button
            type="button"
            onClick={() =>
              navigate('/payment-history')
            }
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />

            Kembali ke Riwayat Tagihan
          </button>

          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="font-medium text-red-800">
              {error ||
                'Data tagihan tidak ditemukan.'}
            </p>
          </div>

        </div>
      </DashboardLayout>
    )
  }

  const total = Number(
    transaction.total || 0
  )

  const paid = Number(
    transaction.paid || 0
  )

  const remaining = Number(
    transaction.remaining_amount ??
      Math.max(total - paid, 0)
  )

  const paymentStatus =
    transaction.payment_status ||
    (remaining <= 0
      ? 'completed'
      : paid > 0
        ? 'partial'
        : 'unpaid')

  const paymentHistories =
    transaction.payment_histories || []

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* HEADER */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <button
              type="button"
              onClick={() =>
                navigate('/payment-history')
              }
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />

              Kembali ke Riwayat Tagihan
            </button>

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-blue-50 p-3">
                <History className="h-6 w-6 text-blue-600" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Detail Tagihan
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  {transaction.transaction_number}
                </p>
              </div>

            </div>
          </div>

          {remaining > 0 && (
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/payment-history`
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <WalletCards className="h-4 w-4" />

              Bayar Tagihan
            </button>
          )}

        </div>

        {/* SUMMARY */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <WalletCards className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Total Tagihan
                </p>

                <p className="mt-1 text-lg font-bold text-gray-900">
                  {formatRupiah(total)}
                </p>
              </div>
            </div>

          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Total Terbayar
            </p>

            <p className="mt-2 text-xl font-bold text-green-600">
              {formatRupiah(paid)}
            </p>

          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Sisa Tagihan
            </p>

            <p className="mt-2 text-xl font-bold text-red-600">
              {formatRupiah(remaining)}
            </p>

          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Status
            </p>

            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(
                  paymentStatus
                )}`}
              >
                {paymentStatus ===
                'completed' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Clock3 className="h-4 w-4" />
                )}

                {getStatusLabel(
                  paymentStatus
                )}
              </span>
            </div>

          </div>

        </div>

        {/* TRANSACTION INFORMATION */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="font-semibold text-gray-900">
                Informasi Transaksi
              </h2>
            </div>

            <div className="space-y-4 p-6">

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Nomor Transaksi
                </span>

                <span className="text-sm font-semibold text-gray-900">
                  {transaction.transaction_number}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Pelanggan
                </span>

                <span className="text-sm font-medium text-gray-900">
                  {transaction.customer?.name ||
                    'Umum'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Kasir
                </span>

                <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <UserRound className="h-4 w-4 text-gray-400" />

                  {transaction.user?.name ||
                    '-'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Jenis Tagihan
                </span>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {getPaymentMethodLabel(
                    transaction.payment_method
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-sm text-gray-500">
                  <CalendarDays className="h-4 w-4" />

                  Tanggal Transaksi
                </span>

                <span className="text-sm text-gray-900">
                  {formatDate(
                    transaction.transaction_date ||
                      transaction.created_at
                  )}
                </span>
              </div>

            </div>

          </div>

          {/* PAYMENT SUMMARY */}

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="font-semibold text-gray-900">
                Ringkasan Pembayaran
              </h2>
            </div>

            <div className="space-y-4 p-6">

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Total
                </span>

                <span className="font-semibold text-gray-900">
                  {formatRupiah(total)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Sudah Dibayar
                </span>

                <span className="font-semibold text-green-600">
                  {formatRupiah(paid)}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">

                  <span className="font-medium text-gray-700">
                    Sisa Tagihan
                  </span>

                  <span className="text-lg font-bold text-red-600">
                    {formatRupiah(remaining)}
                  </span>

                </div>
              </div>

            </div>

          </div>

        </div>

        {/* PAYMENT HISTORY */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-6 py-4">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-gray-900">
                  Riwayat Pembayaran
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Daftar pembayaran yang sudah
                  dicatat untuk transaksi ini.
                </p>
              </div>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {paymentHistories.length}{' '}
                pembayaran
              </span>

            </div>

          </div>

          {paymentHistories.length === 0 ? (
            <div className="px-6 py-12 text-center">

              <Clock3 className="mx-auto h-10 w-10 text-gray-300" />

              <p className="mt-3 text-sm font-medium text-gray-600">
                Belum ada pembayaran
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Belum ada pembayaran yang
                dicatat untuk tagihan ini.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-50">
                  <tr>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Tanggal
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Metode
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Nominal
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Petugas
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Catatan
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {paymentHistories.map(
                    (payment) => (
                      <tr
                        key={payment.id}
                        className="hover:bg-gray-50"
                      >

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatDate(
                            payment.payment_date ||
                              payment.created_at
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {getPaymentMethodLabel(
                              payment.payment_method
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-semibold text-green-600">
                          {formatRupiah(
                            payment.amount
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {payment.user?.name ||
                            '-'}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500">
                          {payment.note || '-'}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </DashboardLayout>
  )
}

export default PaymentHistoryDetail