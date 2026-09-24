import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  History,
  Loader2,
  Printer,
  RefreshCw,
  User,
  UserRound,
  XCircle,
} from 'lucide-react'

import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'


/*
|--------------------------------------------------------------------------
| Helper
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

const formatNumber = (value) => {
  const number = Number(value || 0)

  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
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

const getPaymentMethodDescription = (method) => {
  const descriptions = {
    cash: 'Pembayaran tunai',
    qris: 'Pembayaran menggunakan QRIS',
    transfer: 'Pembayaran melalui transfer bank',
    debit: 'Pembayaran menggunakan kartu debit',
    credit: 'Pembayaran kredit',
    bon: 'Pembayaran dengan sistem bon / utang',
    partial: 'Pembayaran sebagian',
  }

  return descriptions[method] || '-'
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

const getTransactionStatusLabel = (status) => {
  const labels = {
    completed: 'Selesai',
    pending: 'Pending',
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

  return classes[status] || 'bg-gray-100 text-gray-700'
}

const getTransactionStatusClass = (status) => {
  const classes = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return classes[status] || 'bg-gray-100 text-gray-700'
}

const getPaymentMethodClass = (method) => {
  const classes = {
    cash: 'bg-green-50 text-green-700 border-green-200',
    qris: 'bg-blue-50 text-blue-700 border-blue-200',
    transfer: 'bg-purple-50 text-purple-700 border-purple-200',
    debit: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    credit: 'bg-orange-50 text-orange-700 border-orange-200',
    bon: 'bg-red-50 text-red-700 border-red-200',
    partial: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  }

  return classes[method] || 'bg-gray-50 text-gray-700 border-gray-200'
}


/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

function TransactionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [transaction, setTransaction] = useState(null)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [confirming, setConfirming] = useState(false)
  const [printing, setPrinting] = useState(false)

  const [error, setError] = useState('')

  /*
  |--------------------------------------------------------------------------
  | Role
  |--------------------------------------------------------------------------
  */

  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'Admin'

  /*
  |--------------------------------------------------------------------------
  | Fetch transaction
  |--------------------------------------------------------------------------
  */

  const fetchTransaction = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      setError('')

      const response = await api.get(
        '/transactions/' + id
      )

      if (response.data?.success === false) {
        throw new Error(
          response.data?.message ||
          'Gagal mengambil data transaksi.'
        )
      }

      const data =
        response.data?.data ||
        response.data

      setTransaction(data)

    } catch (err) {
      console.error(
        'Fetch transaction error:',
        err
      )

      const message =
        err.response?.data?.message ||
        err.message ||
        'Gagal mengambil data transaksi.'

      setError(message)

    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchTransaction()
    }
  }, [id])


  /*
  |--------------------------------------------------------------------------
  | Confirm QRIS / Transfer
  |--------------------------------------------------------------------------
  */

  const handleConfirmPayment = async () => {
    if (!transaction) return

    if (
      !['qris', 'transfer'].includes(
        transaction.payment_method
      )
    ) {
      return
    }

    if (
      transaction.payment_status === 'completed'
    ) {
      return
    }

    const confirmed = window.confirm(
      'Apakah pembayaran transaksi ini sudah benar-benar diterima?'
    )

    if (!confirmed) {
      return
    }

    try {
      setConfirming(true)
      setError('')

      const response = await api.post(
        '/transactions/' +
          transaction.id +
          '/confirm-payment'
      )

      if (response.data?.success === false) {
        throw new Error(
          response.data?.message ||
          'Gagal mengkonfirmasi pembayaran.'
        )
      }

      window.alert(
        response.data?.message ||
        'Pembayaran berhasil dikonfirmasi.'
      )

      await fetchTransaction(false)

    } catch (err) {
      console.error(
        'Confirm payment error:',
        err
      )

      const message =
        err.response?.data?.message ||
        err.message ||
        'Gagal mengkonfirmasi pembayaran.'

      window.alert(message)

      setError(message)

    } finally {
      setConfirming(false)
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Reprint
  |--------------------------------------------------------------------------
  */

  const handleReprint = async () => {
    if (!transaction) return

    try {
      setPrinting(true)

      let reprintData = null

      try {
        const response = await api.get(
          '/transactions/' +
            transaction.id +
            '/reprint'
        )

        reprintData =
          response.data?.data ||
          response.data

      } catch (reprintError) {
        console.warn(
          'Reprint endpoint gagal, menggunakan data transaksi:',
          reprintError
        )
      }

      if (!reprintData) {
        reprintData = {
          store: {
            name: 'BuildPOS',
            address: 'Toko Material Bangunan',
            phone: '-',
          },

          transaction: {
            id: transaction.id,
            transaction_number:
              transaction.transaction_number,
            date:
              transaction.transaction_date ||
              transaction.created_at,
            status:
              transaction.status,
            payment_method:
              transaction.payment_method,
            payment_status:
              transaction.payment_status,
          },

          cashier: transaction.user
            ? {
                id: transaction.user.id,
                name: transaction.user.name,
              }
            : null,

          customer: transaction.customer
            ? {
                id: transaction.customer.id,
                name: transaction.customer.name,
                phone: transaction.customer.phone,
              }
            : null,

          items:
            transaction.details ||
            transaction.items ||
            [],

          summary: {
            subtotal: transaction.subtotal,
            discount: transaction.discount,
            total: transaction.total,
            paid: transaction.paid,
            change: transaction.change,
            remaining_amount:
              transaction.remaining_amount,
          },

          payment_histories:
            transaction.payment_histories ||
            transaction.paymentHistories ||
            [],
        }
      }

      printReceipt(reprintData)

    } catch (err) {
      console.error(
        'Reprint error:',
        err
      )

      window.alert(
        'Gagal mencetak ulang struk.'
      )

    } finally {
      setPrinting(false)
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Print receipt
  |--------------------------------------------------------------------------
  */

  const printReceipt = (data) => {
    const store =
      data.store || {
        name: 'BuildPOS',
        address: 'Toko Material Bangunan',
        phone: '-',
      }

    const trx =
      data.transaction || {}

    const cashier =
      data.cashier || null

    const customer =
      data.customer || null

    const items =
      data.items || []

    const summary =
      data.summary || {}

    const histories =
      data.payment_histories || []

    const receiptWindow =
      window.open(
        '',
        '_blank',
        'width=420,height=700'
      )

    if (!receiptWindow) {
      window.alert(
        'Popup diblokir browser. Izinkan popup untuk mencetak struk.'
      )

      return
    }

    const itemRows = items
      .map((item) => {
        const productName =
          item.product_name ||
          item.product?.name ||
          '-'

        const unit =
          item.unit ||
          item.unit_name ||
          item.unit?.name ||
          '-'

        const quantity =
          item.quantity || 0

        const unitPrice =
          item.unit_price || 0

        const subtotal =
          item.subtotal || 0

        return `
          <tr>
            <td colspan="2">
              ${productName}
            </td>
          </tr>

          <tr>
            <td>
              ${formatNumber(quantity)}
              ${unit}
              ×
              ${formatRupiah(unitPrice)}
            </td>

            <td class="right">
              ${formatRupiah(subtotal)}
            </td>
          </tr>
        `
      })
      .join('')

    const historyRows = histories
      .map((history) => {
        const method =
          getPaymentMethodLabel(
            history.payment_method
          )

        const amount =
          history.amount || 0

        const date =
          history.payment_date ||
          history.created_at

        const userName =
          history.user?.name ||
          history.user_name ||
          '-'

        return `
          <tr>
            <td>
              ${method}
              <br>
              <small>
                ${formatDate(date)}
              </small>
              <br>
              <small>
                ${userName}
              </small>
            </td>

            <td class="right">
              ${formatRupiah(amount)}
            </td>
          </tr>
        `
      })
      .join('')

    const remaining =
      Number(
        summary.remaining_amount ||
        0
      )

    receiptWindow.document.write(`
      <!DOCTYPE html>

      <html>
        <head>
          <title>
            ${trx.transaction_number || 'Struk'}
          </title>

          <meta
            charset="UTF-8"
          />

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family:
                Arial,
                Helvetica,
                sans-serif;

              width: 80mm;

              margin: 0 auto;

              padding: 8px;

              font-size: 12px;

              color: #000;
            }

            .center {
              text-align: center;
            }

            .right {
              text-align: right;
            }

            .bold {
              font-weight: bold;
            }

            .store-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 4px;
            }

            .separator {
              border-top:
                1px dashed #000;

              margin:
                8px 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            td {
              padding:
                2px 0;

              vertical-align:
                top;
            }

            .summary td {
              padding:
                3px 0;
            }

            .total {
              font-size: 15px;
              font-weight: bold;
            }

            .debt {
              font-weight: bold;
            }

            .footer {
              margin-top: 14px;
              text-align: center;
            }

            small {
              font-size: 9px;
            }

            @media print {
              body {
                width: 80mm;
              }
            }
          </style>
        </head>

        <body>

          <div class="center">
            <div class="store-name">
              ${store.name || 'BuildPOS'}
            </div>

            <div>
              ${store.address || '-'}
            </div>

            <div>
              ${store.phone || '-'}
            </div>
          </div>

          <div class="separator"></div>

          <table>
            <tr>
              <td>No. Transaksi</td>
              <td class="right">
                ${trx.transaction_number || '-'}
              </td>
            </tr>

            <tr>
              <td>Tanggal</td>
              <td class="right">
                ${formatDate(trx.date)}
              </td>
            </tr>

            <tr>
              <td>Kasir</td>
              <td class="right">
                ${cashier?.name || '-'}
              </td>
            </tr>

            <tr>
              <td>Pelanggan</td>
              <td class="right">
                ${customer?.name || '-'}
              </td>
            </tr>
          </table>

          <div class="separator"></div>

          <table>
            ${itemRows}
          </table>

          <div class="separator"></div>

          <table class="summary">

            <tr>
              <td>Subtotal</td>
              <td class="right">
                ${formatRupiah(
                  summary.subtotal
                )}
              </td>
            </tr>

            <tr>
              <td>Diskon</td>
              <td class="right">
                ${formatRupiah(
                  summary.discount
                )}
              </td>
            </tr>

            <tr class="total">
              <td>Total</td>
              <td class="right">
                ${formatRupiah(
                  summary.total
                )}
              </td>
            </tr>

            <tr>
              <td>Metode</td>
              <td class="right">
                ${getPaymentMethodLabel(
                  trx.payment_method
                )}
              </td>
            </tr>

            <tr>
              <td>Status</td>
              <td class="right">
                ${getPaymentStatusLabel(
                  trx.payment_status
                )}
              </td>
            </tr>

            <tr>
              <td>Sudah Dibayar</td>
              <td class="right">
                ${formatRupiah(
                  summary.paid
                )}
              </td>
            </tr>

            <tr>
              <td>Kembalian</td>
              <td class="right">
                ${formatRupiah(
                  summary.change
                )}
              </td>
            </tr>

            ${
              remaining > 0
                ? `
                  <tr class="debt">
                    <td>Sisa Tagihan</td>
                    <td class="right">
                      ${formatRupiah(
                        remaining
                      )}
                    </td>
                  </tr>
                `
                : ''
            }

          </table>

          ${
            histories.length > 0
              ? `
                <div class="separator"></div>

                <div class="bold">
                  Riwayat Pembayaran
                </div>

                <table>
                  ${historyRows}
                </table>
              `
              : ''
          }

          <div class="separator"></div>

          <div class="footer">
            <div class="bold">
              Terima kasih
            </div>

            <div>
              Barang yang sudah dibeli
              tidak dapat dikembalikan
              tanpa ketentuan toko.
            </div>
          </div>

          <script>
            window.onload = function () {
              window.print();

              setTimeout(
                function () {
                  window.close();
                },
                500
              );
            };
          </script>

        </body>
      </html>
    `)

    receiptWindow.document.close()
  }


  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <DashboardLayout>

        <div className="flex min-h-[500px] items-center justify-center">

          <div className="flex items-center gap-3 text-gray-500">

            <Loader2
              size={24}
              className="animate-spin"
            />

            <span>
              Memuat detail transaksi...
            </span>

          </div>

        </div>

      </DashboardLayout>
    )
  }


  /*
  |--------------------------------------------------------------------------
  | Error / not found
  |--------------------------------------------------------------------------
  */

  if (error && !transaction) {
    return (
      <DashboardLayout>

        <div className="p-6">

          <button
            onClick={() =>
              navigate('/transactions')
            }
            className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} />

            Kembali ke Transaksi
          </button>

          <div className="rounded-xl border border-red-200 bg-red-50 p-6">

            <div className="flex items-start gap-3">

              <XCircle
                size={24}
                className="mt-0.5 text-red-600"
              />

              <div>

                <h2 className="font-semibold text-red-800">
                  Gagal Memuat Transaksi
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>

              </div>

            </div>

          </div>

        </div>

      </DashboardLayout>
    )
  }


  if (!transaction) {
    return null
  }


  /*
  |--------------------------------------------------------------------------
  | Data
  |--------------------------------------------------------------------------
  */

  const details =
    transaction.details ||
    transaction.items ||
    []

  const paymentHistories =
    transaction.payment_histories ||
    transaction.paymentHistories ||
    []

  const subtotal =
    Number(transaction.subtotal || 0)

  const discount =
    Number(transaction.discount || 0)

  const total =
    Number(transaction.total || 0)

  const paid =
    Number(transaction.paid || 0)

  const change =
    Number(transaction.change || 0)

  const remainingAmount =
    Number(
      transaction.remaining_amount ||
      Math.max(total - paid, 0)
    )

  const paymentMethod =
    transaction.payment_method

  const paymentStatus =
    transaction.payment_status

  const transactionStatus =
    transaction.status

  const needsConfirmation =
    isAdmin &&
    ['qris', 'transfer'].includes(
      paymentMethod
    ) &&
    paymentStatus === 'pending'


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <DashboardLayout>

      <div className="space-y-6 p-6">

        {/* Header */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <button
              onClick={() =>
                navigate('/transactions')
              }
              className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={18} />

              Kembali ke Transaksi
            </button>

            <h1 className="text-2xl font-bold text-gray-900">
              Detail Transaksi
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {transaction.transaction_number}
            </p>

          </div>


          <div className="flex flex-wrap gap-2">

            <button
              onClick={() =>
                fetchTransaction(false)
              }
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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


            <button
              onClick={handleReprint}
              disabled={printing}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {printing ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Printer size={17} />
              )}

              {printing
                ? 'Mencetak...'
                : 'Cetak Ulang'}
            </button>

          </div>

        </div>


        {/* Error */}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}


        {/* Status */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  Status Transaksi
                </p>

                <div className="mt-2">

                  <span
                    className={
                      'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ' +
                      getTransactionStatusClass(
                        transactionStatus
                      )
                    }
                  >

                    {transactionStatus ===
                    'completed' ? (
                      <CheckCircle2
                        size={15}
                      />
                    ) : transactionStatus ===
                      'cancelled' ? (
                      <XCircle size={15} />
                    ) : (
                      <Clock3 size={15} />
                    )}

                    {getTransactionStatusLabel(
                      transactionStatus
                    )}

                  </span>

                </div>

              </div>

            </div>

          </div>


          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Status Pembayaran
            </p>

            <div className="mt-2">

              <span
                className={
                  'inline-flex rounded-full px-3 py-1 text-sm font-medium ' +
                  getPaymentStatusClass(
                    paymentStatus
                  )
                }
              >
                {getPaymentStatusLabel(
                  paymentStatus
                )}
              </span>

            </div>

          </div>


          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Total Transaksi
            </p>

            <p className="mt-2 text-xl font-bold text-gray-900">
              {formatRupiah(total)}
            </p>

          </div>

        </div>


        {/* Confirm Payment */}

        {needsConfirmation && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div className="flex items-start gap-3">

                <Clock3
                  size={22}
                  className="mt-0.5 text-yellow-600"
                />

                <div>

                  <h3 className="font-semibold text-yellow-900">
                    Pembayaran Menunggu Konfirmasi
                  </h3>

                  <p className="mt-1 text-sm text-yellow-800">
                    Pembayaran{' '}
                    {getPaymentMethodLabel(
                      paymentMethod
                    )}{' '}
                    belum dikonfirmasi.
                    Pastikan pembayaran benar-benar
                    sudah diterima sebelum melakukan
                    konfirmasi.
                  </p>

                </div>

              </div>


              <button
                onClick={
                  handleConfirmPayment
                }
                disabled={confirming}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {confirming ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCircle2
                    size={17}
                  />
                )}

                {confirming
                  ? 'Mengkonfirmasi...'
                  : 'Konfirmasi Pembayaran'}

              </button>

            </div>

          </div>
        )}


        {/* Transaction Information */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Transaction */}

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 px-5 py-4">

              <h2 className="font-semibold text-gray-900">
                Informasi Transaksi
              </h2>

            </div>

            <div className="space-y-4 p-5">

              <div className="flex items-start justify-between gap-4">

                <span className="text-sm text-gray-500">
                  Nomor Transaksi
                </span>

                <span className="text-right text-sm font-semibold text-gray-900">
                  {transaction.transaction_number ||
                    '-'}
                </span>

              </div>


              <div className="flex items-start justify-between gap-4">

                <span className="text-sm text-gray-500">
                  Tanggal
                </span>

                <span className="text-right text-sm text-gray-900">
                  {formatDate(
                    transaction.transaction_date ||
                      transaction.created_at
                  )}
                </span>

              </div>


              <div className="flex items-start justify-between gap-4">

                <span className="text-sm text-gray-500">
                  Metode Pembayaran
                </span>

                <span
                  className={
                    'rounded-lg border px-3 py-1 text-sm font-medium ' +
                    getPaymentMethodClass(
                      paymentMethod
                    )
                  }
                >
                  {getPaymentMethodLabel(
                    paymentMethod
                  )}
                </span>

              </div>


              <div className="flex items-start justify-between gap-4">

                <span className="text-sm text-gray-500">
                  Keterangan
                </span>

                <span className="max-w-[60%] text-right text-sm text-gray-900">
                  {getPaymentMethodDescription(
                    paymentMethod
                  )}
                </span>

              </div>

            </div>

          </div>


          {/* Customer & Cashier */}

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 px-5 py-4">

              <h2 className="font-semibold text-gray-900">
                Informasi Pelanggan & Kasir
              </h2>

            </div>

            <div className="space-y-5 p-5">

              {/* Customer */}

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">

                  <User size={20} />

                </div>

                <div>

                  <p className="text-xs text-gray-500">
                    Pelanggan
                  </p>

                  <p className="mt-1 font-medium text-gray-900">
                    {transaction.customer?.name ||
                      'Umum'}
                  </p>

                  {transaction.customer
                    ?.phone && (
                    <p className="mt-1 text-sm text-gray-500">
                      {
                        transaction.customer
                          .phone
                      }
                    </p>
                  )}

                </div>

              </div>


              {/* Cashier */}

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">

                  <UserRound size={20} />

                </div>

                <div>

                  <p className="text-xs text-gray-500">
                    Kasir
                  </p>

                  <p className="mt-1 font-medium text-gray-900">
                    {transaction.user?.name ||
                      transaction.cashier?.name ||
                      '-'}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* Items */}

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-5 py-4">

            <div className="flex items-center justify-between">

              <h2 className="font-semibold text-gray-900">
                Detail Barang
              </h2>

              <span className="text-sm text-gray-500">
                {details.length} item
                {details.length !== 1
                  ? 's'
                  : ''}
              </span>

            </div>

          </div>


          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    #
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Produk
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Satuan
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Qty
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Harga
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Subtotal
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-gray-100">

                {details.length === 0 ? (
                  <tr>

                    <td
                      colSpan="6"
                      className="px-5 py-10 text-center text-sm text-gray-500"
                    >
                      Tidak ada detail barang.
                    </td>

                  </tr>
                ) : (
                  details.map(
                    (item, index) => {

                      const productName =
                        item.product?.name ||
                        item.product_name ||
                        '-'

                      const unitName =
                        item.unit?.name ||
                        item.unit_name ||
                        item.unit ||
                        '-'

                      const quantity =
                        Number(
                          item.quantity || 0
                        )

                      const conversionRate =
                        Number(
                          item.conversion_rate ||
                            1
                        )

                      const baseQuantity =
                        Number(
                          item.base_quantity ||
                            quantity *
                              conversionRate
                        )

                      return (
                        <tr
                          key={
                            item.id ||
                            index
                          }
                          className="hover:bg-gray-50"
                        >

                          <td className="px-5 py-4 text-sm text-gray-500">
                            {index + 1}
                          </td>


                          <td className="px-5 py-4">

                            <p className="font-medium text-gray-900">
                              {productName}
                            </p>

                            {conversionRate !==
                              1 && (
                              <p className="mt-1 text-xs text-gray-500">
                                Konversi:{' '}
                                {
                                  conversionRate
                                }{' '}
                                base unit
                              </p>
                            )}

                          </td>


                          <td className="px-5 py-4 text-sm text-gray-700">
                            {unitName}
                          </td>


                          <td className="px-5 py-4 text-right text-sm text-gray-900">
                            {formatNumber(
                              quantity
                            )}

                            {conversionRate !==
                              1 && (
                              <div className="mt-1 text-xs text-gray-500">
                                Base:{' '}
                                {formatNumber(
                                  baseQuantity
                                )}
                              </div>
                            )}
                          </td>


                          <td className="px-5 py-4 text-right text-sm text-gray-900">
                            {formatRupiah(
                              item.unit_price
                            )}
                          </td>


                          <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900">
                            {formatRupiah(
                              item.subtotal
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


        {/* Payment Summary */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Summary */}

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 px-5 py-4">

              <h2 className="font-semibold text-gray-900">
                Ringkasan Pembayaran
              </h2>

            </div>


            <div className="space-y-3 p-5">

              <div className="flex justify-between gap-4">

                <span className="text-sm text-gray-500">
                  Subtotal
                </span>

                <span className="text-sm text-gray-900">
                  {formatRupiah(
                    subtotal
                  )}
                </span>

              </div>


              <div className="flex justify-between gap-4">

                <span className="text-sm text-gray-500">
                  Diskon
                </span>

                <span className="text-sm text-gray-900">
                  {formatRupiah(
                    discount
                  )}
                </span>

              </div>


              <div className="my-3 border-t border-gray-200" />


              <div className="flex justify-between gap-4">

                <span className="font-semibold text-gray-900">
                  Total
                </span>

                <span className="text-lg font-bold text-gray-900">
                  {formatRupiah(total)}
                </span>

              </div>


              <div className="flex justify-between gap-4">

                <span className="text-sm text-gray-500">
                  Sudah Dibayar
                </span>

                <span className="text-sm font-medium text-green-600">
                  {formatRupiah(paid)}
                </span>

              </div>


              <div className="flex justify-between gap-4">

                <span className="text-sm text-gray-500">
                  Kembalian
                </span>

                <span className="text-sm text-gray-900">
                  {formatRupiah(change)}
                </span>

              </div>


              <div className="my-3 border-t border-gray-200" />


              <div className="flex justify-between gap-4">

                <span className="font-semibold text-gray-900">
                  Sisa Tagihan
                </span>

                <span
                  className={
                    'text-lg font-bold ' +
                    (
                      remainingAmount >
                      0
                        ? 'text-red-600'
                        : 'text-green-600'
                    )
                  }
                >
                  {formatRupiah(
                    remainingAmount
                  )}
                </span>

              </div>

            </div>

          </div>


          {/* Payment Method */}

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 px-5 py-4">

              <h2 className="font-semibold text-gray-900">
                Detail Pembayaran
              </h2>

            </div>


            <div className="p-5">

              <div
                className={
                  'rounded-xl border p-5 ' +
                  getPaymentMethodClass(
                    paymentMethod
                  )
                }
              >

                <div className="flex items-start gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/70">

                    <CreditCard
                      size={22}
                    />

                  </div>

                  <div>

                    <p className="text-xs opacity-70">
                      Metode Pembayaran
                    </p>

                    <p className="mt-1 text-lg font-bold">
                      {getPaymentMethodLabel(
                        paymentMethod
                      )}
                    </p>

                    <p className="mt-1 text-sm opacity-80">
                      {getPaymentMethodDescription(
                        paymentMethod
                      )}
                    </p>

                  </div>

                </div>

              </div>


              {paymentMethod ===
                'bon' &&
                remainingAmount > 0 && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">

                    <p className="text-sm font-semibold text-red-800">
                      Transaksi Bon
                    </p>

                    <p className="mt-1 text-sm text-red-700">
                      Masih terdapat
                      tagihan sebesar{' '}
                      <strong>
                        {formatRupiah(
                          remainingAmount
                        )}
                      </strong>
                      .
                    </p>

                  </div>
                )}


              {paymentMethod ===
                'partial' &&
                remainingAmount > 0 && (
                  <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4">

                    <p className="text-sm font-semibold text-orange-800">
                      Pembayaran Partial
                    </p>

                    <p className="mt-1 text-sm text-orange-700">
                      Pembayaran baru
                      sebagian dan masih
                      tersisa{' '}
                      <strong>
                        {formatRupiah(
                          remainingAmount
                        )}
                      </strong>
                      .
                    </p>

                  </div>
                )}


              {(paymentMethod ===
                'qris' ||
                paymentMethod ===
                  'transfer') &&
                paymentStatus ===
                  'pending' && (
                  <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">

                    <p className="text-sm font-semibold text-yellow-800">
                      Menunggu Konfirmasi
                    </p>

                    <p className="mt-1 text-sm text-yellow-700">
                      Pembayaran belum
                      dikonfirmasi oleh
                      admin.
                    </p>

                  </div>
                )}

            </div>

          </div>

        </div>


        {/* Payment History */}

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-5 py-4">

            <div className="flex items-center gap-2">

              <History
                size={19}
                className="text-gray-600"
              />

              <h2 className="font-semibold text-gray-900">
                Riwayat Pembayaran
              </h2>

            </div>

          </div>


          {paymentHistories.length ===
          0 ? (
            <div className="px-5 py-10 text-center">

              <History
                size={32}
                className="mx-auto text-gray-300"
              />

              <p className="mt-3 text-sm text-gray-500">
                Belum ada riwayat
                pembayaran.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="min-w-full">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      #
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Tanggal
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Metode
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Petugas
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Catatan
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Nominal
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-gray-100">

                  {paymentHistories.map(
                    (history, index) => {

                      const historyUser =
                        history.user?.name ||
                        history.user_name ||
                        '-'

                      return (
                        <tr
                          key={
                            history.id ||
                            index
                          }
                          className="hover:bg-gray-50"
                        >

                          <td className="px-5 py-4 text-sm text-gray-500">
                            {index + 1}
                          </td>


                          <td className="px-5 py-4 text-sm text-gray-700">
                            {formatDate(
                              history.payment_date ||
                                history.created_at
                            )}
                          </td>


                          <td className="px-5 py-4">

                            <span
                              className={
                                'inline-flex rounded-full border px-3 py-1 text-xs font-medium ' +
                                getPaymentMethodClass(
                                  history.payment_method
                                )
                              }
                            >
                              {getPaymentMethodLabel(
                                history.payment_method
                              )}
                            </span>

                          </td>


                          <td className="px-5 py-4 text-sm text-gray-700">
                            {historyUser}
                          </td>


                          <td className="px-5 py-4 text-sm text-gray-600">
                            {history.note ||
                              '-'}
                          </td>


                          <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900">
                            {formatRupiah(
                              history.amount
                            )}
                          </td>

                        </tr>
                      )
                    }
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


/*
|--------------------------------------------------------------------------
| IMPORTANT
|--------------------------------------------------------------------------
*/

export default TransactionDetail