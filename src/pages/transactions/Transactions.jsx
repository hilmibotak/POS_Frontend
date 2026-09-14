import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

      setTransactions(Array.isArray(data) ? data : data?.data || [])
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

  const filteredTransactions = transactions.filter((transaction) => {
    const keyword = search.toLowerCase()

    return (
      String(transaction.transaction_number || '')
        .toLowerCase()
        .includes(keyword) ||
      String(transaction.customer?.name || '')
        .toLowerCase()
        .includes(keyword) ||
      String(transaction.user?.name || '')
        .toLowerCase()
        .includes(keyword)
    )
  })

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(value || 0))
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
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + Buat Transaksi
          </button>
        </div>

        {/* Search */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor transaksi, pelanggan, atau kasir..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            <table className="w-full min-w-[900px] text-sm">
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
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      Memuat data transaksi...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-12 text-center"
                    >
                      <div className="text-gray-400">
                        <div className="mb-2 text-3xl">🧾</div>

                        <p className="font-medium text-gray-500">
                          Belum ada transaksi
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          Transaksi yang berhasil dibuat akan muncul di sini.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {transaction.transaction_number || '-'}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(
                          transaction.created_at ||
                            transaction.transaction_date
                        )}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {transaction.user?.name ||
                          transaction.cashier?.name ||
                          '-'}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {transaction.customer?.name ||
                          'Pelanggan Umum'}
                      </td>

                      <td className="px-6 py-4 text-right font-semibold text-gray-800">
                        {formatRupiah(
                          transaction.total ||
                            transaction.grand_total
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          {transaction.status || 'Selesai'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/transactions/${transaction.id}`)
                          }
                          className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}