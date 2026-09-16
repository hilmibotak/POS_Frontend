import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Edit,
  Package,
  Plus,
  Search,
  Settings2,
  Trash2,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'

function Products() {
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [units, setUnits] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [form, setForm] = useState({
    name: '',
    brand: '',
    size: '',
    barcode: '',
    category_id: '',
    base_unit_id: '',
    purchase_price: '',
    selling_price: '',
    stock: '',
    minimum_stock: '',
    is_active: true,
  })

  const LOW_STOCK_LIMIT = 20

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      const [
        productsResponse,
        categoriesResponse,
        unitsResponse,
      ] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/units'),
      ])

      const productsResponseData =
        productsResponse.data?.data

      const categoriesResponseData =
        categoriesResponse.data?.data

      const unitsResponseData =
        unitsResponse.data?.data

      let productsData = []

      if (Array.isArray(productsResponseData)) {
        productsData = productsResponseData
      } else if (
        Array.isArray(productsResponseData?.data)
      ) {
        productsData = productsResponseData.data
      } else if (Array.isArray(productsResponse.data)) {
        productsData = productsResponse.data
      }

      let categoriesData = []

      if (Array.isArray(categoriesResponseData)) {
        categoriesData = categoriesResponseData
      } else if (
        Array.isArray(categoriesResponseData?.data)
      ) {
        categoriesData = categoriesResponseData.data
      } else if (
        Array.isArray(categoriesResponse.data)
      ) {
        categoriesData = categoriesResponse.data
      }

      let unitsData = []

      if (Array.isArray(unitsResponseData)) {
        unitsData = unitsResponseData
      } else if (
        Array.isArray(unitsResponseData?.data)
      ) {
        unitsData = unitsResponseData.data
      } else if (Array.isArray(unitsResponse.data)) {
        unitsData = unitsResponse.data
      }

      setProducts(productsData)
      setCategories(categoriesData)
      setUnits(unitsData)
    } catch (error) {
      console.error(
        'Gagal mengambil data produk:',
        error
      )

      setError(
        error.response?.data?.message ||
          'Gagal mengambil data produk.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(value) || 0)
  }

  const formatStock = (value) => {
    const number = Number(value ?? 0)

    if (Number.isInteger(number)) {
      return number.toString()
    }

    return number.toLocaleString('id-ID', {
      maximumFractionDigits: 3,
    })
  }

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setForm((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }))
  }

  const resetForm = () => {
    setForm({
      name: '',
      brand: '',
      size: '',
      barcode: '',
      category_id: '',
      base_unit_id: '',
      purchase_price: '',
      selling_price: '',
      stock: '',
      minimum_stock: '',
      is_active: true,
    })

    setEditingProduct(null)
  }

  const openCreateModal = () => {
    resetForm()

    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const openEditModal = (product) => {
    setEditingProduct(product)

    setForm({
      name: product.name || '',
      brand: product.brand || '',
      size: product.size || '',
      barcode: product.barcode || '',
      category_id:
        product.category_id ||
        product.category?.id ||
        '',
      base_unit_id:
        product.base_unit_id ||
        product.base_unit?.id ||
        '',
      purchase_price:
        product.purchase_price ?? '',
      selling_price:
        product.selling_price ?? '',
      stock:
        product.stock ?? '',
      minimum_stock:
        product.minimum_stock ??
        product.min_stock ??
        product.min ??
        '',
      is_active:
        product.is_active !== false,
    })

    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
    resetForm()
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')

    if (!form.name.trim()) {
      setError('Nama barang wajib diisi.')
      return
    }

    if (!form.category_id) {
      setError('Kategori wajib dipilih.')
      return
    }

    if (!form.base_unit_id) {
      setError('Satuan dasar wajib dipilih.')
      return
    }

    if (
      form.purchase_price === '' ||
      Number(form.purchase_price) < 0
    ) {
      setError('Harga beli tidak valid.')
      return
    }

    if (
      form.selling_price === '' ||
      Number(form.selling_price) < 0
    ) {
      setError('Harga jual tidak valid.')
      return
    }

    if (
      form.stock === '' ||
      Number(form.stock) < 0
    ) {
      setError('Stok tidak valid.')
      return
    }

    if (
      form.minimum_stock === '' ||
      Number(form.minimum_stock) < 0
    ) {
      setError('Minimum stok tidak valid.')
      return
    }

    try {
      setSaving(true)
      setSuccess('')

      const payload = {
        name: form.name.trim(),

        brand:
          form.brand.trim() || null,

        size:
          form.size.trim() || null,

        barcode:
          form.barcode.trim() || null,

        category_id: Number(
          form.category_id
        ),

        base_unit_id: Number(
          form.base_unit_id
        ),

        purchase_price: Number(
          form.purchase_price
        ),

        selling_price: Number(
          form.selling_price
        ),

        stock: Number(
          form.stock
        ),

        minimum_stock: Number(
          form.minimum_stock
        ),

        is_active:
          form.is_active,
      }

      if (editingProduct) {
        await api.put(
          `/products/${editingProduct.id}`,
          payload
        )

        setSuccess(
          'Produk berhasil diperbarui.'
        )
      } else {
        await api.post(
          '/products',
          payload
        )

        setSuccess(
          'Produk berhasil ditambahkan.'
        )
      }

      await fetchData()

      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error(
        'Gagal menyimpan produk:',
        error
      )

      const validationErrors =
        error.response?.data?.errors

      if (validationErrors) {
        const firstError =
          Object.values(validationErrors)
            .flat()[0]

        setError(
          firstError ||
            'Data produk tidak valid.'
        )
      } else {
        setError(
          error.response?.data?.message ||
            'Gagal menyimpan produk.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Yakin ingin menonaktifkan produk "${product.name}"?`
    )

    if (!confirmed) return

    try {
      setError('')
      setSuccess('')

      await api.delete(
        `/products/${product.id}`
      )

      setSuccess(
        'Produk berhasil dinonaktifkan.'
      )

      await fetchData()
    } catch (error) {
      console.error(
        'Gagal menonaktifkan produk:',
        error
      )

      setError(
        error.response?.data?.message ||
          'Gagal menonaktifkan produk.'
      )
    }
  }

  const getCategoryName = (product) => {
    return (
      product.category?.name ||
      categories.find(
        (category) =>
          Number(category.id) ===
          Number(product.category_id)
      )?.name ||
      '-'
    )
  }

  const getUnitName = (product) => {
    return (
      product.base_unit?.name ||
      product.unit?.name ||
      units.find(
        (unit) =>
          Number(unit.id) ===
          Number(product.base_unit_id)
      )?.name ||
      '-'
    )
  }

  const getUnitSymbol = (product) => {
    return (
      product.base_unit?.symbol ||
      product.unit?.symbol ||
      units.find(
        (unit) =>
          Number(unit.id) ===
          Number(product.base_unit_id)
      )?.symbol ||
      ''
    )
  }

  const filteredProducts = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase()

    return products.filter((product) => {
      const productName =
        product.name?.toLowerCase() || ''

      const brand =
        product.brand?.toLowerCase() || ''

      const size =
        product.size?.toLowerCase() || ''

      const barcode =
        product.barcode?.toLowerCase() || ''

      const categoryName =
        getCategoryName(product).toLowerCase()

      const matchesSearch =
        !keyword ||
        productName.includes(keyword) ||
        brand.includes(keyword) ||
        size.includes(keyword) ||
        barcode.includes(keyword) ||
        categoryName.includes(keyword)

      const matchesCategory =
        categoryFilter === 'all' ||
        Number(
          product.category_id ||
            product.category?.id
        ) === Number(categoryFilter)

      const isActive =
        product.is_active !== false

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' &&
          isActive) ||
        (statusFilter === 'inactive' &&
          !isActive)

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      )
    })
  }, [
    products,
    search,
    categoryFilter,
    statusFilter,
    categories,
  ])

  const activeProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.is_active !== false
    )
  }, [products])

  const lowStockProducts = useMemo(() => {
    return activeProducts.filter(
      (product) =>
        Number(product.stock) < LOW_STOCK_LIMIT
    )
  }, [activeProducts])

  const outOfStockProducts = useMemo(() => {
    return activeProducts.filter(
      (product) =>
        Number(product.stock) <= 0
    )
  }, [activeProducts])

  return (
    <DashboardLayout
      title="Data Barang"
      description="Kelola produk dan persediaan barang"
      activeMenu="Data Barang"
    >
      <div className="space-y-6">

        {/* PAGE HEADER */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-7 sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2 text-blue-100">
                  <Package className="h-5 w-5" />

                  <span className="text-sm font-medium">
                    Master Data
                  </span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Data Barang
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                  Kelola informasi barang, merek,
                  ukuran, harga, kategori, satuan,
                  dan stok dalam satu halaman.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 active:scale-[0.98]"
              >
                <Plus className="h-5 w-5" />
                Tambah Barang
              </button>
            </div>
          </div>

          {/* SUMMARY */}
          <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            <div className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Boxes className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Total Barang
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {products.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Produk Aktif
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {activeProducts.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Stok Menipis
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {lowStockProducts.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Package className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Stok Habis
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {outOfStockProducts.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ALERT */}
        {success && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

            <p className="flex-1 text-sm font-medium text-emerald-700">
              {success}
            </p>

            <button
              type="button"
              onClick={() => setSuccess('')}
              className="text-emerald-500 transition hover:text-emerald-700"
              title="Tutup notifikasi"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && !showModal && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <p className="flex-1 text-sm font-medium text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError('')}
              className="text-red-500 transition hover:text-red-700"
              title="Tutup notifikasi"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* DATA TABLE */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* TABLE HEADER */}
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Daftar Barang
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Menampilkan{' '}
                  <span className="font-semibold text-slate-700">
                    {filteredProducts.length}
                  </span>{' '}
                  dari {products.length} barang
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                {/* SEARCH */}
                <div className="relative md:w-72">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Cari barang..."
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* CATEGORY */}
                <select
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">
                    Semua Kategori
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    )
                  )}
                </select>

                {/* STATUS */}
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">
                    Semua Status
                  </option>

                  <option value="active">
                    Aktif
                  </option>

                  <option value="inactive">
                    Tidak Aktif
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm font-medium text-slate-500">
                Memuat data barang...
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            /* EMPTY */
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Package className="h-7 w-7" />
              </div>

              <h3 className="mt-5 text-base font-bold text-slate-800">
                {products.length === 0
                  ? 'Belum ada barang'
                  : 'Barang tidak ditemukan'}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {products.length === 0
                  ? 'Tambahkan barang pertama untuk mulai mengelola produk di BuildPOS.'
                  : 'Coba ubah kata pencarian atau filter yang digunakan.'}
              </p>

              {products.length === 0 ? (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Barang
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setCategoryFilter('all')
                    setStatusFilter('all')
                  }}
                  className="mt-6 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            /* TABLE */
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="w-14 px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      #
                    </th>

                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Barang
                    </th>

                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Merek
                    </th>

                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Ukuran
                    </th>

                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Kategori
                    </th>

                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Satuan Dasar
                    </th>

                    <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Harga Jual
                    </th>

                    <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Stok
                    </th>

                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map(
                    (product, index) => {
                      const stock =
                        Number(
                          product.stock
                        ) || 0

                      const isLowStock =
                        product.is_active !==
                          false &&
                        stock <
                          LOW_STOCK_LIMIT

                      const isOutOfStock =
                        product.is_active !==
                          false &&
                        stock <= 0

                      const unitSymbol =
                        getUnitSymbol(product)

                      return (
                        <tr
                          key={product.id}
                          className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/70"
                        >
                          {/* NUMBER */}
                          <td className="px-5 py-4 text-center text-sm font-medium text-slate-400">
                            {index + 1}
                          </td>

                          {/* PRODUCT */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Package className="h-4.5 w-4.5" />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-800">
                                  {product.name}
                                </p>

                                {product.barcode && (
                                  <p className="mt-1 text-xs text-slate-400">
                                    Barcode:{' '}
                                    {
                                      product.barcode
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* BRAND */}
                          <td className="px-5 py-4">
                            {product.brand ? (
                              <span className="text-sm font-medium text-slate-700">
                                {product.brand}
                              </span>
                            ) : (
                              <span className="text-sm text-slate-400">
                                -
                              </span>
                            )}
                          </td>

                          {/* SIZE */}
                          <td className="px-5 py-4">
                            {product.size ? (
                              <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                                {product.size}
                              </span>
                            ) : (
                              <span className="text-sm text-slate-400">
                                -
                              </span>
                            )}
                          </td>

                          {/* CATEGORY */}
                          <td className="px-5 py-4">
                            <span className="text-sm text-slate-600">
                              {getCategoryName(
                                product
                              )}
                            </span>
                          </td>

                          {/* UNIT */}
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                              {getUnitName(
                                product
                              )}

                              {unitSymbol && (
                                <span className="text-slate-400">
                                  ({unitSymbol})
                                </span>
                              )}
                            </span>
                          </td>

                          {/* SELLING PRICE */}
                          <td className="px-5 py-4 text-right">
                            <span className="text-sm font-bold text-slate-800">
                              {formatRupiah(
                                product.selling_price
                              )}
                            </span>
                          </td>

                          {/* STOCK */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex flex-col items-end">
                              <span
                                className={`text-sm font-bold ${
                                  isOutOfStock
                                    ? 'text-red-600'
                                    : isLowStock
                                      ? 'text-orange-600'
                                      : 'text-slate-800'
                                }`}
                              >
                                {formatStock(
                                  stock
                                )}{' '}
                                {unitSymbol}
                              </span>

                              {isOutOfStock ? (
                                <span className="mt-1 text-[11px] font-medium text-red-500">
                                  Habis
                                </span>
                              ) : isLowStock ? (
                                <span className="mt-1 text-[11px] font-medium text-orange-500">
                                  Menipis
                                </span>
                              ) : null}
                            </div>
                          </td>

                          {/* STATUS */}
                          <td className="px-5 py-4">
                            {product.is_active !==
                            false ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                Tidak Aktif
                              </span>
                            )}
                          </td>

                          {/* ACTION */}
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/products/${product.id}/units`
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-200 bg-violet-50 text-violet-600 transition hover:bg-violet-100"
                                title="Kelola satuan produk"
                                aria-label="Kelola satuan produk"
                              >
                                <Settings2 className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    product
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                                title="Edit barang"
                                aria-label="Edit barang"
                              >
                                <Edit className="h-4 w-4" />
                              </button>

                              {product.is_active !==
                                false && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      product
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                                  title="Nonaktifkan barang"
                                  aria-label="Nonaktifkan barang"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="my-6 w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 sm:px-7">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    {editingProduct ? (
                      <Edit className="h-5 w-5" />
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {editingProduct
                        ? 'Edit Barang'
                        : 'Tambah Barang'}
                    </h3>

                    <p className="mt-0.5 text-sm text-slate-500">
                      {editingProduct
                        ? 'Perbarui informasi barang.'
                        : 'Tambahkan barang baru ke BuildPOS.'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                title="Tutup"
                aria-label="Tutup modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="max-h-[75vh] overflow-y-auto"
            >
              <div className="space-y-5 px-6 py-6 sm:px-7">

                {/* ERROR */}
                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

                    <p className="text-sm font-medium text-red-700">
                      {error}
                    </p>
                  </div>
                )}

                {/* NAMA */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Nama Barang
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Contoh: Cat"
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />
                </div>

                {/* BRAND + SIZE */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="brand"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Merek
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        Opsional
                      </span>
                    </label>

                    <input
                      id="brand"
                      name="brand"
                      type="text"
                      value={form.brand}
                      onChange={handleChange}
                      placeholder="Contoh: Dulux"
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="size"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Ukuran / Spesifikasi
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        Opsional
                      </span>
                    </label>

                    <input
                      id="size"
                      name="size"
                      type="text"
                      value={form.size}
                      onChange={handleChange}
                      placeholder="Contoh: 2 Kg"
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* CATEGORY + UNIT */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="category_id"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Kategori
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <select
                      id="category_id"
                      name="category_id"
                      value={form.category_id}
                      onChange={handleChange}
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    >
                      <option value="">
                        Pilih kategori
                      </option>

                      {categories
                        .filter(
                          (category) =>
                            category.is_active !==
                            false
                        )
                        .map((category) => (
                          <option
                            key={category.id}
                            value={category.id}
                          >
                            {category.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="base_unit_id"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Satuan Dasar
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <select
                      id="base_unit_id"
                      name="base_unit_id"
                      value={form.base_unit_id}
                      onChange={handleChange}
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    >
                      <option value="">
                        Pilih satuan
                      </option>

                      {units
                        .filter(
                          (unit) =>
                            unit.is_active !==
                            false
                        )
                        .map((unit) => (
                          <option
                            key={unit.id}
                            value={unit.id}
                          >
                            {unit.name} (
                            {unit.symbol})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* BARCODE */}
                <div>
                  <label
                    htmlFor="barcode"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Barcode
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      Opsional
                    </span>
                  </label>

                  <input
                    id="barcode"
                    name="barcode"
                    type="text"
                    value={form.barcode}
                    onChange={handleChange}
                    placeholder="Contoh: 8991234567890"
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Tidak wajib. Gunakan jika barang
                    memiliki barcode.
                  </p>
                </div>

                {/* PRICE */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="purchase_price"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Harga Beli
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                        Rp
                      </span>

                      <input
                        id="purchase_price"
                        name="purchase_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          form.purchase_price
                        }
                        onChange={handleChange}
                        placeholder="0"
                        disabled={saving}
                        className="w-full rounded-xl border border-slate-300 py-2.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="selling_price"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Harga Jual
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                        Rp
                      </span>

                      <input
                        id="selling_price"
                        name="selling_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          form.selling_price
                        }
                        onChange={handleChange}
                        placeholder="0"
                        disabled={saving}
                        className="w-full rounded-xl border border-slate-300 py-2.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* STOCK */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="stock"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Stok
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="stock"
                      name="stock"
                      type="number"
                      min="0"
                      step="0.001"
                      value={form.stock}
                      onChange={handleChange}
                      placeholder="0"
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="minimum_stock"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Minimum Stok
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="minimum_stock"
                      name="minimum_stock"
                      type="number"
                      min="0"
                      step="0.001"
                      value={
                        form.minimum_stock
                      }
                      onChange={handleChange}
                      placeholder="0"
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />

                    <p className="mt-1.5 text-xs text-slate-400">
                      Digunakan sebagai batas minimum
                      stok produk.
                    </p>
                  </div>
                </div>

                {/* ACTIVE */}
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/30">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                    disabled={saving}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Barang Aktif
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Barang dapat digunakan dalam
                      transaksi jika statusnya aktif.
                    </p>
                  </div>
                </label>
              </div>

              {/* FOOTER */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end sm:px-7">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      {editingProduct ? (
                        <Edit className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}

                      {editingProduct
                        ? 'Simpan Perubahan'
                        : 'Tambah Barang'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Products