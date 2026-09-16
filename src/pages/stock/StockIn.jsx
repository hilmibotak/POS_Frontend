import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  X,
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

function getProductDisplayName(product) {
  if (!product) {
    return '-'
  }

  const name = String(
    product.name || ''
  ).trim()

  const brand = String(
    product.brand || ''
  ).trim()

  if (brand) {
    return `${name} ${brand}`
  }

  return name || '-'
}

function getProductSize(product) {
  if (!product) {
    return ''
  }

  return String(
    product.size || ''
  ).trim()
}

export default function StockIn() {
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')

  const [loadingProducts, setLoadingProducts] =
    useState(true)

  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      setError('')

      const response = await api.get(
        '/products'
      )

      console.log(
        'PRODUCTS FOR STOCK IN:',
        response.data
      )

      const responseData =
        response.data?.data

      const data = Array.isArray(
        responseData
      )
        ? responseData
        : responseData?.data || []

      setProducts(data)
    } catch (err) {
      console.error(
        'FETCH PRODUCTS ERROR:',
        err
      )

      setError(
        err.response?.data?.message ||
          'Gagal mengambil data barang.'
      )
    } finally {
      setLoadingProducts(false)
    }
  }

  const selectedProduct =
    products.find(
      (product) =>
        String(product.id) ===
        String(productId)
    )

  const getUnitName = (product) => {
    return (
      product?.base_unit?.name ||
      product?.baseUnit?.name ||
      product?.base_unit?.symbol ||
      product?.baseUnit?.symbol ||
      '-'
    )
  }

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!productId) {
      setError(
        'Silakan pilih barang terlebih dahulu.'
      )
      return
    }

    if (
      !quantity ||
      Number(quantity) <= 0
    ) {
      setError(
        'Jumlah stok harus lebih dari 0.'
      )
      return
    }

    try {
      setSaving(true)

      const payload = {
        product_id: Number(productId),
        quantity: Number(quantity),
        note:
          note.trim() ||
          'Stok masuk',
      }

      console.log(
        'STOCK IN PAYLOAD:',
        payload
      )

      const response =
        await api.post(
          '/stock-movements/in',
          payload
        )

      console.log(
        'STOCK IN RESPONSE:',
        response.data
      )

      setSuccess(
        response.data?.message ||
          'Stok berhasil ditambahkan.'
      )

      setProductId('')
      setQuantity('')
      setNote('')

      // Tunggu sebentar supaya user
      // melihat pesan berhasil.
      setTimeout(() => {
        navigate('/stock')
      }, 800)
    } catch (err) {
      console.error(
        'STOCK IN ERROR:',
        err
      )

      if (
        err.response?.status === 422
      ) {
        const validationErrors =
          err.response?.data?.errors

        if (validationErrors) {
          const firstError =
            Object.values(
              validationErrors
            )[0]

          setError(
            Array.isArray(firstError)
              ? firstError[0]
              : 'Data stok tidak valid.'
          )
        } else {
          setError(
            err.response?.data?.message ||
              'Data stok tidak valid.'
          )
        }
      } else {
        setError(
          err.response?.data?.message ||
            'Gagal menambahkan stok.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">

        {/* ==============================
            HEADER
        ============================== */}

        <div>
          <button
            type="button"
            title="Kembali ke Stok"
            aria-label="Kembali ke Stok"
            onClick={() =>
              navigate('/stock')
            }
            className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <h1 className="text-2xl font-bold text-gray-900">
            Stok Masuk
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Tambahkan stok barang yang masuk ke toko.
          </p>
        </div>

        {/* ==============================
            SUCCESS
        ============================== */}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* ==============================
            ERROR
        ============================== */}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ==============================
            FORM
        ============================== */}

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-5">

            {/* ==========================
                PRODUCT
            ========================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Barang
              </label>

              <select
                value={productId}
                onChange={(event) =>
                  setProductId(
                    event.target.value
                  )
                }
                disabled={
                  loadingProducts ||
                  saving
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              >
                <option value="">
                  {loadingProducts
                    ? 'Memuat barang...'
                    : 'Pilih barang'}
                </option>

                {products
                  .filter(
                    (product) =>
                      product.is_active !==
                      false
                  )
                  .map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {getProductDisplayName(
                        product
                      )}

                      {getProductSize(
                        product
                      )
                        ? ` — ${getProductSize(
                            product
                          )}`
                        : ''}

                      {` — ${getUnitName(
                        product
                      )}`}
                    </option>
                  ))}
              </select>

              <p className="mt-1 text-xs text-gray-400">
                Pilih barang berdasarkan nama, merek, ukuran, dan satuannya.
              </p>
            </div>

            {/* ==========================
                SELECTED PRODUCT INFO
            ========================== */}

            {selectedProduct && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                  <div>
                    <p className="text-xs font-medium text-blue-600">
                      Barang yang dipilih
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-900">
                      {getProductDisplayName(
                        selectedProduct
                      )}
                    </p>

                    {getProductSize(
                      selectedProduct
                    ) && (
                      <p className="mt-1 text-sm font-medium text-gray-600">
                        Ukuran:{' '}
                        {getProductSize(
                          selectedProduct
                        )}
                      </p>
                    )}

                    {selectedProduct.barcode && (
                      <p className="mt-1 text-xs text-gray-400">
                        Barcode:{' '}
                        {
                          selectedProduct.barcode
                        }
                      </p>
                    )}
                  </div>

                  <span className="inline-flex w-fit rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-600">
                    {getUnitName(
                      selectedProduct
                    )}
                  </span>

                </div>

                <div className="mt-4 border-t border-blue-100 pt-3">

                  <p className="text-sm text-gray-500">
                    Stok saat ini
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {formatNumber(
                      selectedProduct.stock
                    )}{' '}

                    <span className="text-sm font-medium text-gray-500">
                      {getUnitName(
                        selectedProduct
                      )}
                    </span>
                  </p>

                </div>

              </div>
            )}

            {/* ==========================
                QUANTITY
            ========================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Jumlah Stok Masuk
              </label>

              <div className="relative">

                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  placeholder="Contoh: 50"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-20 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />

                {selectedProduct && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    {getUnitName(
                      selectedProduct
                    )}
                  </span>
                )}

              </div>

              <p className="mt-1 text-xs text-gray-400">
                Masukkan jumlah barang yang masuk.
              </p>
            </div>

            {/* ==========================
                PREVIEW
            ========================== */}

            {selectedProduct &&
              quantity &&
              Number(quantity) > 0 && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">

                  <p className="text-sm text-blue-600">
                    Stok setelah ditambahkan
                  </p>

                  <p className="mt-1 text-xl font-bold text-blue-900">

                    {formatNumber(
                      Number(
                        selectedProduct.stock ||
                          0
                      ) +
                        Number(quantity)
                    )}{' '}

                    <span className="text-sm font-medium">
                      {getUnitName(
                        selectedProduct
                      )}
                    </span>

                  </p>

                </div>
              )}

            {/* ==========================
                NOTE
            ========================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Keterangan
              </label>

              <textarea
                value={note}
                onChange={(event) =>
                  setNote(
                    event.target.value
                  )
                }
                disabled={saving}
                rows="4"
                placeholder="Contoh: Barang datang dari supplier..."
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />
            </div>

          </div>

          {/* ==============================
              BUTTONS
          ============================== */}

          <div className="mt-7 flex justify-end gap-3 border-t border-gray-100 pt-5">

            {/* BATAL */}

            <button
              type="button"
              title="Batal"
              aria-label="Batal"
              onClick={() =>
                navigate('/stock')
              }
              disabled={saving}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            {/* SIMPAN */}

            <button
              type="submit"
              title={
                saving
                  ? 'Menyimpan...'
                  : 'Simpan Stok'
              }
              aria-label={
                saving
                  ? 'Menyimpan...'
                  : 'Simpan Stok'
              }
              disabled={
                saving ||
                loadingProducts
              }
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <Save
                className={`h-5 w-5 ${
                  saving
                    ? 'animate-pulse'
                    : ''
                }`}
              />
            </button>

          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}