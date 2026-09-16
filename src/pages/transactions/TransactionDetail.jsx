import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'

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

/*
|--------------------------------------------------------------------------
| Helper Transaction
|--------------------------------------------------------------------------
*/

function getTransactionNumber(data) {
  return (
    data?.transaction?.transaction_number ??
    data?.transaction?.transaction_no ??
    data?.transaction?.transaction_code ??
    data?.transaction?.invoice_number ??
    data?.transaction_number ??
    data?.transaction_no ??
    data?.transaction_code ??
    data?.invoice_number ??
    data?.invoice_no ??
    data?.invoice ??
    data?.code ??
    data?.number ??
    '-'
  )
}

function getTransactionDate(data) {
  return (
    data?.transaction?.transaction_date ??
    data?.transaction?.created_at ??
    data?.transaction?.transaction_at ??
    data?.transaction?.date ??
    data?.created_at ??
    data?.transaction_date ??
    data?.transaction_at ??
    data?.date ??
    null
  )
}

function getCashierName(data) {
  return (
    data?.transaction?.user?.name ??
    data?.transaction?.cashier?.name ??
    data?.transaction?.cashier_name ??
    data?.transaction?.user_name ??
    data?.user?.name ??
    data?.cashier?.name ??
    data?.cashier_name ??
    data?.user_name ??
    'Kasir'
  )
}

function getCustomer(data) {
  return (
    data?.customer ??
    data?.transaction?.customer ??
    null
  )
}

function getTransactionStatus(data) {
  return (
    data?.status ??
    data?.transaction?.status ??
    'Selesai'
  )
}

function getItems(data) {
  return (
    data?.details ??
    data?.items ??
    data?.transaction_details ??
    data?.transactionDetails ??
    data?.details_transaction ??
    data?.transaction?.details ??
    data?.transaction?.items ??
    data?.transaction?.transaction_details ??
    data?.transaction?.transactionDetails ??
    []
  )
}

function getTransactionTotal(data, items = []) {
  const value =
    data?.total ??
    data?.grand_total ??
    data?.total_amount ??
    data?.total_price ??
    data?.amount ??
    data?.grandTotal ??
    data?.totalAmount ??
    data?.transaction?.total ??
    data?.transaction?.grand_total ??
    data?.transaction?.total_amount ??
    data?.transaction?.total_price ??
    data?.transaction?.amount

  if (
    value !== null &&
    value !== undefined &&
    value !== ''
  ) {
    const number = Number(value)

    if (!Number.isNaN(number) && number >= 0) {
      return number
    }
  }

  return items.reduce(
    (sum, item) => sum + getItemSubtotal(item),
    0
  )
}

function getTransactionPaid(data) {
  const value =
    data?.summary?.paid ??
    data?.summary?.payment ??
    data?.summary?.paid_amount ??
    data?.summary?.payment_amount ??
    data?.summary?.amount_paid ??
    data?.paid ??
    data?.payment ??
    data?.paid_amount ??
    data?.payment_amount ??
    data?.amount_paid ??
    data?.amountPaid ??
    data?.transaction?.paid ??
    data?.transaction?.payment ??
    data?.transaction?.paid_amount ??
    data?.transaction?.payment_amount ??
    data?.transaction?.amount_paid

  if (
    value !== null &&
    value !== undefined &&
    value !== ''
  ) {
    const number = Number(value)

    if (!Number.isNaN(number)) {
      return number
    }
  }

  return 0
}

function getTransactionChange(data, total, paid) {
  const value =
    data?.summary?.change ??
    data?.summary?.change_amount ??
    data?.summary?.change_money ??
    data?.summary?.changeAmount ??
    data?.summary?.kembalian ??
    data?.change ??
    data?.change_amount ??
    data?.change_money ??
    data?.changeAmount ??
    data?.kembalian ??
    data?.transaction?.change ??
    data?.transaction?.change_amount ??
    data?.transaction?.change_money ??
    data?.transaction?.changeAmount ??
    data?.transaction?.kembalian

  if (
    value !== null &&
    value !== undefined &&
    value !== ''
  ) {
    const number = Number(value)

    if (!Number.isNaN(number)) {
      return number
    }
  }

  return Math.max(paid - total, 0)
}

