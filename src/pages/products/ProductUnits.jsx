import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'

function ProductUnits() {
  const { productId } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [productUnits, setProductUnits] = useState([])
  const [units, setUnits] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    unit_id: '',
    conversion_rate: '',
    selling_price: '',
    is_default: false,
    is_active: true,
  })

  useEffect(() => {
    fetchData()
  }, [productId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      const [productResponse, unitsResponse, productUnitsResponse] =
        await Promise.all([
          api.get(`/products/${productId}`),
          api.get('/units'),
          api.get(`/products/${productId}/product-units`),
        ])

      const productData =
        productResponse.data.data || productResponse.data

      const unitsData =
        unitsResponse.data.data || unitsResponse.data

      const productUnitsData =
        productUnitsResponse.data.data || productUnitsResponse.data

      setProduct(productData)

      setUnits(
        Array.isArray(unitsData)
          ? unitsData
          : unitsData.data || []
      )

      setProductUnits(
        Array.isArray(productUnitsData)
          ? productUnitsData
          : productUnitsData.data || []
      )
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
        'Gagal mengambil data satuan produk'
      )
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      unit_id: '',
      conversion_rate: '',
      selling_price: '',
      is_default: false,
      is_active: true,
    })

    setEditing(null)
  }

  const openCreateModal = () => {
    resetForm()
    setModalOpen(true)
    setError('')
  }

  const openEditModal = (item) => {
    setEditing(item)

    setForm({
      unit_id: item.unit_id ?? '',
      conversion_rate: item.conversion_rate ?? '',
      selling_price: item.selling_price ?? '',
      is_default: Boolean(item.is_default),
      is_active: Boolean(item.is_active),
    })

    setModalOpen(true)
    setError('')
  }

  const closeModal = () => {
    if (saving) return

    setModalOpen(false)
    resetForm()
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(value || 0))
  }

  const getUnitName = (unitId) => {
    const unit = units.find(
      (item) => Number(item.id) === Number(unitId)
    )

    if (!unit) return '-'

    return unit.symbol
      ? `${unit.name} (${unit.symbol})`
      : unit.name
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (!form.unit_id) {
        setError('Satuan wajib dipilih')
        return
      }

      if (
        form.conversion_rate === '' ||
        Number(form.conversion_rate) <= 0
      ) {
        setError('Konversi harus lebih dari 0')
        return
      }

      if (
        form.selling_price === '' ||
        Number(form.selling_price) < 0
      ) {
        setError('Harga jual tidak boleh kurang dari 0')
        return
      }

      const payload = {
        unit_id: Number(form.unit_id),
        conversion_rate: Number(form.conversion_rate),
        selling_price: Number(form.selling_price),
        is_default: Boolean(form.is_default),
        is_active: Boolean(form.is_active),
      }

      if (editing) {
        await api.put(
          `/products/${productId}/product-units/${editing.id}`,
          payload
        )

        setSuccess('Satuan produk berhasil diperbarui')
      } else {
        await api.post(
          `/products/${productId}/product-units`,
          payload
        )

        setSuccess('Satuan produk berhasil ditambahkan')
      }

      setModalOpen(false)
      resetForm()

      await fetchData()
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
        'Gagal menyimpan satuan produk'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    const unitName = getUnitName(item.unit_id)

    const confirmed = window.confirm(
      `Nonaktifkan satuan "${unitName}" untuk produk ini?`
    )

    if (!confirmed) return

    try {
      setError('')
      setSuccess('')

      await api.delete(
        `/products/${productId}/product-units/${item.id}`
      )

      setSuccess('Satuan produk berhasil dinonaktifkan')

      await fetchData()
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
        'Gagal menonaktifkan satuan produk'
      )
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="mb-3 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← Kembali ke Produk
            </button>

            <h1 className="text-2xl font-bold text-slate-900">
              Kelola Satuan Produk
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Atur satuan penjualan dan konversi produk
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Tambah Satuan
          </button>
        </div>

        {/* PRODUCT INFO */}
        {product && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Produk
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {product.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Satuan dasar:{' '}
                  <span className="font-medium text-slate-700">
                    {getUnitName(product.base_unit_id)}
                  </span>
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 px-5 py-3">
                <p className="text-xs text-blue-500">
                  Harga satuan dasar
                </p>

                <p className="mt-1 text-lg font-bold text-blue-700">
                  {formatRupiah(product.selling_price)}
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ALERT */}
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {error && !modalOpen && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              Daftar Satuan Penjualan
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Satuan yang dapat digunakan saat transaksi
            </p>
          </div>

          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              Memuat data...
            </div>
          ) : productUnits.length === 0 ? (
            <div className="px-5 py-12 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                📦
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                Belum ada satuan tambahan
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                Tambahkan satuan seperti Sak, Kolbak, Kilogram,
                atau satuan lainnya untuk produk ini.
              </p>

              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                + Tambah Satuan
              </button>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[800px] text-left">

                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Satuan
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Konversi
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Harga Jual
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Default
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {productUnits.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50"
                    >

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {getUnitName(item.unit_id)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                          1 {getUnitName(item.unit_id)}
                          {' = '}
                          {item.conversion_rate} {getUnitName(product?.base_unit_id)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-900">
                          {formatRupiah(item.selling_price)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {item.is_default ? (
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            Default
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">
                            -
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {item.is_active ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            Aktif
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            Nonaktif
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                          >
                            Edit
                          </button>

                          {item.is_active && (
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                              Nonaktifkan
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  ))}

                </tbody>
              </table>

            </div>
          )}

        </div>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editing
                    ? 'Edit Satuan Produk'
                    : 'Tambah Satuan Produk'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Tentukan satuan, konversi, dan harga jual
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="text-xl text-slate-400 hover:text-slate-600"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* UNIT */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Satuan
                </label>

                <select
                  name="unit_id"
                  value={form.unit_id}
                  onChange={handleChange}
                  disabled={Boolean(editing)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                >
                  <option value="">
                    Pilih satuan
                  </option>

                  {units
                    .filter(
                      (unit) =>
                        !productUnits.some(
                          (item) =>
                            Number(item.unit_id) ===
                              Number(unit.id) &&
                            (!editing ||
                              Number(item.id) !==
                                Number(editing.id))
                        )
                    )
                    .map((unit) => (
                      <option
                        key={unit.id}
                        value={unit.id}
                      >
                        {unit.name}
                        {unit.symbol
                          ? ` (${unit.symbol})`
                          : ''}
                      </option>
                    ))}
                </select>
              </div>

              {/* CONVERSION */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Konversi ke Satuan Dasar
                </label>

                <div className="flex items-center gap-3">

                  <div className="flex-1">
                    <input
                      type="number"
                      name="conversion_rate"
                      value={form.conversion_rate}
                      onChange={handleChange}
                      min="0.001"
                      step="0.001"
                      placeholder="Contoh: 500"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <span className="text-sm font-medium text-slate-500">
                    {getUnitName(product?.base_unit_id)}
                  </span>

                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Contoh: 1 Kolbak = 500 Buah.
                  Masukkan nilai <strong>500</strong>.
                </p>
              </div>

              {/* PRICE */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Harga Jual
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                    Rp
                  </span>

                  <input
                    type="number"
                    name="selling_price"
                    value={form.selling_price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="500000"
                    className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>
              </div>

              {/* DEFAULT */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Jadikan satuan default
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Satuan yang digunakan sebagai pilihan utama.
                  </p>
                </div>

                <input
                  type="checkbox"
                  name="is_default"
                  checked={form.is_default}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600"
                />

              </div>

              {/* STATUS */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Status aktif
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Satuan dapat digunakan saat transaksi.
                  </p>
                </div>

                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600"
                />

              </div>

              {/* BUTTON */}
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Menyimpan...'
                    : editing
                      ? 'Simpan Perubahan'
                      : 'Tambah Satuan'}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default ProductUnits