import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye,
  Plus,
  Search,
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'

export default function Transactions() {
  const navigate = useNavigate()

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/transactions')

      console.log('TRANSACTIONS RESPONSE:', response.data)

      const data = response.data.data

      setTransactions(
        Array.isArray(data)
          ? data
          : data?.data || []
      )
    } catch (err) {
      console.error('FETCH TRANSACTIONS ERROR:', err)

      setError(
        err.response?.data?.message ||
          'Gagal mengambil data transaksi'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const filteredTransactions = transactions.filter(
    (transaction) => {
      const keyword = search.toLowerCase()

      const transactionNumber = String(
        transaction.transaction_number || ''
      ).toLowerCase()

      const customerName = String(
        transaction.customer?.name || ''
      ).toLowerCase()

      const cashierName = String(
        transaction.user?.name ||
          transaction.cashier?.name ||
          ''
      ).toLowerCase()

      const productMatch = (
        transaction.details || []
      ).some((detail) => {
        const product = detail.product

        const productName = String(
          product?.name || ''
        ).toLowerCase()

        const brand = String(
          product?.brand || ''
        ).toLowerCase()

        const size = String(
          product?.size || ''
        ).toLowerCase()

        return (
          productName.includes(keyword) ||
          brand.includes(keyword) ||
          size.includes(keyword)
        )
      })

      return (
        transactionNumber.includes(keyword) ||
        customerName.includes(keyword) ||
        cashierName.includes(keyword) ||
        productMatch
      )
    }
  )

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(value || 0))
  }

  const formatQuantity = (value) => {
    const number = Number(value || 0)

    if (Number.isInteger(number)) {
      return number.toString()
    }

    return number.toLocaleString('id-ID', {
      maximumFractionDigits: 3,
    })
  }

  const formatDate = (value) => {
    if (!value) return '-'

    return new Date(value).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getProductName = (product) => {
    if (!product) return '-'

    const name = product.name || '-'
    const brand = product.brand
      ? ` ${product.brand}`
      : ''

    return `${name}${brand}`
  }

  const getProductSize = (product) => {
    return product?.size || null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Riwayat Transaksi
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Lihat dan kelola riwayat transaksi penjualan
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/cashier')}
            title="Buat transaksi"
            aria-label="Buat transaksi"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Cari nomor transaksi, produk, merek, size, pelanggan, atau kasir..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm">

              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">
                    No. Transaksi
                  </th>

                  <th className="px-6 py-4 text-left font-semibold text-gray-600">
                    Tanggal
                  </th>

                  <th className="px-6 py-4 text-left font-semibold text-gray-600">
                    Kasir
                  </th>

                  <th className="px-6 py-4 text-left font-semibold text-gray-600">
                    Pelanggan
                  </th>

                  <th className="px-6 py-4 text-left font-semibold text-gray-600">
                    Produk
                  </th>

                  <th className="px-6 py-4 text-right font-semibold text-gray-600">
                    Total
                  </th>

                  <th className="px-6 py-4 text-center font-semibold text-gray-600">
                    Status
                  </th>

                  <th className="px-6 py-4 text-center font-semibold text-gray-600">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {/* Loading */}
                {loading ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      Memuat data transaksi...
                    </td>
                  </tr>

                ) : filteredTransactions.length === 0 ? (

                  /* Empty */
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-12 text-center"
                    >
                      <div className="text-gray-400">

                        <div className="mb-2 flex justify-center">
                          <Search
                            size={32}
                            className="text-gray-300"
                          />
                        </div>

                        <p className="font-medium text-gray-500">
                          Belum ada transaksi
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          Transaksi yang berhasil dibuat
                          akan muncul di sini.
                        </p>

                      </div>
                    </td>
                  </tr>

                ) : (

                  /* Data */
                  filteredTransactions.map(
                    (transaction) => (
                      <tr
                        key={transaction.id}
                        className="transition hover:bg-gray-50"
                      >

                        {/* Transaction Number */}
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {transaction.transaction_number ||
                            '-'}
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-gray-600">
                          {formatDate(
                            transaction.created_at ||
                              transaction.transaction_date
                          )}
                        </td>

                        {/* Cashier */}
                        <td className="px-6 py-4 text-gray-600">
                          {transaction.user?.name ||
                            transaction.cashier?.name ||
                            '-'}
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-4 text-gray-600">
                          {transaction.customer?.name ||
                            'Pelanggan Umum'}
                        </td>

                        {/* Products */}
                        <td className="px-6 py-4">
                          <div className="space-y-2">

                            {transaction.details?.length ? (
                              transaction.details.map(
                                (detail, index) => {
                                  const product =
                                    detail.product

                                  const productName =
                                    getProductName(product)

                                  const productSize =
                                    getProductSize(product)

                                  return (
                                    <div
                                      key={
                                        detail.id ||
                                        `${transaction.id}-${index}`
                                      }
                                      className="min-w-[230px]"
                                    >
                                      {/* Product name + brand */}
                                      <div className="font-medium text-gray-800">
                                        {productName}
                                      </div>

                                      {/* Size */}
                                      {productSize && (
                                        <div className="mt-0.5 text-xs text-gray-500">
                                          Ukuran: {productSize}
                                        </div>
                                      )}

                                      {/* Quantity + Unit */}
                                      <div className="mt-1 text-xs text-gray-500">
                                        {formatQuantity(
                                          detail.quantity
                                        )}{' '}
                                        {detail.unit?.name ||
                                          detail.unit?.symbol ||
                                          ''}
                                        {' × '}
                                        {formatRupiah(
                                          detail.unit_price
                                        )}
                                      </div>
                                    </div>
                                  )
                                }
                              )
                            ) : (
                              <span className="text-gray-400">
                                -
                              </span>
                            )}

                          </div>
                        </td>

                        {/* Total */}
                        <td className="px-6 py-4 text-right font-semibold text-gray-800">
                          {formatRupiah(
                            transaction.total ||
                              transaction.grand_total
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            {transaction.status ||
                              'Selesai'}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/transactions/${transaction.id}`
                              )
                            }
                            title="Lihat detail transaksi"
                            aria-label="Lihat detail transaksi"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 text-blue-600 transition hover:bg-blue-50"
                          >
                            <Eye size={17} />
                          </button>
                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}