/*
|--------------------------------------------------------------------------
| Helper Item
|--------------------------------------------------------------------------
*/

function getProductId(item) {
  return (
    item?.product_id ??
    item?.productId ??
    item?.product?.id ??
    item?.product?.product_id ??
    null
  )
}

function getProductName(item) {
  if (typeof item?.product === 'string') {
    return item.product
  }

  return (
    item?.product?.name ??
    item?.product_name ??
    item?.productName ??
    item?.name ??
    item?.product?.product_name ??
    item?.product?.productName ??
    '-'
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
    item?.unitName ??
    item?.unit?.symbol ??
    item?.symbol ??
    item?.product_unit?.unit?.name ??
    item?.product_unit?.unit?.symbol ??
    item?.productUnit?.unit?.name ??
    item?.productUnit?.unit?.symbol ??
    '-'
  )
}

function getItemQuantity(item) {
  return Number(
    item?.quantity ??
    item?.qty ??
    item?.amount ??
    0
  )
}

function getItemPrice(item) {
  const directPrice =
    item?.unit_price ??
    item?.price ??
    item?.selling_price ??
    item?.price_per_unit ??
    item?.unitPrice ??
    item?.sellingPrice ??
    item?.pricePerUnit ??
    item?.product_unit?.selling_price ??
    item?.product_unit?.price ??
    item?.productUnit?.selling_price ??
    item?.productUnit?.price ??
    item?.product?.selling_price ??
    item?.product?.price

  if (
    directPrice !== null &&
    directPrice !== undefined &&
    directPrice !== ''
  ) {
    const number = Number(directPrice)

    if (!Number.isNaN(number)) {
      return number
    }
  }

  const qty = getItemQuantity(item)

  const subtotal = Number(
    item?.subtotal ??
    item?.total ??
    item?.sub_total ??
    item?.amount ??
    0
  )

  if (qty > 0 && subtotal > 0) {
    return subtotal / qty
  }

  return 0
}

function getItemSubtotal(item) {
  const subtotal =
    item?.subtotal ??
    item?.sub_total ??
    item?.total ??
    item?.amount

  if (
    subtotal !== null &&
    subtotal !== undefined &&
    subtotal !== ''
  ) {
    const number = Number(subtotal)

    if (!Number.isNaN(number)) {
      return number
    }
  }

  return (
    getItemQuantity(item) *
    getItemPrice(item)
  )
}

/*
|--------------------------------------------------------------------------
| Helper Date
|--------------------------------------------------------------------------
*/

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
| Ambil Data Produk Untuk Item Yang Belum Memiliki Nama
|--------------------------------------------------------------------------
*/

