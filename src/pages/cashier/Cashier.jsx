import { useEffect, useMemo, useState } from 'react'
import {
  Banknote,
  Check,
  CreditCard,
  Minus,
  Plus,
  QrCode,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

// Format angka stok
// 50.000 -> 50
// 100.000 -> 100
// 5400.000 -> 5400
// 2.500 -> 2,5
function formatStock(value) {
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
    return 'Produk'
  }

  const name = String(product.name || '').trim()
  const brand = String(product.brand || '').trim()

  if (brand) {
    return `${name} ${brand}`
  }

  return name || 'Produk'
}

function getProductSize(product) {
  if (!product) {
    return ''
  }

  return String(product.size || '').trim()
}

/*
|--------------------------------------------------------------------------
| Informasi pembayaran toko
|--------------------------------------------------------------------------
|
| QRIS:
| Simpan gambar QRIS toko di:
|
| public/qris-toko.png
|
| Maka gambar bisa dipanggil dengan:
| /qris-toko.png
|
| Transfer:
| Ganti data rekening berikut sesuai rekening toko.
|
*/
const STORE_PAYMENT_INFO = {
  qrisImage: '/qris_toko.jpeg',
  qrisName: 'QRIS Toko Bangunan',

  bankName: 'BCA',
  accountNumber: '1234567890',
  accountName: 'TOKO BANGUNAN',
}

