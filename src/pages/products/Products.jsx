import { useEffect, useState } from 'react'
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

      const productsData =
        productsResponse.data.data ||
        productsResponse.data

      const categoriesData =
        categoriesResponse.data.data ||
        categoriesResponse.data

      const unitsData =
        unitsResponse.data.data ||
        unitsResponse.data

      setProducts(
        Array.isArray(productsData)
          ? productsData
          : []
      )

      setCategories(
        Array.isArray(categoriesData)
          ? categoriesData
          : []
      )

      setUnits(
        Array.isArray(unitsData)
          ? unitsData
          : []
      )
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

  return (
    <DashboardLayout
      title="Data Barang"
      description="Kelola produk dan persediaan barang"
      activeMenu="Data Barang"
    >
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Data Barang
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Kelola barang, merek, ukuran,
              harga, stok, dan kategori di BuildPOS.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <span className="text-lg leading-none">
              +
            </span>

            Tambah Barang
          </button>

        </div>

        {/* SUCCESS */}
        {success && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">

            <p className="text-sm font-medium text-emerald-700">
              {success}
            </p>

            <button
              type="button"
              onClick={() => setSuccess('')}
              className="text-sm font-bold text-emerald-600 hover:text-emerald-800"
            >
              ×
            </button>

          </div>
        )}

        {/* ERROR */}
        {error && !showModal && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">

            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError('')}
              className="text-sm font-bold text-red-600 hover:text-red-800"
            >
              ×
            </button>

          </div>
        )}

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">

            <div className="flex items-center justify-between">

              <div>
                <h3 className="font-bold text-slate-900">
                  Daftar Barang
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Total {products.length} barang
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-600">
                BRG
              </div>

            </div>

          </div>

          {loading ? (

            <div className="px-6 py-16 text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Memuat data barang...
              </p>

            </div>

          ) : products.length === 0 ? (

            <div className="px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                📦
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-800">
                Belum ada barang
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Tambahkan barang pertama untuk
                mulai mengelola produk.
              </p>

              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Tambah Barang
              </button>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1250px]">

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      #
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Barang
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Merek
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Ukuran
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Kategori
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Satuan
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Harga Jual
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Stok
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Aksi
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {products.map(
                    (product, index) => {

                      const stock =
                        Number(
                          product.stock
                        ) || 0

                      const minimumStock =
                        Number(
                          product.minimum_stock ||
                          product.min_stock ||
                          product.min ||
                          0
                        )

                      const isLowStock =
                        stock <=
                        minimumStock

                      const unitSymbol =
                        getUnitSymbol(
                          product
                        )

                      return (
                        <tr
                          key={product.id}
                          className="border-b border-slate-100 transition hover:bg-slate-50"
                        >

                          <td className="px-6 py-4 text-sm text-slate-500">
                            {index + 1}
                          </td>

                          {/* BARANG */}
                          <td className="px-6 py-4">

                            <p className="text-sm font-semibold text-slate-800">
                              {product.name}
                            </p>

                            {product.barcode && (
                              <p className="mt-1 text-xs text-slate-400">
                                Barcode:{' '}
                                {product.barcode}
                              </p>
                            )}

                          </td>

                          {/* MEREK */}
                          <td className="px-6 py-4">

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

                          {/* UKURAN */}
                          <td className="px-6 py-4">

                            {product.size ? (
                              <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                                {product.size}
                              </span>
                            ) : (
                              <span className="text-sm text-slate-400">
                                -
                              </span>
                            )}

                          </td>

                          {/* KATEGORI */}
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {getCategoryName(
                              product
                            )}
                          </td>

                          {/* SATUAN */}
                          <td className="px-6 py-4">

                            <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                              {getUnitName(
                                product
                              )}
                            </span>

                          </td>

                          {/* HARGA */}
                          <td className="px-6 py-4 text-right text-sm font-semibold text-slate-800">
                            {formatRupiah(
                              product.selling_price
                            )}
                          </td>

                          {/* STOK */}
                          <td className="px-6 py-4 text-right">

                            <p
                              className={`text-sm font-semibold ${
                                isLowStock
                                  ? 'text-orange-600'
                                  : 'text-slate-800'
                              }`}
                            >
                              {stock}{' '}
                              {unitSymbol}
                            </p>

                            {isLowStock && (
                              <p className="mt-1 text-xs text-orange-500">
                                Stok menipis
                              </p>
                            )}

                          </td>

                          {/* STATUS */}
                          <td className="px-6 py-4">

                            {product.is_active !==
                            false ? (
                              <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                Tidak Aktif
                              </span>
                            )}

                          </td>

                          {/* AKSI */}
                          <td className="px-6 py-4">

                            <div className="flex justify-end gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/products/${product.id}/units`
                                  )
                                }
                                className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                              >
                                Satuan
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    product
                                  )
                                }
                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                              >
                                Edit
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
                                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                                >
                                  Nonaktifkan
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

        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">

          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingProduct
                    ? 'Edit Barang'
                    : 'Tambah Barang'}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {editingProduct
                    ? 'Perbarui informasi barang.'
                    : 'Tambahkan barang baru ke BuildPOS.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 px-6 py-6"
            >

              {/* ERROR */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">

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

              {/* MEREK + UKURAN */}
              <div className="grid gap-5 sm:grid-cols-2">

                <div>

                  <label
                    htmlFor="brand"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Merek
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      (Opsional)
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
                      (Opsional)
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
                          {unit.name} ({unit.symbol})
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
                    (Opsional)
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
                  Tidak wajib. Cocok untuk barang
                  yang memiliki barcode.
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

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      Rp
                    </span>

                    <input
                      id="purchase_price"
                      name="purchase_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.purchase_price}
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

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      Rp
                    </span>

                    <input
                      id="selling_price"
                      name="selling_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.selling_price}
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
                    value={form.minimum_stock}
                    onChange={handleChange}
                    placeholder="0"
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />

                </div>

              </div>

              {/* STATUS */}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">

                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  disabled={saving}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <div>

                  <p className="text-sm font-semibold text-slate-700">
                    Barang Aktif
                  </p>

                  <p className="text-xs text-slate-500">
                    Barang dapat digunakan dalam
                    transaksi jika status aktif.
                  </p>

                </div>

              </label>

              {/* FOOTER */}
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? 'Menyimpan...'
                    : editingProduct
                      ? 'Simpan Perubahan'
                      : 'Tambah Barang'}
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