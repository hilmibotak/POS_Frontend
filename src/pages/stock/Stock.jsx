import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'

function formatNumber(value) {
  const number = Number(value ?? 0)

  if (Number.isInteger(number)) {
    return number.toString()
  }

  return number.toLocaleString('id-ID', {
    maximumFractionDigits: 3,
  })
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

export default function Stock() {
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/products')

      console.log(
        'STOCK PRODUCTS RESPONSE:',
        response.data
      )

      const responseData = response.data?.data

      const productData = Array.isArray(responseData)
        ? responseData
        : responseData?.data || []

      setProducts(productData)
    } catch (err) {
      console.error(
        'FETCH STOCK ERROR:',
        err
      )

      setError(
        err.response?.data?.message ||
          'Gagal mengambil data stok.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const filteredProducts = products.filter(
    (product) => {
      const keyword = search
        .toLowerCase()
        .trim()

      if (!keyword) {
        return true
      }

      const name = String(
        product.name || ''
      ).toLowerCase()

      const brand = String(
        product.brand || ''
      ).toLowerCase()

      const size = String(
        product.size || ''
      ).toLowerCase()

      const barcode = String(
        product.barcode || ''
      ).toLowerCase()

      const category = String(
        product.category?.name || ''
      ).toLowerCase()

      return (
        name.includes(keyword) ||
        brand.includes(keyword) ||
        size.includes(keyword) ||
        barcode.includes(keyword) ||
        category.includes(keyword)
      )
    }
  )

  const getStockStatus = (product) => {
    const stock = Number(
      product.stock ?? 0
    )

    const minimum = Number(
      product.minimum_stock ??
        product.min_stock ??
        product.min ??
        0
    )

    if (stock <= 0) {
      return {
        label: 'Habis',
        className:
          'bg-red-100 text-red-700',
      }
    }

    if (stock <= minimum) {
      return {
        label: 'Stok Menipis',
        className:
          'bg-yellow-100 text-yellow-700',
      }
    }

    return {
      label: 'Aman',
      className:
        'bg-green-100 text-green-700',
    }
  }

  const getUnit = (product) => {
    return (
      product.base_unit?.name ||
      product.baseUnit?.name ||
      product.base_unit?.symbol ||
      product.baseUnit?.symbol ||
      '-'
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ==============================
            HEADER
        ============================== */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Manajemen Stok
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Pantau stok barang yang tersedia di toko.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/stock/in')
            }
            title="Stok Masuk"
            aria-label="Stok Masuk"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* ==============================
            ERROR
        ============================== */}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ==============================
            SEARCH
        ============================== */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="font-bold text-gray-900">
                Daftar Stok Barang
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Total {filteredProducts.length} barang
              </p>
            </div>

            <div className="relative w-full md:w-96">

              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Cari barang, merek, ukuran, barcode..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

          </div>

        </div>

        {/* ==============================
            TABLE
        ============================== */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1200px] text-sm">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-5 py-4 text-left font-semibold text-gray-700">
                    No
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-gray-700">
                    Barang
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-gray-700">
                    Merek
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-gray-700">
                    Ukuran
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-gray-700">
                    Kategori
                  </th>

                  <th className="px-5 py-4 text-center font-semibold text-gray-700">
                    Stok
                  </th>

                  <th className="px-5 py-4 text-center font-semibold text-gray-700">
                    Minimum
                  </th>

                  <th className="px-5 py-4 text-right font-semibold text-gray-700">
                    Harga Jual
                  </th>

                  <th className="px-5 py-4 text-center font-semibold text-gray-700">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {/* LOADING */}

                {loading ? (

                  <tr>

                    <td
                      colSpan="9"
                      className="px-5 py-10 text-center text-gray-500"
                    >
                      Memuat data stok...
                    </td>

                  </tr>

                ) : filteredProducts.length === 0 ? (

                  /* EMPTY */

                  <tr>

                    <td
                      colSpan="9"
                      className="px-5 py-10 text-center text-gray-500"
                    >
                      Data stok tidak ditemukan.
                    </td>

                  </tr>

                ) : (

                  /* DATA */

                  filteredProducts.map(
                    (product, index) => {

                      const status =
                        getStockStatus(
                          product
                        )

                      const unit =
                        getUnit(product)

                      const minimumStock =
                        product.minimum_stock ??
                        product.min_stock ??
                        product.min ??
                        0

                      return (

                        <tr
                          key={product.id}
                          className="transition hover:bg-gray-50"
                        >

                          {/* NO */}

                          <td className="px-5 py-4 text-gray-500">
                            {index + 1}
                          </td>

                          {/* BARANG */}

                          <td className="px-5 py-4">

                            <div>

                              <p className="font-semibold text-gray-900">
                                {product.name ||
                                  '-'}
                              </p>

                              {product.barcode && (
                                <p className="mt-1 text-xs text-gray-400">
                                  Barcode:{' '}
                                  {
                                    product.barcode
                                  }
                                </p>
                              )}

                            </div>

                          </td>

                          {/* MEREK */}

                          <td className="px-5 py-4">

                            {product.brand ? (

                              <span className="font-medium text-gray-700">
                                {
                                  product.brand
                                }
                              </span>

                            ) : (

                              <span className="text-gray-400">
                                -
                              </span>

                            )}

                          </td>

                          {/* UKURAN */}

                          <td className="px-5 py-4">

                            {product.size ? (

                              <span className="inline-flex rounded-lg bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                {
                                  product.size
                                }
                              </span>

                            ) : (

                              <span className="text-gray-400">
                                -
                              </span>

                            )}

                          </td>

                          {/* KATEGORI */}

                          <td className="px-5 py-4 text-gray-600">

                            {
                              product
                                .category
                                ?.name ||
                              '-'
                            }

                          </td>

                          {/* STOK */}

                          <td className="px-5 py-4 text-center">

                            <span className="font-bold text-gray-900">
                              {
                                formatNumber(
                                  product.stock
                                )
                              }
                            </span>

                            <span className="ml-1 text-gray-500">
                              {unit}
                            </span>

                          </td>

                          {/* MINIMUM */}

                          <td className="px-5 py-4 text-center text-gray-600">

                            {
                              formatNumber(
                                minimumStock
                              )
                            }

                          </td>

                          {/* HARGA JUAL */}

                          <td className="px-5 py-4 text-right font-semibold text-gray-900">

                            {
                              formatRupiah(
                                product.selling_price
                              )
                            }

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4 text-center">

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                            >
                              {
                                status.label
                              }
                            </span>

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
    </DashboardLayout>
  )
}