export default function Cashier() {
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])

  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState('')

  const [cart, setCart] = useState([])

  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingCustomers, setLoadingCustomers] = useState(true)

  const [error, setError] = useState('')

  // Modal tambah barang
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productUnits, setProductUnits] = useState([])
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loadingUnits, setLoadingUnits] = useState(false)

  // Pembayaran
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paid, setPaid] = useState('')
  const [loadingTransaction, setLoadingTransaction] = useState(false)

  // Fallback apabila gambar QRIS belum tersedia
  const [qrisImageError, setQrisImageError] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchCustomers()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)

      const response = await api.get('/products')

      const data =
        response.data?.data?.data ||
        response.data?.data ||
        []

      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Gagal mengambil produk:', err)
      setError('Gagal mengambil data produk.')
    } finally {
      setLoadingProducts(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true)

      const response = await api.get('/customers')

      const data =
        response.data?.data?.data ||
        response.data?.data ||
        []

      setCustomers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Gagal mengambil pelanggan:', err)
      setError('Gagal mengambil data pelanggan.')
    } finally {
      setLoadingCustomers(false)
    }
  }

  const filteredProducts = useMemo(() => {
    const keyword = search.toLowerCase().trim()

    if (!keyword) {
      return products
    }

    return products.filter((product) => {
      const name = String(product.name || '').toLowerCase()
      const brand = String(product.brand || '').toLowerCase()
      const size = String(product.size || '').toLowerCase()
      const barcode = String(product.barcode || '').toLowerCase()

      return (
        name.includes(keyword) ||
        brand.includes(keyword) ||
        size.includes(keyword) ||
        barcode.includes(keyword)
      )
    })
  }, [products, search])

  const total = useMemo(() => {
    return cart.reduce((sum, item) => {
      return sum + Number(item.subtotal || 0)
    }, 0)
  }, [cart])

  /*
  |--------------------------------------------------------------------------
  | Nilai pembayaran
  |--------------------------------------------------------------------------
  |
  | Cash:
  | - paid mengikuti input kasir
  | - change dihitung dari paid - total
  |
  | QRIS / Transfer:
  | - transaksi dibuat pending
  | - paid dikirim 0
  | - setelah admin konfirmasi backend akan mengubah paid menjadi total
  |
  */
  const paidAmount =
    paymentMethod === 'cash'
      ? Number(paid) || 0
      : 0

  const change =
    paymentMethod === 'cash'
      ? Math.max(paidAmount - total, 0)
      : 0

  const isPaymentValid =
    cart.length > 0 &&
    total > 0 &&
    (
      paymentMethod !== 'cash' ||
      paidAmount >= total
    )

  const openProductModal = async (product) => {
    setSelectedProduct(product)
    setQuantity(1)
    setSelectedUnit(null)
    setProductUnits([])
    setError('')

    try {
      setLoadingUnits(true)

      const response = await api.get(
        `/products/${product.id}/product-units`
      )

      const data =
        response.data?.data?.data ||
        response.data?.data ||
        []

      const units = Array.isArray(data) ? data : []

      setProductUnits(units)

      const defaultUnit =
        units.find((unit) => unit.is_default) ||
        units[0]

      if (defaultUnit) {
        setSelectedUnit(defaultUnit)
      }
    } catch (err) {
      console.error(
        'Gagal mengambil satuan produk:',
        err
      )

      setProductUnits([])
      setSelectedUnit(null)
    } finally {
      setLoadingUnits(false)
    }
  }

  const closeProductModal = () => {
    setSelectedProduct(null)
    setSelectedUnit(null)
    setProductUnits([])
    setQuantity(1)
  }

  const getBaseUnitName = (product) => {
    if (!product?.base_unit) {
      return 'Unit'
    }

    return (
      product.base_unit.name ||
      product.base_unit.symbol ||
      'Unit'
    )
  }

  const getBaseUnitPrice = (product) => {
    return Number(product?.selling_price || 0)
  }

  const getSelectedUnitName = () => {
    if (selectedUnit) {
      return (
        selectedUnit.unit?.name ||
        selectedUnit.unit?.symbol ||
        'Unit'
      )
    }

    return getBaseUnitName(selectedProduct)
  }

  const getSelectedUnitPrice = () => {
    if (selectedUnit) {
      return Number(
        selectedUnit.selling_price ||
          selectedUnit.price ||
          0
      )
    }

    return getBaseUnitPrice(selectedProduct)
  }

  const getConversionRate = () => {
    if (selectedUnit) {
      return Number(
        selectedUnit.conversion_rate || 1
      )
    }

    return 1
  }

  const addToCart = () => {
    if (!selectedProduct) {
      return
    }

    const qty = Number(quantity)

    if (!qty || qty <= 0) {
      setError(
        'Jumlah barang harus lebih dari 0.'
      )
      return
    }

    const unitPrice = getSelectedUnitPrice()
    const unitName = getSelectedUnitName()
    const conversionRate = getConversionRate()

    const subtotal = qty * unitPrice

    /*
     * Stok produk disimpan dalam satuan dasar.
     *
     * Contoh:
     * 0.5 Kolbak × 500 Buah = 250 Buah
     */
    const baseQuantity =
      qty * conversionRate

    if (
      selectedProduct.stock !== undefined &&
      baseQuantity > Number(selectedProduct.stock)
    ) {
      setError(
        `Stok tidak mencukupi. Stok tersedia ${formatStock(
          selectedProduct.stock
        )} ${getBaseUnitName(selectedProduct)}.`
      )
      return
    }

    const cartItem = {
      product_id: selectedProduct.id,
      product: selectedProduct,

      unit_id:
        selectedUnit?.unit_id ||
        selectedProduct.base_unit_id,

      unit:
        selectedUnit?.unit ||
        selectedProduct.base_unit,

      unit_name: unitName,

      quantity: qty,

      base_quantity: baseQuantity,

      conversion_rate: conversionRate,

      price: unitPrice,

      subtotal,
    }

    setCart((prevCart) => {
      /*
       * Jika barang + satuan yang sama sudah ada,
       * gabungkan quantity.
       */
      const existingIndex = prevCart.findIndex(
        (item) =>
          item.product_id === cartItem.product_id &&
          item.unit_id === cartItem.unit_id
      )

      if (existingIndex === -1) {
        return [...prevCart, cartItem]
      }

      const updatedCart = [...prevCart]

      const existingItem =
        updatedCart[existingIndex]

      const newQuantity =
        Number(existingItem.quantity) +
        Number(cartItem.quantity)

      const newBaseQuantity =
        newQuantity * conversionRate

      if (
        selectedProduct.stock !== undefined &&
        newBaseQuantity >
          Number(selectedProduct.stock)
      ) {
        setError(
          `Jumlah melebihi stok ${formatStock(
            selectedProduct.stock
          )} ${getBaseUnitName(selectedProduct)}.`
        )

        return prevCart
      }

      updatedCart[existingIndex] = {
        ...existingItem,

        quantity: newQuantity,

        base_quantity:
          newBaseQuantity,

        subtotal:
          newQuantity * unitPrice,
      }

      return updatedCart
    })

    closeProductModal()
  }

  const updateCartQuantity = (
    index,
    newQuantity
  ) => {
    const qty = Number(newQuantity)

    if (!qty || qty <= 0) {
      return
    }

    setCart((prevCart) => {
      const updatedCart = [...prevCart]

      const item = updatedCart[index]

      const baseQuantity =
        qty *
        Number(
          item.conversion_rate || 1
        )

      if (
        item.product?.stock !== undefined &&
        baseQuantity >
          Number(item.product.stock)
      ) {
        setError(
          `Stok ${getProductDisplayName(
            item.product
          )} tidak mencukupi.`
        )

        return prevCart
      }

      updatedCart[index] = {
        ...item,

        quantity: qty,

        base_quantity:
          baseQuantity,

        subtotal:
          qty * Number(item.price),
      }

      return updatedCart
    })
  }

  const removeFromCart = (index) => {
    setCart((prevCart) =>
      prevCart.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    )
  }

  const clearCart = () => {
    setCart([])
    setPaid('')
    setPaymentMethod('cash')
    setError('')
  }

  /*
  |--------------------------------------------------------------------------
  | Ganti metode pembayaran
  |--------------------------------------------------------------------------
  */
  const handlePaymentMethodChange = (
    method
  ) => {
    setPaymentMethod(method)
    setError('')

    /*
     * QRIS dan Transfer tidak membutuhkan
     * input nominal dari kasir.
     */
    if (method !== 'cash') {
      setPaid('')
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Nominal pembayaran cepat
  |--------------------------------------------------------------------------
  */
  const setQuickPayment = (amount) => {
    setPaid(String(amount))
    setError('')
  }

  /*
  |--------------------------------------------------------------------------
  | Proses transaksi
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async () => {
    setError('')

    if (cart.length === 0) {
      setError('Keranjang masih kosong.')
      return
    }

    if (paymentMethod === 'cash') {
      if (paidAmount < total) {
        setError(
          'Jumlah pembayaran masih kurang.'
        )
        return
      }
    } else {
      if (total <= 0) {
        setError(
          'Total transaksi harus lebih dari 0.'
        )
        return
      }
    }

    try {
      setLoadingTransaction(true)

      /*
       * Untuk:
       *
       * CASH:
       * paid = nominal uang dari kasir
       *
       * QRIS / TRANSFER:
       * paid = 0
       *
       * Backend akan membuat payment_status:
       * pending
       *
       * Setelah admin konfirmasi:
       * paid = total
       * payment_status = completed
       * stok berkurang
       */
      const payload = {
        customer_id: selectedCustomer
          ? Number(selectedCustomer)
          : null,

        payment_method:
          paymentMethod,

        paid: paidAmount,

        items: cart.map((item) => ({
          product_id:
            Number(item.product_id),

          unit_id:
            Number(item.unit_id),

          quantity:
            Number(item.quantity),
        })),
      }

      console.log(
        'TRANSACTION PAYLOAD:',
        payload
      )

      const response =
        await api.post(
          '/transactions',
          payload
        )

      console.log(
        'TRANSACTION SUCCESS:',
        response.data
      )

      const transaction =
        response.data?.data ||
        response.data

      setCart([])
      setPaid('')
      setSelectedCustomer('')
      setPaymentMethod('cash')

      await fetchProducts()

      if (transaction?.id) {
        navigate(
          `/transactions/${transaction.id}`
        )
      } else {
        setError(
          'Transaksi berhasil disimpan, tetapi ID transaksi tidak ditemukan.'
        )
      }
    } catch (err) {
      console.error(
        'TRANSACTION ERROR:',
        err.response?.data || err
      )

      if (
        err.response?.status === 422
      ) {
        const validationErrors =
          err.response?.data?.errors

        if (validationErrors) {
          const messages =
            Object.values(
              validationErrors
            )
              .flat()
              .join(' ')

          setError(messages)
        } else {
          setError(
            err.response?.data
              ?.message ||
              'Data transaksi tidak valid.'
          )
        }
      } else {
        setError(
          err.response?.data
            ?.message ||
            'Gagal menyimpan transaksi.'
        )
      }
    } finally {
      setLoadingTransaction(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* =========================================================
            HEADER
        ========================================================== */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Kasir
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Buat transaksi penjualan dan kelola keranjang belanja.
          </p>
        </div>

        {/* =========================================================
            ERROR
        ========================================================== */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError('')}
              title="Tutup pesan"
              aria-label="Tutup pesan"
              className="rounded-lg p-1 transition hover:bg-red-100"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

          {/* =======================================================
              LEFT
          ======================================================== */}
          <div className="space-y-6 xl:col-span-2">

            {/* =====================================================
                CUSTOMER
            ====================================================== */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Pelanggan
              </label>

              <select
                value={selectedCustomer}
                onChange={(e) =>
                  setSelectedCustomer(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  Pelanggan Umum
                </option>

                {!loadingCustomers &&
                  customers
                    .filter(
                      (customer) =>
                        customer.is_active !==
                        false
                    )
                    .map((customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.name}
                        {customer.phone
                          ? ` - ${customer.phone}`
                          : ''}
                      </option>
                    ))}
              </select>
            </div>

            {/* =====================================================
                PRODUCTS
            ====================================================== */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  Pilih Barang
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Cari berdasarkan nama, merek, ukuran, atau barcode.
                </p>
              </div>

              {/* Search */}
              <div className="relative mb-5">

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Cari nama, merek, ukuran, atau barcode..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 pl-11 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>

              {/* Product list */}
              {loadingProducts ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  Memuat data produk...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center">

                  <p className="font-medium text-gray-700">
                    Barang tidak ditemukan
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Coba gunakan kata pencarian lain.
                  </p>

                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                  {filteredProducts
                    .filter(
                      (product) =>
                        product.is_active !==
                        false
                    )
                    .map((product) => (
                      <div
                        key={product.id}
                        className="rounded-xl border border-gray-200 p-4 transition hover:border-blue-300 hover:shadow-sm"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <h3 className="truncate font-semibold text-gray-900">
                              {getProductDisplayName(
                                product
                              )}
                            </h3>

                            {getProductSize(
                              product
                            ) ? (
                              <p className="mt-1 text-sm font-medium text-gray-600">
                                {getProductSize(
                                  product
                                )}
                              </p>
                            ) : null}

                            <p className="mt-1 text-xs text-gray-500">
                              {product.barcode
                                ? `Barcode: ${product.barcode}`
                                : 'Tanpa barcode'}
                            </p>

                          </div>

                          <span className="shrink-0 rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
                            {getBaseUnitName(
                              product
                            )}
                          </span>

                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">

                          <div>
                            <p className="text-xs text-gray-500">
                              Harga
                            </p>

                            <p className="mt-1 font-bold text-gray-900">
                              {formatRupiah(
                                product.selling_price
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">
                              Stok
                            </p>

                            <p
                              className={`mt-1 font-bold ${
                                Number(
                                  product.stock
                                ) <=
                                Number(
                                  product.minimum_stock ||
                                    product.min_stock ||
                                    0
                                )
                                  ? 'text-red-600'
                                  : 'text-gray-900'
                              }`}
                            >
                              {formatStock(
                                product.stock
                              )}{' '}
                              {getBaseUnitName(
                                product
                              )}
                            </p>
                          </div>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            openProductModal(
                              product
                            )
                          }
                          title={`Tambah ${getProductDisplayName(
                            product
                          )} ke keranjang`}
                          aria-label={`Tambah ${getProductDisplayName(
                            product
                          )} ke keranjang`}
                          className="mt-4 flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-white transition hover:bg-blue-700"
                        >
                          <ShoppingCart
                            size={20}
                          />
                        </button>

                      </div>
                    ))}

                </div>
              )}
            </div>
          </div>

          {/* =======================================================
              RIGHT - CART
          ======================================================== */}
          <div className="xl:col-span-1">

           <div className="rounded-2xl border border-gray-200 bg-white shadow-sm xl:sticky xl:top-6">

              {/* Cart Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-5">

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Keranjang
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    {cart.length} jenis barang
                  </p>
                </div>

                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    title="Kosongkan keranjang"
                    aria-label="Kosongkan keranjang"
                    className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                )}

              </div>

              {/* Cart Items */}
              <div className="max-h-[360px] space-y-4 overflow-y-auto p-4 sm:max-h-[430px] sm:p-5">

                {cart.length === 0 ? (
                  <div className="py-12 text-center">

                    <ShoppingCart
                      size={42}
                      className="mx-auto text-gray-300"
                    />

                    <p className="mt-3 font-semibold text-gray-700">
                      Keranjang kosong
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Tambahkan barang untuk membuat transaksi.
                    </p>

                  </div>
                ) : (
                  cart.map((item, index) => (
                    <div
                      key={`${item.product_id}-${item.unit_id}-${index}`}
                      className="rounded-xl border border-gray-200 p-3 sm:p-4"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <h3 className="font-semibold text-gray-900">
                            {getProductDisplayName(
                              item.product
                            )}
                          </h3>

                          {getProductSize(
                            item.product
                          ) ? (
                            <p className="mt-1 text-xs font-medium text-gray-600">
                              {getProductSize(
                                item.product
                              )}
                            </p>
                          ) : null}

                          <p className="mt-1 text-xs text-gray-500">
                            {formatRupiah(
                              item.price
                            )}{' '}
                            / {item.unit_name}
                          </p>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(index)
                          }
                          title="Hapus barang"
                          aria-label="Hapus barang"
                          className="shrink-0 rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 size={17} />
                        </button>

                      </div>
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      

                        <div className="flex w-full items-center rounded-lg border border-gray-300 sm:w-auto">

                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                index,
                                Number(
                                  item.quantity
                                ) - 1
                              )
                            }
                            title="Kurangi jumlah"
                            aria-label="Kurangi jumlah"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-l-lg text-gray-600 transition hover:bg-gray-50 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5"
                          >
                            <Minus size={16} />
                          </button>

                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) =>
                              updateCartQuantity(
                                index,
                                e.target.value
                              )
                            }
                            className="min-w-0 flex-1 border-x border-gray-300 py-2 text-center text-sm outline-none sm:w-16 sm:flex-none sm:py-1.5"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                index,
                                Number(
                                  item.quantity
                                ) + 1
                              )
                            }
                            title="Tambah jumlah"
                            aria-label="Tambah jumlah"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-r-lg text-gray-600 transition hover:bg-gray-50 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5"
                          >
                            <Plus size={16} />
                          </button>

                        </div>

                        <p className="font-bold text-gray-900">
                          {formatRupiah(
                            item.subtotal
                          )}
                        </p>

                      </div>

                    </div>
                  ))
                )}

              </div>

              {/* =====================================================
                  PAYMENT SUMMARY
              ====================================================== */}
              <div className="border-t border-gray-200 p-4 sm:p-5">

                {/* Total */}
                <div className="flex items-center justify-between">

                  <span className="text-sm text-gray-500">
                    Total
                  </span>

                  <span className="text-lg font-bold text-gray-900 sm:text-xl">
                    {formatRupiah(total)}
                  </span>

                </div>

                {/* Payment Method */}
                <div className="mt-5">

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Metode Pembayaran
                  </label>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">

                    {/* Cash */}
                    <button
                      type="button"
                      onClick={() =>
                        handlePaymentMethodChange(
                          'cash'
                        )
                      }
                      title="Pembayaran Tunai"
                      aria-label="Pembayaran Tunai"
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition ${
                        paymentMethod ===
                        'cash'
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Banknote size={20} />

                      <span>Tunai</span>

                    </button>

                    {/* Transfer */}
                    <button
                      type="button"
                      onClick={() =>
                        handlePaymentMethodChange(
                          'transfer'
                        )
                      }
                      title="Pembayaran Transfer"
                      aria-label="Pembayaran Transfer"
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition ${
                        paymentMethod ===
                        'transfer'
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <CreditCard size={20} />

                      <span>Transfer</span>

                    </button>

                    {/* QRIS */}
                    <button
                      type="button"
                      onClick={() =>
                        handlePaymentMethodChange(
                          'qris'
                        )
                      }
                      title="Pembayaran QRIS"
                      aria-label="Pembayaran QRIS"
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition ${
                        paymentMethod ===
                        'qris'
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <QrCode size={20} />

                      <span>QRIS</span>

                    </button>

                  </div>

                </div>

                {/* =================================================
                    CASH PAYMENT
                ================================================== */}
                {paymentMethod === 'cash' && (
                  <div className="mt-5">

                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Uang Dibayar
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={paid}
                      onChange={(e) =>
                        setPaid(
                          e.target.value
                        )
                      }
                      placeholder="Masukkan jumlah pembayaran"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    {/* Quick payment */}
                    {total > 0 && (
                      <div className="mt-3">

                        <p className="mb-2 text-xs text-gray-500">
                          Nominal cepat
                        </p>

                        <div className="grid grid-cols-4 gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              setQuickPayment(
                                total
                              )
                            }
                            title="Uang pas"
                            className="rounded-lg border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                          >
                            Uang Pas
                          </button>

                          {[50000, 100000, 200000].map(
                            (amount) => (
                              <button
                                key={amount}
                                type="button"
                                onClick={() =>
                                  setQuickPayment(
                                    amount
                                  )
                                }
                                title={`Bayar ${formatRupiah(
                                  amount
                                )}`}
                                className="rounded-lg border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                              >
                                {amount ===
                                50000
                                  ? '50 Rb'
                                  : amount ===
                                    100000
                                  ? '100 Rb'
                                  : '200 Rb'}
                              </button>
                            )
                          )}

                        </div>

                      </div>
                    )}

                  </div>
                )}

                {/* =================================================
                    QRIS PAYMENT
                ================================================== */}
                {paymentMethod === 'qris' && (
                  <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">

                    <div className="text-center">

                      <div className="flex items-center justify-center gap-2">

                        <QrCode
                          size={20}
                          className="text-blue-600"
                        />

                        <p className="text-sm font-bold text-blue-700">
                          Pembayaran QRIS
                        </p>

                      </div>

                      <p className="mt-1 text-xs text-blue-600">
                        Scan QRIS toko menggunakan aplikasi pembayaran.
                      </p>

                      {/* QRIS Image */}
                      <div className="mx-auto mt-4 flex h-56 w-56 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">

                        {!qrisImageError ? (
                          <img
                            src={
                              STORE_PAYMENT_INFO.qrisImage
                            }
                            alt="QRIS Toko"
                            className="h-full w-full object-contain"
                            onError={() =>
                              setQrisImageError(
                                true
                              )
                            }
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center">

                            <QrCode
                              size={70}
                              className="text-gray-300"
                            />

                            <p className="mt-3 text-sm font-semibold text-gray-500">
                              QRIS belum tersedia
                            </p>

                            <p className="mt-1 px-4 text-xs leading-5 text-gray-400">
                              Simpan gambar QRIS toko sebagai
                              <span className="font-semibold">
                                {' '}
                                qris-toko.png
                              </span>
                              {' '}di folder
                              <span className="font-semibold">
                                {' '}
                                public
                              </span>
                              .
                            </p>

                          </div>
                        )}

                      </div>

                      <p className="mt-3 text-sm font-semibold text-gray-700">
                        {STORE_PAYMENT_INFO.qrisName}
                      </p>

                      {/* Total */}
                      <div className="mt-4 rounded-xl border border-blue-200 bg-white p-3">

                        <p className="text-xs text-gray-500">
                          Total yang harus dibayar
                        </p>

                        <p className="mt-1 text-xl font-bold text-blue-700">
                          {formatRupiah(total)}
                        </p>

                      </div>

                      {/* Pending info */}
                      <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-left">

                        <p className="text-xs font-semibold text-yellow-700">
                          Menunggu pembayaran
                        </p>

                        <p className="mt-1 text-xs leading-5 text-yellow-700">
                          Setelah pelanggan melakukan pembayaran,
                          transaksi akan berstatus pending sampai
                          admin melakukan konfirmasi.
                        </p>

                      </div>

                    </div>

                  </div>
                )}

                {/* =================================================
                    TRANSFER PAYMENT
                ================================================== */}
                {paymentMethod === 'transfer' && (
                  <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">

                    <div className="flex items-center gap-2">

                      <CreditCard
                        size={20}
                        className="text-blue-600"
                      />

                      <p className="text-sm font-bold text-blue-700">
                        Pembayaran Transfer
                      </p>

                    </div>

                    <p className="mt-1 break-words text-xs leading-5 text-blue-600">
                      Silakan transfer sesuai total transaksi ke rekening toko berikut.
                    </p>

                    {/* Bank Information */}
                    <div className="mt-4 space-y-3">

                      <div className="rounded-xl border border-blue-100 bg-white p-4">

                        <p className="text-xs text-gray-500">
                          Bank
                        </p>

                        <p className="mt-1 text-base font-bold text-gray-900">
                          {STORE_PAYMENT_INFO.bankName}
                        </p>

                      </div>

                      <div className="rounded-xl border border-blue-100 bg-white p-4">

                        <p className="text-xs text-gray-500">
                          Nomor Rekening
                        </p>

                        <p className="mt-1 text-lg font-bold tracking-wide text-gray-900">
                          {STORE_PAYMENT_INFO.accountNumber}
                        </p>

                      </div>

                      <div className="rounded-xl border border-blue-100 bg-white p-4">

                        <p className="text-xs text-gray-500">
                          Atas Nama
                        </p>

                        <p className="mt-1 text-base font-bold text-gray-900">
                          {STORE_PAYMENT_INFO.accountName}
                        </p>

                      </div>

                    </div>

                    {/* Total */}
                    <div className="mt-4 rounded-xl border border-blue-200 bg-white p-3">

                      <p className="text-xs text-gray-500">
                        Total yang harus ditransfer
                      </p>

                      <p className="mt-1 text-xl font-bold text-blue-700">
                        {formatRupiah(total)}
                      </p>

                    </div>

                    {/* Pending info */}
                    <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3">

                      <p className="text-xs font-semibold text-yellow-700">
                        Menunggu konfirmasi
                      </p>

                      <p className="mt-1 text-xs leading-5 text-yellow-700">
                        Setelah pelanggan melakukan transfer,
                        transaksi akan berstatus pending sampai
                        admin melakukan konfirmasi pembayaran.
                      </p>

                    </div>

                  </div>
                )}

                {/* =================================================
                    PAYMENT SUMMARY
                ================================================== */}
                <div className="mt-4 space-y-3">

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
                      {paymentMethod === 'cash'
                        ? 'Dibayar'
                        : 'Status Pembayaran'}
                    </span>

                    {paymentMethod === 'cash' ? (
                      <span className="font-semibold text-gray-900">
                        {formatRupiah(
                          paidAmount
                        )}
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                        Menunggu Konfirmasi
                      </span>
                    )}

                  </div>

                  {paymentMethod === 'cash' && (
                    <div className="flex items-center justify-between">

                      <span className="text-sm text-gray-500">
                        Kembalian
                      </span>

                      <span
                        className={`font-bold ${
                          change < 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {formatRupiah(
                          change
                        )}
                      </span>

                    </div>
                  )}

                </div>

                {/* =================================================
                    PROCESS TRANSACTION
                ================================================== */}
                <button
                  type="button"
                  disabled={
                    loadingTransaction ||
                    !isPaymentValid
                  }
                  onClick={handleSubmit}
                  title={
                    loadingTransaction
                      ? 'Menyimpan transaksi...'
                      : paymentMethod === 'cash'
                      ? 'Selesaikan transaksi tunai'
                      : 'Buat transaksi pending'
                  }
                  aria-label={
                    loadingTransaction
                      ? 'Menyimpan transaksi'
                      : paymentMethod === 'cash'
                      ? 'Selesaikan transaksi tunai'
                      : 'Buat transaksi pending'
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >

                  {loadingTransaction ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                      <span className="text-sm font-semibold">
                        Memproses...
                      </span>
                    </>
                  ) : (
                    <>
                      <Check size={21} />

                      <span className="text-sm font-semibold">
                        {paymentMethod === 'cash'
                          ? 'Proses Transaksi'
                          : 'Buat Transaksi Pending'}
                      </span>
                    </>
                  )}

                </button>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =============================================================
          PRODUCT MODAL
      ============================================================= */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-5">

              <div className="min-w-0">

                <h2 className="text-lg font-bold text-gray-900">
                  Tambah Barang
                </h2>

                <p className="mt-1 font-medium text-gray-700">
                  {getProductDisplayName(
                    selectedProduct
                  )}
                </p>

                {getProductSize(
                  selectedProduct
                ) ? (
                  <p className="mt-0.5 text-sm text-gray-500">
                    {getProductSize(
                      selectedProduct
                    )}
                  </p>
                ) : null}

              </div>

              <button
                type="button"
                onClick={closeProductModal}
                title="Tutup"
                aria-label="Tutup"
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={21} />
              </button>

            </div>

            <div className="space-y-5 p-5">

              {/* Stock */}
              <div className="rounded-xl bg-gray-50 p-4">

                <div className="flex justify-between">

                  <span className="text-sm text-gray-500">
                    Stok tersedia
                  </span>

                  <span className="font-semibold text-gray-900">
                    {formatStock(
                      selectedProduct.stock
                    )}{' '}
                    {getBaseUnitName(
                      selectedProduct
                    )}
                  </span>

                </div>

              </div>

              {/* Unit */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Satuan Penjualan
                </label>

                {loadingUnits ? (
                  <div className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-500">
                    Memuat satuan...
                  </div>
                ) : (
                  <select
                    value={
                      selectedUnit?.id ||
                      'base'
                    }
                    onChange={(e) => {
                      const value =
                        e.target.value

                      if (
                        value === 'base'
                      ) {
                        setSelectedUnit(
                          null
                        )
                        return
                      }

                      const unit =
                        productUnits.find(
                          (item) =>
                            String(
                              item.id
                            ) === value
                        )

                      setSelectedUnit(
                        unit || null
                      )
                    }}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >

                    <option value="base">
                      {getBaseUnitName(
                        selectedProduct
                      )}{' '}
                      —{' '}
                      {formatRupiah(
                        getBaseUnitPrice(
                          selectedProduct
                        )
                      )}
                    </option>

                    {productUnits.map(
                      (item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.unit?.name ||
                            item.unit?.symbol ||
                            'Unit'}{' '}
                          —{' '}
                          {formatRupiah(
                            item.selling_price ||
                              item.price ||
                              0
                          )}
                        </option>
                      )
                    )}

                  </select>
                )}

              </div>

              {/* Quantity */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Jumlah
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* Price */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                <div className="flex justify-between text-sm">

                  <span className="text-gray-600">
                    Harga /{' '}
                    {getSelectedUnitName()}
                  </span>

                  <span className="font-semibold">
                    {formatRupiah(
                      getSelectedUnitPrice()
                    )}
                  </span>

                </div>

                <div className="mt-2 flex justify-between">

                  <span className="font-semibold text-gray-700">
                    Subtotal
                  </span>

                  <span className="text-lg font-bold text-blue-600">
                    {formatRupiah(
                      Number(
                        quantity || 0
                      ) *
                        getSelectedUnitPrice()
                    )}
                  </span>

                </div>

              </div>

              {/* Base quantity info */}
              {selectedUnit && (
                <div className="text-xs text-gray-500">
                  {quantity}{' '}
                  {getSelectedUnitName()} ={' '}
                  {Number(
                    quantity || 0
                  ) *
                    getConversionRate()}{' '}
                  {getBaseUnitName(
                    selectedProduct
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={closeProductModal}
                  title="Batal"
                  aria-label="Batal"
                  className="flex flex-1 items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-gray-700 transition hover:bg-gray-50"
                >
                  <X size={20} />
                </button>

                <button
                  type="button"
                  onClick={addToCart}
                  title="Tambahkan ke keranjang"
                  aria-label="Tambahkan ke keranjang"
                  className="flex flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-white transition hover:bg-blue-700"
                >
                  <ShoppingCart
                    size={20}
                  />
                </button>

              </div>

            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}