async function enrichItemsWithProducts(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return []
  }

  const productIds = [
    ...new Set(
      items
        .map((item) => getProductId(item))
        .filter(Boolean)
    ),
  ]

  if (productIds.length === 0) {
    return items
  }

  const productsById = {}

  await Promise.all(
    productIds.map(async (productId) => {
      try {
        const response = await api.get(
          `/products/${productId}`
        )

        const responseData =
          response.data?.data ??
          response.data

        const product =
          responseData?.product ??
          responseData

        if (product?.id) {
          productsById[product.id] =
            product
        } else {
          productsById[productId] =
            product
        }

      } catch (error) {
        console.error(
          `Gagal mengambil produk ${productId}:`,
          error
        )
      }
    })
  )

  return items.map((item) => {
    const productId =
      getProductId(item)

    const existingName =
      getProductName(item)

    const product =
      productsById[productId]

    if (!product) {
      return item
    }

    return {
      ...item,

      product: {
        ...(item.product || {}),
        ...product,
      },

      product_name:
        existingName ||
        product.name ||
        product.product_name ||
        '',

      brand:
        getProductBrand(item) ||
        product.brand ||
        '',

      size:
        getProductSize(item) ||
        product.size ||
        '',

      unit:
        item.unit ||
        product.base_unit ||
        product.unit ||
        null,
    }
  })
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function TransactionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [printing, setPrinting] = useState(false)

  /*
  |--------------------------------------------------------------------------
  | Fetch Detail
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
        response.data?.data ||
        response.data

      const items =
        getItems(data)

      const enrichedItems =
        await enrichItemsWithProducts(items)

      const enrichedData = {
        ...data,
        items: enrichedItems,
        details: enrichedItems,
      }

      setTransaction(enrichedData)

    } catch (err) {
      console.error(
        'DETAIL TRANSACTION ERROR:',
        err
      )

      setError(
        err.response?.data?.message ||
          'Gagal mengambil detail transaksi.'
      )
    } finally {
      setLoading(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Reprint
  |--------------------------------------------------------------------------
  */

  const handleReprint = async () => {
    try {
      setPrinting(true)
      setError('')

      const response = await api.get(
        `/transactions/${id}/reprint`
      )

      console.log(
        'REPRINT RESPONSE:',
        JSON.stringify(response.data, null, 2)
      )

      const data =
        response.data?.data ||
        response.data

      const items =
        getItems(data)

      const enrichedItems =
        await enrichItemsWithProducts(items)

      const enrichedData = {
        ...data,
        items: enrichedItems,
        details: enrichedItems,
      }

      printReceipt(enrichedData)

    } catch (err) {
      console.error(
        'REPRINT ERROR:',
        err
      )

      setError(
        err.response?.data?.message ||
          'Gagal mencetak ulang struk.'
      )
    } finally {
      setPrinting(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Print Receipt
  |--------------------------------------------------------------------------
  */

  const printReceipt = (data) => {
    console.log(
      'PRINT RAW DATA:',
      JSON.stringify(data, null, 2)
    )

    const items =
      getItems(data)

    const total =
      getTransactionTotal(
        data,
        items
      )

    const paid =
      getTransactionPaid(data)

    const change =
      getTransactionChange(
        data,
        total,
        paid
      )

    const transactionNumber =
      getTransactionNumber(data)

    const transactionDate =
      getTransactionDate(data)

    const cashierName =
      getCashierName(data)

    console.log(
      'PRINT DATA:',
      {
        transactionNumber,
        transactionDate,
        cashierName,
        items,
        total,
        paid,
        change,
      }
    )

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

    const itemsHtml =
      items
        .map((item) => {
          const productName =
            getProductName(item) ||
            'Produk'

          const brand =
            getProductBrand(item)

          const size =
            getProductSize(item)

          const unitName =
            getUnitName(item)

          const quantity =
            getItemQuantity(item)

          const price =
            getItemPrice(item)

          const subtotal =
            getItemSubtotal(item)

          let productDescription =
            productName

          if (brand) {
            productDescription +=
              ` - ${brand}`
          }

          if (size) {
            productDescription +=
              ` (${size})`
          }

          return `
            <tr>
              <td colspan="3" class="product-name">
                ${productDescription}
              </td>
            </tr>

            <tr>
              <td>
                ${formatQuantity(quantity)}
                ${unitName}
              </td>

              <td>
                ${formatRupiah(price)}
              </td>

              <td style="text-align:right">
                ${formatRupiah(subtotal)}
              </td>
            </tr>
          `
        })
        .join('')

    receiptWindow.document.write(`
      <!DOCTYPE html>

      <html>
        <head>

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
              BUILDPOS
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
            Tanggal: ${formatDate(
              transactionDate
            )}
          </div>

          <div>
            Kasir: ${cashierName}
          </div>

          <div class="line"></div>

          <table>
            ${itemsHtml}
          </table>

          <div class="line"></div>

          <table>

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
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          Memuat detail transaksi...
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
        <div className="space-y-4">

          <button
            type="button"
            onClick={() =>
              navigate('/transactions')
            }
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Kembali ke Riwayat
          </button>

          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-600">
            {error}
          </div>

        </div>
      </DashboardLayout>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Transaction Data
  |--------------------------------------------------------------------------
  */

  const items =
    getItems(transaction)

  const total =
    getTransactionTotal(
      transaction,
      items
    )

  const paid =
    getTransactionPaid(
      transaction
    )

  const change =
    getTransactionChange(
      transaction,
      total,
      paid
    )

  const transactionNumber =
    getTransactionNumber(
      transaction
    )

  const transactionDate =
    getTransactionDate(
      transaction
    )

  const cashierName =
    getCashierName(
      transaction
    )

  const customer =
    getCustomer(transaction)

  const status =
    getTransactionStatus(
      transaction
    )

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <DashboardLayout>

      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <button
              type="button"
              onClick={() =>
                navigate('/transactions')
              }
              className="mb-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← Kembali ke Riwayat
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
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {printing
              ? 'Menyiapkan...'
              : '🖨 Cetak Struk'}
          </button>

        </div>

        {/* Error */}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Info */}

        <div className="grid gap-5 md:grid-cols-3">

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Nomor Transaksi
            </p>

            <p className="mt-2 font-bold text-gray-900">
              {transactionNumber}
            </p>

          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Tanggal
            </p>

            <p className="mt-2 font-semibold text-gray-900">
              {formatDate(
                transactionDate
              )}
            </p>

          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Status
            </p>

            <span className="mt-2 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              {status}
            </span>

          </div>

        </div>

        {/* Customer & Cashier */}

        <div className="grid gap-5 md:grid-cols-2">

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm font-semibold text-gray-500">
              Pelanggan
            </p>

            <p className="mt-2 text-lg font-bold text-gray-900">
              {customer?.name ||
                'Pelanggan Umum'}
            </p>

            {customer?.phone && (
              <p className="mt-1 text-sm text-gray-500">
                {customer.phone}
              </p>
            )}

          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm font-semibold text-gray-500">
              Kasir
            </p>

            <p className="mt-2 text-lg font-bold text-gray-900">
              {cashierName}
            </p>

          </div>

        </div>

        {/* Items */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 p-5">

            <h2 className="font-bold text-gray-900">
              Barang yang Dibeli
            </h2>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px] text-sm">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-5 py-4 text-left">
                    Barang
                  </th>

                  <th className="px-5 py-4 text-center">
                    Qty
                  </th>

                  <th className="px-5 py-4 text-right">
                    Harga
                  </th>

                  <th className="px-5 py-4 text-right">
                    Subtotal
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {items.length === 0 ? (

                  <tr>

                    <td
                      colSpan="4"
                      className="px-5 py-10 text-center text-gray-500"
                    >
                      Detail barang tidak tersedia.
                    </td>

                  </tr>

                ) : (

                  items.map(
                    (item, index) => {

                      const name =
                        getProductName(item) ||
                        'Produk'

                      const brand =
                        getProductBrand(item)

                      const size =
                        getProductSize(item)

                      const unit =
                        getUnitName(item)

                      const qty =
                        getItemQuantity(item)

                      const price =
                        getItemPrice(item)

                      const subtotal =
                        getItemSubtotal(item)

                      return (
                        <tr
                          key={
                            item.id ||
                            index
                          }
                        >

                          <td className="px-5 py-4">

                            <p className="font-medium text-gray-900">
                              {name}
                            </p>

                            {(brand || size) && (
                              <p className="mt-1 text-xs text-gray-500">

                                {brand && (
                                  <>
                                    {brand}
                                  </>
                                )}

                                {brand && size && (
                                  <span className="mx-1">
                                    •
                                  </span>
                                )}

                                {size && (
                                  <>
                                    {size}
                                  </>
                                )}

                              </p>
                            )}

                          </td>

                          <td className="px-5 py-4 text-center text-gray-600">
                            {formatQuantity(qty)}{' '}
                            {unit}
                          </td>

                          <td className="px-5 py-4 text-right text-gray-600">
                            {formatRupiah(
                              price
                            )}
                          </td>

                          <td className="px-5 py-4 text-right font-semibold text-gray-900">
                            {formatRupiah(
                              subtotal
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

        <div className="ml-auto max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex justify-between py-2">

            <span className="text-gray-500">
              Total
            </span>

            <span className="font-bold text-gray-900">
              {formatRupiah(total)}
            </span>

          </div>

          <div className="flex justify-between py-2">

            <span className="text-gray-500">
              Pembayaran
            </span>

            <span className="font-semibold text-gray-900">
              {formatRupiah(paid)}
            </span>

          </div>

          <div className="my-2 border-t border-gray-200" />

          <div className="flex justify-between py-2">

            <span className="font-semibold text-gray-700">
              Kembalian
            </span>

            <span className="text-lg font-bold text-green-600">
              {formatRupiah(change)}
            </span>

          </div>

        </div>

      </div>

    </DashboardLayout>
  )
}