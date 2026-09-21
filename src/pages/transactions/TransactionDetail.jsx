import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  Printer,
  RefreshCw,
  User,
  UserRound,
  XCircle,
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function formatQuantity(value) {
  const number = Number(value ?? 0)

  if (Number.isInteger(number)) {
    return number.toString()
  }

  return number.toLocaleString('id-ID', {
    maximumFractionDigits: 3,
  })
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/*
|--------------------------------------------------------------------------
| Payment Method
|--------------------------------------------------------------------------
*/

function getPaymentMethodLabel(method) {
  const methods = {
    cash: 'Cash',
    qris: 'QRIS',
    transfer: 'Transfer',
  }

  return methods[method] || method || '-'
}

function getPaymentMethodDescription(method) {
  const descriptions = {
    cash: 'Pembayaran tunai',
    qris: 'Pembayaran melalui QRIS',
    transfer: 'Pembayaran melalui transfer bank',
  }

  return descriptions[method] || 'Metode pembayaran'
}

function getPaymentMethodIcon(method) {
  if (method === 'cash') {
    return '💵'
  }

  if (method === 'qris') {
    return '📱'
  }

  if (method === 'transfer') {
    return '🏦'
  }

  return '💳'
}

/*
|--------------------------------------------------------------------------
| Payment Status
|--------------------------------------------------------------------------
*/

function getPaymentStatusLabel(status) {
  const statuses = {
    completed: 'Sudah Dibayar',
    pending: 'Menunggu Pembayaran',
    cancelled: 'Dibatalkan',
  }

  return statuses[status] || status || '-'
}

function getPaymentStatusStyle(status) {
  if (status === 'completed') {
    return {
      wrapper: 'border-green-200 bg-green-50',
      icon: 'bg-green-100 text-green-600',
      text: 'text-green-700',
    }
  }

  if (status === 'pending') {
    return {
      wrapper: 'border-yellow-200 bg-yellow-50',
      icon: 'bg-yellow-100 text-yellow-600',
      text: 'text-yellow-700',
    }
  }

  if (status === 'cancelled') {
    return {
      wrapper: 'border-red-200 bg-red-50',
      icon: 'bg-red-100 text-red-600',
      text: 'text-red-700',
    }
  }

  return {
    wrapper: 'border-gray-200 bg-gray-50',
    icon: 'bg-gray-100 text-gray-600',
    text: 'text-gray-700',
  }
}

/*
|--------------------------------------------------------------------------
| Transaction Status
|--------------------------------------------------------------------------
*/

function getTransactionStatusLabel(status) {
  const statuses = {
    completed: 'Selesai',
    pending: 'Pending',
    cancelled: 'Dibatalkan',
  }

  return statuses[status] || status || '-'
}

function getTransactionStatusStyle(status) {
  if (status === 'completed') {
    return 'bg-green-100 text-green-700'
  }

  if (status === 'pending') {
    return 'bg-yellow-100 text-yellow-700'
  }

  if (status === 'cancelled') {
    return 'bg-red-100 text-red-700'
  }

  return 'bg-gray-100 text-gray-700'
}

/*
|--------------------------------------------------------------------------
| Product / Item Helper
|--------------------------------------------------------------------------
*/

function getProductName(item) {
  return (
    item?.product?.name ??
    item?.product_name ??
    item?.name ??
    'Produk'
  )
}

function getProductBrand(item) {
  return (
    item?.product?.brand ??
    item?.brand ??
    ''
  )
}

function getProductSize(item) {
  return (
    item?.product?.size ??
    item?.size ??
    ''
  )
}

function getUnitName(item) {
  return (
    item?.unit?.name ??
    item?.unit_name ??
    item?.product_unit?.unit?.name ??
    '-'
  )
}

function getUnitSymbol(item) {
  return (
    item?.unit?.symbol ??
    item?.symbol ??
    ''
  )
}

function getItemQuantity(item) {
  return Number(
    item?.quantity ??
    item?.qty ??
    0
  )
}

function getItemPrice(item) {
  return Number(
    item?.unit_price ??
    item?.price ??
    item?.selling_price ??
    0
  )
}

function getItemSubtotal(item) {
  return Number(
    item?.subtotal ??
    item?.sub_total ??
    0
  )
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function TransactionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  /*
  |--------------------------------------------------------------------------
  | Fetch Transaction
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchTransaction()
  }, [id])

  const fetchTransaction = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get(
        `/transactions/${id}`
      )

      console.log(
        'TRANSACTION DETAIL:',
        JSON.stringify(response.data, null, 2)
      )

      const data =
        response.data?.data?.transaction ??
        response.data?.data ??
        response.data?.transaction ??
        response.data

      /*
       * PENTING:
       * Data transaksi disimpan ke state.
       * Jangan panggil printReceipt() di sini.
       */
      setTransaction(data)

    } catch (err) {
      console.error(
        'DETAIL TRANSACTION ERROR:',
        err
      )

      setError(
        err.response?.data?.message ??
        'Gagal mengambil detail transaksi.'
      )
    } finally {
      setLoading(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Confirm Payment
  |--------------------------------------------------------------------------
  */

  const handleConfirmPayment = async () => {
    if (!transaction) {
      return
    }

    const paymentMethod =
      transaction.payment_method

    if (
      paymentMethod !== 'qris' &&
      paymentMethod !== 'transfer'
    ) {
      return
    }

    if (
      transaction.payment_status === 'completed'
    ) {
      return
    }

    const confirmed = window.confirm(
      `Konfirmasi bahwa pembayaran ${getPaymentMethodLabel(
        paymentMethod
      )} untuk transaksi ini sudah diterima?`
    )

    if (!confirmed) {
      return
    }

    try {
      setConfirming(true)
      setError('')
      setSuccess('')

      const response = await api.post(
        `/transactions/${id}/confirm-payment`
      )

      console.log(
        'CONFIRM PAYMENT:',
        JSON.stringify(response.data, null, 2)
      )

      setSuccess(
        response.data?.message ??
        'Pembayaran berhasil dikonfirmasi.'
      )

      await fetchTransaction()

    } catch (err) {
      console.error(
        'CONFIRM PAYMENT ERROR:',
        err
      )

      setError(
        err.response?.data?.message ??
        'Gagal mengonfirmasi pembayaran.'
      )
    } finally {
      setConfirming(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Reprint
  |--------------------------------------------------------------------------
  */

  const handleReprint = () => {
    if (!transaction) {
      setError('Data transaksi belum tersedia.')
      return
    }

    setPrinting(true)
    setError('')
    setSuccess('')

    console.log(
      'DATA TRANSAKSI UNTUK PRINT:',
      JSON.stringify(transaction, null, 2)
    )

    /*
     * Gunakan data transaction yang sudah dipakai
     * oleh halaman Detail Transaksi.
     *
     * Jadi data barang, subtotal, total, kasir,
     * pelanggan, dan pembayaran tetap ikut tercetak.
     */
    printReceipt(transaction)

    setTimeout(() => {
      setPrinting(false)
    }, 500)
  }

  /*
  |--------------------------------------------------------------------------
  | Print Receipt
  |--------------------------------------------------------------------------
  */

  const printReceipt = (data) => {
    const items =
      data?.details ??
      data?.items ??
      []

    const transactionNumber =
      data?.transaction_number ??
      '-'

    const transactionDate =
      data?.transaction_date ??
      data?.created_at

    const cashierName =
      data?.user?.name ??
      data?.cashier?.name ??
      'Kasir'

    const customerName =
      data?.customer?.name ??
      'Pelanggan Umum'

    const subtotal =
      Number(data?.subtotal ?? 0)

    const discount =
      Number(data?.discount ?? 0)

    const total =
      Number(data?.total ?? 0)

    const paid =
      Number(data?.paid ?? 0)

    const change =
      Number(data?.change ?? 0)

    const paymentMethod =
      data?.payment_method

    const paymentStatus =
      data?.payment_status

    const receiptWindow =
      window.open(
        '',
        '_blank',
        'width=400,height=700'
      )

    if (!receiptWindow) {
      setError(
        'Popup diblokir browser. Izinkan popup untuk mencetak struk.'
      )

      return
    }

    const itemsHtml = items
      .map((item) => {
        const name =
          getProductName(item)

        const brand =
          getProductBrand(item)

        const size =
          getProductSize(item)

        const unit =
          getUnitName(item)

        const symbol =
          getUnitSymbol(item)

        const quantity =
          getItemQuantity(item)

        const price =
          getItemPrice(item)

        const itemSubtotal =
          getItemSubtotal(item)

        let productDescription =
          name

        if (brand) {
          productDescription +=
            ` - ${brand}`
        }

        if (size) {
          productDescription +=
            ` (${size})`
        }

        const unitDisplay =
          symbol
            ? `${unit} (${symbol})`
            : unit

        return `
          <tr>
            <td colspan="3" class="product-name">
              ${productDescription}
            </td>
          </tr>

          <tr>
            <td>
              ${formatQuantity(quantity)}
              ${unitDisplay}
            </td>

            <td>
              ${formatRupiah(price)}
            </td>

            <td style="text-align:right">
              ${formatRupiah(itemSubtotal)}
            </td>
          </tr>
        `
      })
      .join('')

    receiptWindow.document.write(`
      <!DOCTYPE html>

      <html>
        <head>

          <meta charset="UTF-8" />

          <title>
            Struk ${transactionNumber}
          </title>

          <style>

            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              width: 80mm;
              margin: 0 auto;
              padding: 10px;
              font-size: 12px;
              color: #000;
            }

            .center {
              text-align: center;
            }

            .title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }

            .line {
              border-top: 1px dashed #000;
              margin: 8px 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            td {
              padding: 3px 0;
              vertical-align: top;
            }

            .product-name {
              font-weight: bold;
              padding-top: 5px;
              padding-bottom: 1px;
            }

            .total td {
              font-weight: bold;
              font-size: 14px;
            }

            .footer {
              margin-top: 15px;
              text-align: center;
            }

            .payment {
              margin-top: 8px;
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

            <div class="title">
              Toko Setia Nugraha
            </div>

            <div>
              Toko Material
            </div>

          </div>

          <div class="line"></div>

          <div>
            No: ${transactionNumber}
          </div>

          <div>
            Tanggal: ${formatDate(transactionDate)}
          </div>

          <div>
            Kasir: ${cashierName}
          </div>

          <div>
            Pelanggan: ${customerName}
          </div>

          <div class="line"></div>

          <table>
            ${itemsHtml}
          </table>

          <div class="line"></div>

          <table>

            <tr>
              <td>
                Subtotal
              </td>

              <td style="text-align:right">
                ${formatRupiah(subtotal)}
              </td>
            </tr>

            <tr>
              <td>
                Diskon
              </td>

              <td style="text-align:right">
                ${formatRupiah(discount)}
              </td>
            </tr>

            <tr class="total">

              <td>
                Total
              </td>

              <td style="text-align:right">
                ${formatRupiah(total)}
              </td>

            </tr>

            <tr>

              <td>
                Pembayaran
              </td>

              <td style="text-align:right">
                ${getPaymentMethodLabel(paymentMethod)}
              </td>

            </tr>

            <tr>

              <td>
                Status
              </td>

              <td style="text-align:right">
                ${getPaymentStatusLabel(paymentStatus)}
              </td>

            </tr>

            <tr>

              <td>
                Bayar
              </td>

              <td style="text-align:right">
                ${formatRupiah(paid)}
              </td>

            </tr>

            <tr>

              <td>
                Kembalian
              </td>

              <td style="text-align:right">
                ${formatRupiah(change)}
              </td>

            </tr>

          </table>

          <div class="footer">
            Terima kasih telah berbelanja.
          </div>

        </body>

      </html>
    `)

    receiptWindow.document.close()

    setTimeout(() => {
      receiptWindow.focus()
      receiptWindow.print()
    }, 300)
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <DashboardLayout>

        <div className="mx-auto max-w-5xl">

          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin text-blue-600" />

            <p className="text-sm text-gray-500">
              Memuat detail transaksi...
            </p>

          </div>

        </div>

      </DashboardLayout>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (error && !transaction) {
    return (
      <DashboardLayout>

        <div className="mx-auto max-w-5xl space-y-4">

          <button
            type="button"
            onClick={() =>
              navigate('/transactions')
            }
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />

            Kembali ke Riwayat
          </button>

          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
            {error}
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
  | Transaction Data
  |--------------------------------------------------------------------------
  */

  const transactionNumber =
    transaction.transaction_number

  const transactionDate =
    transaction.transaction_date ??
    transaction.created_at

  const cashier =
    transaction.user

  const customer =
    transaction.customer

  const items =
    transaction.details ?? []

  const subtotal =
    Number(transaction.subtotal ?? 0)

  const discount =
    Number(transaction.discount ?? 0)

  const total =
    Number(transaction.total ?? 0)

  const paid =
    Number(transaction.paid ?? 0)

  const change =
    Number(transaction.change ?? 0)

  const paymentMethod =
    transaction.payment_method

  const paymentStatus =
    transaction.payment_status

  const transactionStatus =
    transaction.status

  const isPendingPayment =
    paymentStatus === 'pending'

  const canConfirmPayment =
    user?.role === 'admin' &&
    isPendingPayment &&
    (
      paymentMethod === 'qris' ||
      paymentMethod === 'transfer'
    )

  const paymentStyle =
    getPaymentStatusStyle(
      paymentStatus
    )

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <DashboardLayout>

      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <button
              type="button"
              onClick={() =>
                navigate('/transactions')
              }
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />

              Kembali ke Riwayat
            </button>

            <h1 className="text-2xl font-bold text-gray-900">
              Detail Transaksi
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {transactionNumber}
            </p>

          </div>

          <button
            type="button"
            onClick={handleReprint}
            disabled={printing}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {printing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />

                Menyiapkan...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4" />

                Cetak Struk
              </>
            )}
          </button>

        </div>

        {/* Success */}

        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

            <CheckCircle2 className="h-5 w-5 shrink-0" />

            <span>
              {success}
            </span>

          </div>
        )}

        {/* Error */}

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

            <XCircle className="h-5 w-5 shrink-0" />

            <span>
              {error}
            </span>

          </div>
        )}

        {/* Basic Information */}

        <div className="grid gap-5 md:grid-cols-3">

          {/* Transaction Number */}

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Nomor Transaksi
            </p>

            <p className="mt-2 break-all font-bold text-gray-900">
              {transactionNumber}
            </p>

          </div>

          {/* Date */}

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Tanggal Transaksi
            </p>

            <p className="mt-2 font-semibold text-gray-900">
              {formatDate(transactionDate)}
            </p>

          </div>

          {/* Transaction Status */}

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Status Transaksi
            </p>

            <span
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getTransactionStatusStyle(
                transactionStatus
              )}`}
            >
              {getTransactionStatusLabel(
                transactionStatus
              )}
            </span>

          </div>

        </div>

        {/* Customer & Cashier */}

        <div className="grid gap-5 md:grid-cols-2">

          {/* Customer */}

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">

                <UserRound className="h-5 w-5" />

              </div>

              <div>

                <p className="text-sm text-gray-500">
                  Pelanggan
                </p>

                <p className="font-bold text-gray-900">
                  {customer?.name ??
                    'Pelanggan Umum'}
                </p>

              </div>

            </div>

            {customer?.phone && (
              <p className="mt-4 text-sm text-gray-500">
                No. HP: {customer.phone}
              </p>
            )}

          </div>

          {/* Cashier */}

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">

                <User className="h-5 w-5" />

              </div>

              <div>

                <p className="text-sm text-gray-500">
                  Kasir
                </p>

                <p className="font-bold text-gray-900">
                  {cashier?.name ??
                    'Kasir'}
                </p>

              </div>

            </div>

            {cashier?.email && (
              <p className="mt-4 text-sm text-gray-500">
                {cashier.email}
              </p>
            )}

          </div>

        </div>

        {/* Payment Information */}

        <div className="grid gap-5 md:grid-cols-2">

          {/* Payment Method */}

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-2xl">

                {getPaymentMethodIcon(
                  paymentMethod
                )}

              </div>

              <div className="min-w-0">

                <p className="text-sm text-gray-500">
                  Metode Pembayaran
                </p>

                <p className="mt-1 text-xl font-bold text-gray-900">
                  {getPaymentMethodLabel(
                    paymentMethod
                  )}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {getPaymentMethodDescription(
                    paymentMethod
                  )}
                </p>

              </div>

            </div>

          </div>

          {/* Payment Status */}

          <div
            className={`rounded-xl border p-5 shadow-sm ${paymentStyle.wrapper}`}
          >

            <div className="flex items-start gap-4">

              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${paymentStyle.icon}`}
              >

                {paymentStatus === 'completed' ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : paymentStatus === 'pending' ? (
                  <Clock3 className="h-6 w-6" />
                ) : (
                  <XCircle className="h-6 w-6" />
                )}

              </div>

              <div>

                <p className="text-sm text-gray-500">
                  Status Pembayaran
                </p>

                <p
                  className={`mt-1 text-xl font-bold ${paymentStyle.text}`}
                >
                  {getPaymentStatusLabel(
                    paymentStatus
                  )}
                </p>

                {isPendingPayment && (
                  <p className="mt-1 text-sm text-gray-600">
                    Menunggu konfirmasi pembayaran dari admin.
                  </p>
                )}

              </div>

            </div>

          </div>

        </div>

        {/* Confirm Payment */}

        {canConfirmPayment && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>

                <h2 className="font-bold text-yellow-900">
                  Pembayaran Menunggu Konfirmasi
                </h2>

                <p className="mt-1 text-sm text-yellow-800">
                  Pastikan pembayaran{' '}
                  {getPaymentMethodLabel(
                    paymentMethod
                  )}{' '}
                  sudah benar-benar diterima sebelum dikonfirmasi.
                </p>

              </div>

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={confirming}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {confirming ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />

                    Mengonfirmasi...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />

                    Konfirmasi Pembayaran
                  </>
                )}
              </button>

            </div>

          </div>
        )}

        {/* Items */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 p-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">

                <CreditCard className="h-5 w-5" />

              </div>

              <div>

                <h2 className="font-bold text-gray-900">
                  Barang yang Dibeli
                </h2>

                <p className="text-sm text-gray-500">
                  {items.length} jenis barang
                </p>

              </div>

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[750px] text-sm">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-5 py-4 text-left font-semibold text-gray-600">
                    #
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-gray-600">
                    Barang
                  </th>

                  <th className="px-5 py-4 text-center font-semibold text-gray-600">
                    Qty
                  </th>

                  <th className="px-5 py-4 text-right font-semibold text-gray-600">
                    Harga
                  </th>

                  <th className="px-5 py-4 text-right font-semibold text-gray-600">
                    Subtotal
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {items.length === 0 ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="px-5 py-10 text-center text-gray-500"
                    >
                      Detail barang tidak tersedia.
                    </td>

                  </tr>

                ) : (

                  items.map(
                    (item, index) => {

                      const name =
                        getProductName(item)

                      const brand =
                        getProductBrand(item)

                      const size =
                        getProductSize(item)

                      const unitName =
                        getUnitName(item)

                      const unitSymbol =
                        getUnitSymbol(item)

                      const quantity =
                        getItemQuantity(item)

                      const price =
                        getItemPrice(item)

                      const itemSubtotal =
                        getItemSubtotal(item)

                      return (
                        <tr
                          key={
                            item.id ??
                            index
                          }
                          className="hover:bg-gray-50"
                        >

                          <td className="px-5 py-4 text-gray-500">
                            {index + 1}
                          </td>

                          <td className="px-5 py-4">

                            <p className="font-semibold text-gray-900">
                              {name}
                            </p>

                            {(brand || size) && (
                              <p className="mt-1 text-xs text-gray-500">

                                {brand && (
                                  <span>
                                    {brand}
                                  </span>
                                )}

                                {brand && size && (
                                  <span className="mx-1">
                                    •
                                  </span>
                                )}

                                {size && (
                                  <span>
                                    {size}
                                  </span>
                                )}

                              </p>
                            )}

                          </td>

                          <td className="px-5 py-4 text-center">

                            <span className="font-semibold text-gray-900">
                              {formatQuantity(
                                quantity
                              )}
                            </span>

                            <span className="ml-1 text-gray-500">
                              {unitSymbol ||
                                unitName}
                            </span>

                          </td>

                          <td className="px-5 py-4 text-right text-gray-600">
                            {formatRupiah(
                              price
                            )}
                          </td>

                          <td className="px-5 py-4 text-right font-semibold text-gray-900">
                            {formatRupiah(
                              itemSubtotal
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

        {/* Summary */}

        <div className="grid gap-5 md:grid-cols-2">

          {/* Payment Summary */}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <h2 className="mb-4 font-bold text-gray-900">
              Informasi Pembayaran
            </h2>

            <div className="space-y-3">

              <div className="flex items-center justify-between">

                <span className="text-gray-500">
                  Metode
                </span>

                <span className="font-semibold text-gray-900">
                  {getPaymentMethodLabel(
                    paymentMethod
                  )}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-gray-500">
                  Status
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentStyle.text} ${paymentStyle.wrapper}`}
                >
                  {getPaymentStatusLabel(
                    paymentStatus
                  )}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-gray-500">
                  Dibayar
                </span>

                <span className="font-semibold text-gray-900">
                  {formatRupiah(paid)}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-gray-500">
                  Kembalian
                </span>

                <span className="font-semibold text-green-600">
                  {formatRupiah(change)}
                </span>

              </div>

            </div>

          </div>

          {/* Total Summary */}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <h2 className="mb-4 font-bold text-gray-900">
              Ringkasan Transaksi
            </h2>

            <div className="space-y-3">

              <div className="flex justify-between">

                <span className="text-gray-500">
                  Subtotal
                </span>

                <span className="font-semibold text-gray-900">
                  {formatRupiah(subtotal)}
                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-gray-500">
                  Diskon
                </span>

                <span className="font-semibold text-gray-900">
                  {formatRupiah(discount)}
                </span>

              </div>

              <div className="my-3 border-t border-gray-200" />

              <div className="flex items-center justify-between">

                <span className="text-lg font-bold text-gray-900">
                  Total
                </span>

                <span className="text-2xl font-bold text-blue-600">
                  {formatRupiah(total)}
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

    </DashboardLayout>
  )
}