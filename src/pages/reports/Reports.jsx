import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  Search,
  Filter,
} from 'lucide-react'

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

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function Reports() {
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState('sales')

  /*
  |--------------------------------------------------------------------------
  | Sales State
  |--------------------------------------------------------------------------
  */

  const today = new Date()
    .toISOString()
    .split('T')[0]

  const firstDayOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  )
    .toISOString()
    .split('T')[0]

  const [startDate, setStartDate] =
    useState(firstDayOfMonth)

  const [endDate, setEndDate] =
    useState(today)

  const [salesStatus, setSalesStatus] =
    useState('completed')

  const [salesData, setSalesData] =
    useState(null)

  const [salesLoading, setSalesLoading] =
    useState(false)

  const [salesError, setSalesError] =
    useState('')

  /*
  |--------------------------------------------------------------------------
  | Stock State
  |--------------------------------------------------------------------------
  */

  const [stockStatus, setStockStatus] =
    useState('all')

  const [stockSearch, setStockSearch] =
    useState('')

  const [stockData, setStockData] =
    useState(null)

  const [stockLoading, setStockLoading] =
    useState(false)

  const [stockError, setStockError] =
    useState('')

  /*
  |--------------------------------------------------------------------------
  | Stock Movement State
  |--------------------------------------------------------------------------
  */

  const [movementStartDate, setMovementStartDate] =
    useState(firstDayOfMonth)

  const [movementEndDate, setMovementEndDate] =
    useState(today)

  const [movementType, setMovementType] =
    useState('all')

  /*
  |--------------------------------------------------------------------------
  | Fetch Sales
  |--------------------------------------------------------------------------
  */

  const fetchSalesReport = async (
    customStartDate = startDate,
    customEndDate = endDate,
    customStatus = salesStatus
  ) => {
    try {
      setSalesLoading(true)
      setSalesError('')

      const response = await api.get(
        '/reports/sales',
        {
          params: {
            start_date: customStartDate,
            end_date: customEndDate,
            status:
              customStatus === 'all'
                ? undefined
                : customStatus,
          },
        }
      )

      setSalesData(
        response.data?.data ||
          response.data
      )
    } catch (err) {
      console.error(
        'SALES REPORT ERROR:',
        err
      )

      setSalesError(
        err.response?.data?.message ||
          'Gagal mengambil laporan penjualan.'
      )
    } finally {
      setSalesLoading(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Fetch Stock
  |--------------------------------------------------------------------------
  */

  const fetchStockReport = async (
    customStatus = stockStatus,
    customSearch = stockSearch,
    customMovementStartDate = movementStartDate,
    customMovementEndDate = movementEndDate,
    customMovementType = movementType
  ) => {
    try {
      setStockLoading(true)
      setStockError('')

      const response = await api.get(
        '/reports/stock',
        {
          params: {
            status: customStatus,

            search:
              customSearch.trim() ||
              undefined,

            movement_start_date:
              customMovementStartDate ||
              undefined,

            movement_end_date:
              customMovementEndDate ||
              undefined,

            movement_type:
              customMovementType,
          },
        }
      )

      setStockData(
        response.data?.data ||
          response.data
      )
    } catch (err) {
      console.error(
        'STOCK REPORT ERROR:',
        err
      )

      setStockError(
        err.response?.data?.message ||
          'Gagal mengambil laporan stok.'
      )
    } finally {
      setStockLoading(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Initial Fetch
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!user) {
      return
    }

    fetchSalesReport()
    fetchStockReport()
  }, [user])

  /*
  |--------------------------------------------------------------------------
  | Sales Filter
  |--------------------------------------------------------------------------
  */

  const handleSalesFilter = (event) => {
    event.preventDefault()

    fetchSalesReport(
      startDate,
      endDate,
      salesStatus
    )
  }

  const handleSalesReset = () => {
    const start =
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      )
        .toISOString()
        .split('T')[0]

    const end =
      new Date()
        .toISOString()
        .split('T')[0]

    setStartDate(start)
    setEndDate(end)
    setSalesStatus('completed')

    fetchSalesReport(
      start,
      end,
      'completed'
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Stock Filter
  |--------------------------------------------------------------------------
  */

  const handleStockFilter = (event) => {
    event.preventDefault()

    fetchStockReport(
      stockStatus,
      stockSearch,
      movementStartDate,
      movementEndDate,
      movementType
    )
  }

  const handleStockReset = () => {
    setStockStatus('all')
    setStockSearch('')
    setMovementStartDate(firstDayOfMonth)
    setMovementEndDate(today)
    setMovementType('all')

    fetchStockReport(
      'all',
      '',
      firstDayOfMonth,
      today,
      'all'
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Sales Data
  |--------------------------------------------------------------------------
  */

  const salesSummary =
    salesData?.summary || {}

  const transactions =
    salesData?.transactions || []

  /*
  |--------------------------------------------------------------------------
  | Stock Data
  |--------------------------------------------------------------------------
  */

  const stockSummary =
    stockData?.summary || {}

  const products =
    stockData?.products || []

  /*
  |--------------------------------------------------------------------------
  | Movement Data
  |--------------------------------------------------------------------------
  */

  const movementSummary =
    stockData?.movement_summary || {}

  const movements =
    stockData?.movements || []

  /*
  |--------------------------------------------------------------------------
  | Admin Only
  |--------------------------------------------------------------------------
  */

  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
          Kamu tidak memiliki akses ke laporan.
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>

      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Laporan
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Pantau penjualan dan kondisi stok barang.
          </p>
        </div>

        {/* Tabs */}

        <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">

          <div className="flex flex-col gap-2 sm:flex-row">

            <button
              type="button"
              onClick={() =>
                setActiveTab('sales')
              }
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === 'sales'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Laporan Penjualan
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab('stock')
              }
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === 'stock'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Laporan Stok
            </button>

          </div>

        </div>

        {/* ==============================================================
            SALES REPORT
        ============================================================== */}

        {activeTab === 'sales' && (

          <div className="space-y-6">

            {/* Filter */}

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

              <form
                onSubmit={handleSalesFilter}
                className="grid gap-4 md:grid-cols-4"
              >

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Tanggal Mulai
                  </label>

                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) =>
                      setStartDate(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Tanggal Akhir
                  </label>

                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) =>
                      setEndDate(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Status
                  </label>

                  <select
                    value={salesStatus}
                    onChange={(event) =>
                      setSalesStatus(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="completed">
                      Selesai
                    </option>

                    <option value="cancelled">
                      Dibatalkan
                    </option>

                    <option value="all">
                      Semua Status
                    </option>
                  </select>
                </div>

                <div className="flex items-end gap-2">

                  <button
                    type="submit"
                    disabled={salesLoading}
                    title="Tampilkan laporan"
                    aria-label="Tampilkan laporan"
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {salesLoading
                      ? 'Memuat...'
                      : 'Tampilkan'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSalesReset}
                    title="Reset filter"
                    aria-label="Reset filter"
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Reset
                  </button>

                </div>

              </form>

            </div>

            {salesError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {salesError}
              </div>
            )}

            {/* Sales Summary */}

            <div className="grid gap-4 md:grid-cols-4">

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Transaksi
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {salesSummary.total_transactions ?? 0}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Penjualan
                </p>

                <p className="mt-2 text-xl font-bold text-blue-600">
                  {formatRupiah(
                    salesSummary.total_sales
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Diskon
                </p>

                <p className="mt-2 text-xl font-bold text-orange-600">
                  {formatRupiah(
                    salesSummary.total_discount
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Pembayaran
                </p>

                <p className="mt-2 text-xl font-bold text-green-600">
                  {formatRupiah(
                    salesSummary.total_paid
                  )}
                </p>
              </div>

            </div>

            {/* Sales Table */}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

              <div className="border-b border-gray-200 p-5">

                <h2 className="font-bold text-gray-900">
                  Data Penjualan
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Periode{' '}
                  {formatDate(
                    salesData?.period?.start_date
                  )}{' '}
                  sampai{' '}
                  {formatDate(
                    salesData?.period?.end_date
                  )}
                </p>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[900px] text-sm">

                  <thead className="bg-gray-50">

                    <tr>

                      <th className="px-5 py-4 text-left">
                        No
                      </th>

                      <th className="px-5 py-4 text-left">
                        No. Transaksi
                      </th>

                      <th className="px-5 py-4 text-left">
                        Tanggal
                      </th>

                      <th className="px-5 py-4 text-left">
                        Kasir
                      </th>

                      <th className="px-5 py-4 text-left">
                        Pelanggan
                      </th>

                      <th className="px-5 py-4 text-center">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right">
                        Total
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-gray-100">

                    {salesLoading ? (

                      <tr>
                        <td
                          colSpan="7"
                          className="px-5 py-10 text-center text-gray-500"
                        >
                          Memuat laporan...
                        </td>
                      </tr>

                    ) : transactions.length === 0 ? (

                      <tr>
                        <td
                          colSpan="7"
                          className="px-5 py-10 text-center text-gray-500"
                        >
                          Tidak ada transaksi pada periode ini.
                        </td>
                      </tr>

                    ) : (

                      transactions.map(
                        (transaction, index) => (

                          <tr
                            key={
                              transaction.id ||
                              index
                            }
                            className="hover:bg-gray-50"
                          >

                            <td className="px-5 py-4 text-gray-500">
                              {index + 1}
                            </td>

                            <td className="px-5 py-4 font-semibold text-gray-900">
                              {transaction.transaction_number}
                            </td>

                            <td className="px-5 py-4 text-gray-600">
                              {formatDate(
                                transaction.transaction_date
                              )}
                            </td>

                            <td className="px-5 py-4 text-gray-600">
                              {transaction.user?.name ||
                                '-'}
                            </td>

                            <td className="px-5 py-4 text-gray-600">
                              {transaction.customer?.name ||
                                'Pelanggan Umum'}
                            </td>

                            <td className="px-5 py-4 text-center">

                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  transaction.status ===
                                  'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {transaction.status ===
                                'completed'
                                  ? 'Selesai'
                                  : 'Dibatalkan'}
                              </span>

                            </td>

                            <td className="px-5 py-4 text-right font-semibold text-gray-900">
                              {formatRupiah(
                                transaction.total
                              )}
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

        )}

        {/* ==============================================================
            STOCK REPORT
        ============================================================== */}

        {activeTab === 'stock' && (

          <div className="space-y-6">

            {/* Filter Stok */}

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

              <div className="mb-4 flex items-center gap-2">

                <Filter
                  size={18}
                  className="text-gray-500"
                />

                <h2 className="font-bold text-gray-900">
                  Filter Laporan Stok
                </h2>

              </div>

              <form
                onSubmit={handleStockFilter}
                className="grid gap-4 md:grid-cols-3"
              >

                <div className="md:col-span-1">

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Cari Barang
                  </label>

                  <div className="relative">

                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      value={stockSearch}
                      onChange={(event) =>
                        setStockSearch(
                          event.target.value
                        )
                      }
                      placeholder="Nama, merek, ukuran, atau barcode..."
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                  </div>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Status Stok
                  </label>

                  <select
                    value={stockStatus}
                    onChange={(event) =>
                      setStockStatus(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >

                    <option value="all">
                      Semua Status
                    </option>

                    <option value="aman">
                      Aman
                    </option>

                    <option value="menipis">
                      Menipis
                    </option>

                    <option value="habis">
                      Habis
                    </option>

                  </select>

                </div>

                <div className="flex items-end gap-2">

                  <button
                    type="submit"
                    disabled={stockLoading}
                    title="Tampilkan laporan stok"
                    aria-label="Tampilkan laporan stok"
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {stockLoading
                      ? 'Memuat...'
                      : 'Tampilkan'}
                  </button>

                  <button
                    type="button"
                    onClick={handleStockReset}
                    title="Reset filter stok"
                    aria-label="Reset filter stok"
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Reset
                  </button>

                </div>

              </form>

            </div>

            {stockError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {stockError}
              </div>
            )}

            {/* Stock Summary */}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                <p className="text-sm text-gray-500">
                  Total Produk
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {stockSummary.total_products ?? 0}
                </p>

              </div>

              <div className="rounded-xl border border-green-200 bg-green-50 p-5">

                <p className="text-sm text-green-700">
                  Stok Aman
                </p>

                <p className="mt-2 text-2xl font-bold text-green-700">
                  {stockSummary.safe_products ?? 0}
                </p>

              </div>

              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">

                <p className="text-sm text-yellow-700">
                  Stok Menipis
                </p>

                <p className="mt-2 text-2xl font-bold text-yellow-700">
                  {stockSummary.low_stock_products ?? 0}
                </p>

              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-5">

                <p className="text-sm text-red-700">
                  Stok Habis
                </p>

                <p className="mt-2 text-2xl font-bold text-red-700">
                  {stockSummary.out_of_stock_products ?? 0}
                </p>

              </div>

            </div>

            {/* Movement Summary */}

            <div className="grid gap-4 md:grid-cols-3">

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-blue-700">
                      Total Pergerakan
                    </p>

                    <p className="mt-2 text-2xl font-bold text-blue-700">
                      {movementSummary.total_movements ?? 0}
                    </p>

                  </div>

                  <div className="rounded-lg bg-white p-2 text-blue-600 shadow-sm">

                    <RotateCcw size={22} />

                  </div>

                </div>

              </div>

              <div className="rounded-xl border border-green-200 bg-green-50 p-5">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-green-700">
                      Barang Masuk
                    </p>

                    <p className="mt-2 text-2xl font-bold text-green-700">
                      {formatQuantity(
                        movementSummary.total_in_quantity
                      )}
                    </p>

                    <p className="mt-1 text-xs text-green-600">
                      {movementSummary.total_in_movements ?? 0}{' '}
                      pergerakan
                    </p>

                  </div>

                  <div className="rounded-lg bg-white p-2 text-green-600 shadow-sm">

                    <ArrowDownToLine size={22} />

                  </div>

                </div>

              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-5">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-red-700">
                      Barang Keluar
                    </p>

                    <p className="mt-2 text-2xl font-bold text-red-700">
                      {formatQuantity(
                        movementSummary.total_out_quantity
                      )}
                    </p>

                    <p className="mt-1 text-xs text-red-600">
                      {movementSummary.total_out_movements ?? 0}{' '}
                      pergerakan
                    </p>

                  </div>

                  <div className="rounded-lg bg-white p-2 text-red-600 shadow-sm">

                    <ArrowUpFromLine size={22} />

                  </div>

                </div>

              </div>

            </div>

            {/* Inventory Value */}

            <div className="grid gap-4 md:grid-cols-2">

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                <p className="text-sm text-gray-500">
                  Nilai Persediaan
                </p>

                <p className="mt-2 text-2xl font-bold text-blue-600">
                  {formatRupiah(
                    stockSummary.total_inventory_value
                  )}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Berdasarkan harga beli
                </p>

              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                <p className="text-sm text-gray-500">
                  Nilai Penjualan Stok
                </p>

                <p className="mt-2 text-2xl font-bold text-green-600">
                  {formatRupiah(
                    stockSummary.total_selling_value
                  )}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Berdasarkan harga jual
                </p>

              </div>

            </div>

            {/* Stock Movement Filter */}

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

              <div className="mb-4">

                <h2 className="font-bold text-gray-900">
                  Filter Pergerakan Stok
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Lihat barang yang masuk dan keluar berdasarkan periode.
                </p>

              </div>

              <div className="grid gap-4 md:grid-cols-3">

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Tanggal Mulai
                  </label>

                  <input
                    type="date"
                    value={movementStartDate}
                    onChange={(event) =>
                      setMovementStartDate(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Tanggal Akhir
                  </label>

                  <input
                    type="date"
                    value={movementEndDate}
                    onChange={(event) =>
                      setMovementEndDate(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Jenis Pergerakan
                  </label>

                  <select
                    value={movementType}
                    onChange={(event) =>
                      setMovementType(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >

                    <option value="all">
                      Semua
                    </option>

                    <option value="in">
                      Barang Masuk
                    </option>

                    <option value="out">
                      Barang Keluar
                    </option>

                  </select>

                </div>

              </div>

              <div className="mt-4 flex justify-end">

                <button
                  type="button"
                  onClick={() =>
                    fetchStockReport(
                      stockStatus,
                      stockSearch,
                      movementStartDate,
                      movementEndDate,
                      movementType
                    )
                  }
                  disabled={stockLoading}
                  title="Tampilkan pergerakan stok"
                  aria-label="Tampilkan pergerakan stok"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {stockLoading
                    ? 'Memuat...'
                    : 'Tampilkan'}
                </button>

              </div>

            </div>

            {/* Stock Table */}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

              <div className="border-b border-gray-200 p-5">

                <h2 className="font-bold text-gray-900">
                  Data Stok Barang
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Kondisi stok berdasarkan minimum stok masing-masing produk.
                </p>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1200px] text-sm">

                  <thead className="bg-gray-50">

                    <tr>

                      <th className="px-5 py-4 text-left">
                        No
                      </th>

                      <th className="px-5 py-4 text-left">
                        Barang
                      </th>

                      <th className="px-5 py-4 text-left">
                        Merek
                      </th>

                      <th className="px-5 py-4 text-left">
                        Ukuran
                      </th>

                      <th className="px-5 py-4 text-left">
                        Kategori
                      </th>

                      <th className="px-5 py-4 text-center">
                        Satuan
                      </th>

                      <th className="px-5 py-4 text-right">
                        Stok
                      </th>

                      <th className="px-5 py-4 text-right">
                        Minimum
                      </th>

                      <th className="px-5 py-4 text-right">
                        Harga Beli
                      </th>

                      <th className="px-5 py-4 text-right">
                        Harga Jual
                      </th>

                      <th className="px-5 py-4 text-center">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-gray-100">

                    {stockLoading ? (

                      <tr>

                        <td
                          colSpan="11"
                          className="px-5 py-10 text-center text-gray-500"
                        >
                          Memuat laporan stok...
                        </td>

                      </tr>

                    ) : products.length === 0 ? (

                      <tr>

                        <td
                          colSpan="11"
                          className="px-5 py-10 text-center text-gray-500"
                        >
                          Tidak ada data stok.
                        </td>

                      </tr>

                    ) : (

                      products.map(
                        (product, index) => {

                          const status =
                            product.stock_status

                          return (
                            <tr
                              key={
                                product.id ||
                                index
                              }
                              className="hover:bg-gray-50"
                            >

                              <td className="px-5 py-4 text-gray-500">
                                {index + 1}
                              </td>

                              <td className="px-5 py-4">

                                <p className="font-semibold text-gray-900">
                                  {product.name}
                                </p>

                                {product.barcode && (
                                  <p className="mt-1 text-xs text-gray-400">
                                    {product.barcode}
                                  </p>
                                )}

                              </td>

                              <td className="px-5 py-4 text-gray-600">
                                {product.brand || '-'}
                              </td>

                              <td className="px-5 py-4 text-gray-600">
                                {product.size || '-'}
                              </td>

                              <td className="px-5 py-4 text-gray-600">
                                {product.category?.name ||
                                  '-'}
                              </td>

                              <td className="px-5 py-4 text-center text-gray-600">

                                {product.base_unit?.name ||
                                  product.base_unit?.symbol ||
                                  '-'}

                              </td>

                              <td className="px-5 py-4 text-right font-semibold text-gray-900">

                                {formatQuantity(
                                  product.stock
                                )}

                              </td>

                              <td className="px-5 py-4 text-right text-gray-600">

                                {formatQuantity(
                                  product.minimum_stock
                                )}

                              </td>

                              <td className="px-5 py-4 text-right text-gray-600">

                                {formatRupiah(
                                  product.purchase_price
                                )}

                              </td>

                              <td className="px-5 py-4 text-right text-gray-600">

                                {formatRupiah(
                                  product.selling_price
                                )}

                              </td>

                              <td className="px-5 py-4 text-center">

                                {status ===
                                  'aman' && (

                                  <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                    Aman
                                  </span>

                                )}

                                {status ===
                                  'menipis' && (

                                  <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                                    Menipis
                                  </span>

                                )}

                                {status ===
                                  'habis' && (

                                  <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                    Habis
                                  </span>

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

            {/* Stock Movement Table */}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

              <div className="border-b border-gray-200 p-5">

                <h2 className="font-bold text-gray-900">
                  Riwayat Pergerakan Stok
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Riwayat barang masuk dan barang keluar.
                </p>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1200px] text-sm">

                  <thead className="bg-gray-50">

                    <tr>

                      <th className="px-5 py-4 text-left">
                        No
                      </th>

                      <th className="px-5 py-4 text-left">
                        Tanggal
                      </th>

                      <th className="px-5 py-4 text-left">
                        Barang
                      </th>

                      <th className="px-5 py-4 text-left">
                        Merek
                      </th>

                      <th className="px-5 py-4 text-left">
                        Ukuran
                      </th>

                      <th className="px-5 py-4 text-center">
                        Jenis
                      </th>

                      <th className="px-5 py-4 text-right">
                        Jumlah
                      </th>

                      <th className="px-5 py-4 text-center">
                        Satuan
                      </th>

                      <th className="px-5 py-4 text-left">
                        Petugas
                      </th>

                      <th className="px-5 py-4 text-left">
                        Keterangan
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-gray-100">

                    {stockLoading ? (

                      <tr>

                        <td
                          colSpan="10"
                          className="px-5 py-10 text-center text-gray-500"
                        >
                          Memuat riwayat stok...
                        </td>

                      </tr>

                    ) : movements.length === 0 ? (

                      <tr>

                        <td
                          colSpan="10"
                          className="px-5 py-10 text-center"
                        >

                          <div className="flex flex-col items-center justify-center">

                            <RotateCcw
                              size={32}
                              className="mb-2 text-gray-300"
                            />

                            <p className="font-medium text-gray-500">
                              Belum ada pergerakan stok
                            </p>

                            <p className="mt-1 text-sm text-gray-400">
                              Barang masuk dan barang keluar akan muncul di sini.
                            </p>

                          </div>

                        </td>

                      </tr>

                    ) : (

                      movements.map(
                        (movement, index) => {

                          const product =
                            movement.product || {}

                          const unit =
                            product.base_unit || {}

                          const isIncoming =
                            movement.type === 'in'

                          return (
                            <tr
                              key={
                                movement.id ||
                                index
                              }
                              className="hover:bg-gray-50"
                            >

                              <td className="px-5 py-4 text-gray-500">
                                {index + 1}
                              </td>

                              <td className="px-5 py-4 whitespace-nowrap text-gray-600">
                                {formatDateTime(
                                  movement.date
                                )}
                              </td>

                              <td className="px-5 py-4">

                                <p className="font-semibold text-gray-900">
                                  {product.name ||
                                    '-'}
                                </p>

                                {product.barcode && (
                                  <p className="mt-1 text-xs text-gray-400">
                                    {product.barcode}
                                  </p>
                                )}

                              </td>

                              <td className="px-5 py-4 text-gray-600">
                                {product.brand ||
                                  '-'}
                              </td>

                              <td className="px-5 py-4 text-gray-600">
                                {product.size ||
                                  '-'}
                              </td>

                              <td className="px-5 py-4 text-center">

                                {isIncoming ? (

                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">

                                    <ArrowDownToLine
                                      size={14}
                                    />

                                    Barang Masuk

                                  </span>

                                ) : (

                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">

                                    <ArrowUpFromLine
                                      size={14}
                                    />

                                    Barang Keluar

                                  </span>

                                )}

                              </td>

                              <td
                                className={`px-5 py-4 text-right font-semibold ${
                                  isIncoming
                                    ? 'text-green-700'
                                    : 'text-red-700'
                                }`}
                              >
                                {isIncoming
                                  ? '+'
                                  : '-'}
                                {formatQuantity(
                                  Math.abs(
                                    Number(
                                      movement.quantity ||
                                        0
                                    )
                                  )
                                )}
                              </td>

                              <td className="px-5 py-4 text-center text-gray-600">

                                {unit.name ||
                                  unit.symbol ||
                                  '-'}

                              </td>

                              <td className="px-5 py-4 text-gray-600">
                                {movement.user?.name ||
                                  '-'}
                              </td>

                              <td className="px-5 py-4 text-gray-600">

                                {movement.note ||
                                  '-'}

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

          </div>

        )}

      </div>

    </DashboardLayout>
  )
}