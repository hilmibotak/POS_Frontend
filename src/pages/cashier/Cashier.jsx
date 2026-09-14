import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export default function Cashier() {
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
  const [paid, setPaid] = useState('')
  const [loadingTransaction, setLoadingTransaction] = useState(false)

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
      const barcode = String(product.barcode || '').toLowerCase()

      return (
        name.includes(keyword) ||
        barcode.includes(keyword)
      )
    })
  }, [products, search])

  const total = useMemo(() => {
    return cart.reduce((sum, item) => {
      return sum + Number(item.subtotal || 0)
    }, 0)
  }, [cart])

  const paidAmount = Number(paid) || 0
  const change = paidAmount - total

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

      /*
       * Kalau produk punya satuan tambahan,
       * pilih satuan default jika tersedia.
       */
      const defaultUnit =
        units.find((unit) => unit.is_default) ||
        units[0]

      if (defaultUnit) {
        setSelectedUnit(defaultUnit)
      }
    } catch (err) {
      console.error('Gagal mengambil satuan produk:', err)

      /*
       * Kalau endpoint satuan kosong/error,
       * tetap gunakan satuan dasar produk.
       */
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
      setError('Jumlah barang harus lebih dari 0.')
      return
    }

    const unitPrice = getSelectedUnitPrice()
    const unitName = getSelectedUnitName()
    const conversionRate = getConversionRate()

    const subtotal = qty * unitPrice

    /*
     * Stok produk disimpan dalam satuan dasar.
     * Contoh:
     * 0.5 Kolbak × 500 Buah = 250 Buah
     */
    const baseQuantity = qty * conversionRate

    if (
      selectedProduct.stock !== undefined &&
      baseQuantity > Number(selectedProduct.stock)
    ) {
      setError(
        `Stok tidak mencukupi. Stok tersedia ${selectedProduct.stock} ${getBaseUnitName(selectedProduct)}.`
      )
      return
    }

    const cartItem = {
      product_id: selectedProduct.id,
      product: selectedProduct,
      unit_id: selectedUnit?.unit_id || selectedProduct.base_unit_id,
      unit: selectedUnit?.unit || selectedProduct.base_unit,
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

      const existingItem = updatedCart[existingIndex]

      const newQuantity =
        Number(existingItem.quantity) +
        Number(cartItem.quantity)

      const newBaseQuantity =
        newQuantity * conversionRate

      if (
        selectedProduct.stock !== undefined &&
        newBaseQuantity > Number(selectedProduct.stock)
      ) {
        setError(
          `Jumlah melebihi stok ${selectedProduct.stock} ${getBaseUnitName(selectedProduct)}.`
        )

        return prevCart
      }

      updatedCart[existingIndex] = {
        ...existingItem,
        quantity: newQuantity,
        base_quantity: newBaseQuantity,
        subtotal: newQuantity * unitPrice,
      }

      return updatedCart
    })

    closeProductModal()
  }

  const updateCartQuantity = (index, newQuantity) => {
    const qty = Number(newQuantity)

    if (!qty || qty <= 0) {
      return
    }

    setCart((prevCart) => {
      const updatedCart = [...prevCart]
      const item = updatedCart[index]

      const baseQuantity =
        qty * Number(item.conversion_rate || 1)

      if (
        item.product?.stock !== undefined &&
        baseQuantity > Number(item.product.stock)
      ) {
        setError(
          `Stok ${item.product.name} tidak mencukupi.`
        )

        return prevCart
      }

      updatedCart[index] = {
        ...item,
        quantity: qty,
        base_quantity: baseQuantity,
        subtotal: qty * Number(item.price),
      }

      return updatedCart
    })
  }

  const removeFromCart = (index) => {
    setCart((prevCart) =>
      prevCart.filter((_, itemIndex) => itemIndex !== index)
    )
  }

  const clearCart = () => {
    setCart([])
    setPaid('')
    setError('')
  }

 const handleSubmit = async () => {
  setError('')

  if (cart.length === 0) {
    setError('Keranjang masih kosong.')
    return
  }

  if (paidAmount < total) {
    setError('Jumlah pembayaran masih kurang.')
    return
  }

  try {
    setLoadingTransaction(true)

    const payload = {
      customer_id: selectedCustomer
        ? Number(selectedCustomer)
        : null,

      paid: paidAmount,

      items: cart.map((item) => ({
        product_id: Number(item.product_id),
        unit_id: Number(item.unit_id),
        quantity: Number(item.quantity),
      })),
    }

    console.log('TRANSACTION PAYLOAD:', payload)

    const response = await api.post(
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
    
    await fetchProducts()

    if (transaction?.id) {
      navigate(`/transactions/${transaction.id}`)
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

    if (err.response?.status === 422) {
      const validationErrors =
        err.response?.data?.errors

      if (validationErrors) {
        const messages = Object.values(
          validationErrors
        )
          .flat()
          .join(' ')

        setError(messages)
      } else {
        setError(
          err.response?.data?.message ||
            'Data transaksi tidak valid.'
        )
      }
    } else {
      setError(
        err.response?.data?.message ||
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Kasir
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Buat transaksi penjualan dan kelola keranjang belanja.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError('')}
              className="font-semibold"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* LEFT */}
          <div className="space-y-6 xl:col-span-2">
            {/* Customer */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Pelanggan
              </label>

              <select
                value={selectedCustomer}
                onChange={(e) =>
                  setSelectedCustomer(e.target.value)
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
                        customer.is_active !== false
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

            {/* Products */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  Pilih Barang
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Cari barang berdasarkan nama atau barcode.
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
                  placeholder="Cari nama barang atau barcode..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 pl-11 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
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
                        product.is_active !== false
                    )
                    .map((product) => (
                      <div
                        key={product.id}
                        className="rounded-xl border border-gray-200 p-4 transition hover:border-blue-300 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-gray-900">
                              {product.name}
                            </h3>

                            <p className="mt-1 text-xs text-gray-500">
                              {product.barcode
                                ? `Barcode: ${product.barcode}`
                                : 'Tanpa barcode'}
                            </p>
                          </div>

                          <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
                            {getBaseUnitName(product)}
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
                                Number(product.stock) <=
                                Number(
                                  product.minimum_stock ||
                                    product.min_stock ||
                                    0
                                )
                                  ? 'text-red-600'
                                  : 'text-gray-900'
                              }`}
                            >
                              {product.stock}{' '}
                              {getBaseUnitName(product)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            openProductModal(product)
                          }
                          className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          + Tambah ke Keranjang
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT - CART */}
          <div className="xl:col-span-1">
            <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
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
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Kosongkan
                  </button>
                )}
              </div>

              <div className="max-h-[430px] space-y-4 overflow-y-auto p-5">
                {cart.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="text-4xl">🛒</div>

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
                      className="rounded-xl border border-gray-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900">
                            {item.product.name}
                          </h3>

                          <p className="mt-1 text-xs text-gray-500">
                            {formatRupiah(item.price)} /{' '}
                            {item.unit_name}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(index)
                          }
                          className="text-lg text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center rounded-lg border border-gray-300">
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                index,
                                Number(item.quantity) - 1
                              )
                            }
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50"
                          >
                            −
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
                            className="w-16 border-x border-gray-300 py-1.5 text-center text-sm outline-none"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                index,
                                Number(item.quantity) + 1
                              )
                            }
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50"
                          >
                            +
                          </button>
                        </div>

                        <p className="font-bold text-gray-900">
                          {formatRupiah(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Summary */}
              <div className="border-t border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Total
                  </span>

                  <span className="text-xl font-bold text-gray-900">
                    {formatRupiah(total)}
                  </span>
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Uang Dibayar
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={paid}
                    onChange={(e) =>
                      setPaid(e.target.value)
                    }
                    placeholder="Masukkan jumlah pembayaran"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
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
                      change > 0 ? change : 0
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={
                    loadingTransaction ||
                    cart.length === 0 ||
                    paidAmount < total
                  }
                  onClick={handleSubmit}
                  className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {loadingTransaction
                    ? 'Menyimpan...'
                    : 'Simpan Transaksi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCT MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Tambah Barang
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedProduct.name}
                </p>
              </div>

              <button
                type="button"
                onClick={closeProductModal}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">
                    Stok tersedia
                  </span>

                  <span className="font-semibold text-gray-900">
                    {selectedProduct.stock}{' '}
                    {getBaseUnitName(selectedProduct)}
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
                    value={selectedUnit?.id || 'base'}
                    onChange={(e) => {
                      const value = e.target.value

                      if (value === 'base') {
                        setSelectedUnit(null)
                        return
                      }

                      const unit = productUnits.find(
                        (item) =>
                          String(item.id) === value
                      )

                      setSelectedUnit(unit || null)
                    }}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="base">
                      {getBaseUnitName(selectedProduct)} —{' '}
                      {formatRupiah(
                        getBaseUnitPrice(selectedProduct)
                      )}
                    </option>

                    {productUnits.map((item) => (
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
                    ))}
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
                    setQuantity(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Price */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Harga / {getSelectedUnitName()}
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
                      Number(quantity || 0) *
                        getSelectedUnitPrice()
                    )}
                  </span>
                </div>
              </div>

              {/* Base quantity info */}
              {selectedUnit && (
                <div className="text-xs text-gray-500">
                  {quantity} {getSelectedUnitName()} =
                  {' '}
                  {Number(quantity || 0) *
                    getConversionRate()}{' '}
                  {getBaseUnitName(selectedProduct)}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeProductModal}
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={addToCart}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Tambahkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}