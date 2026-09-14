import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'

function Units() {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState(null)

  const [form, setForm] = useState({
    name: '',
    symbol: '',
    is_active: true,
  })

  const fetchUnits = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/units')

      const data =
        response.data.data ||
        response.data

      setUnits(
        Array.isArray(data)
          ? data
          : []
      )
    } catch (error) {
      console.error(
        'Gagal mengambil data satuan:',
        error
      )

      setError(
        error.response?.data?.message ||
        'Gagal mengambil data satuan.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnits()
  }, [])

  const handleChange = (event) => {
    const { name, value, type, checked } =
      event.target

    setForm((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }))
  }

  const openCreateModal = () => {
    setEditingUnit(null)

    setForm({
      name: '',
      symbol: '',
      is_active: true,
    })

    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const openEditModal = (unit) => {
    setEditingUnit(unit)

    setForm({
      name: unit.name || '',
      symbol: unit.symbol || '',
      is_active:
        unit.is_active !== false,
    })

    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
    setEditingUnit(null)

    setForm({
      name: '',
      symbol: '',
      is_active: true,
    })

    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      setError('Nama satuan wajib diisi.')
      return
    }

    if (!form.symbol.trim()) {
      setError('Simbol satuan wajib diisi.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const payload = {
        name: form.name.trim(),
        symbol: form.symbol.trim(),
        is_active: form.is_active,
      }

      if (editingUnit) {
        await api.put(
          `/units/${editingUnit.id}`,
          payload
        )

        setSuccess(
          'Satuan berhasil diperbarui.'
        )
      } else {
        await api.post(
          '/units',
          payload
        )

        setSuccess(
          'Satuan berhasil ditambahkan.'
        )
      }

      await fetchUnits()

      setShowModal(false)
      setEditingUnit(null)

      setForm({
        name: '',
        symbol: '',
        is_active: true,
      })
    } catch (error) {
      console.error(
        'Gagal menyimpan satuan:',
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
          'Data satuan tidak valid.'
        )
      } else {
        setError(
          error.response?.data?.message ||
          'Gagal menyimpan satuan.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (unit) => {
    const confirmed = window.confirm(
      `Yakin ingin menghapus satuan "${unit.name}"?`
    )

    if (!confirmed) return

    try {
      setError('')
      setSuccess('')

      await api.delete(
        `/units/${unit.id}`
      )

      setSuccess(
        'Satuan berhasil dihapus.'
      )

      await fetchUnits()
    } catch (error) {
      console.error(
        'Gagal menghapus satuan:',
        error
      )

      setError(
        error.response?.data?.message ||
        'Gagal menghapus satuan.'
      )
    }
  }

  return (
    <DashboardLayout
      title="Satuan"
      description="Kelola satuan barang toko"
      activeMenu="Satuan"
    >
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Data Satuan
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Kelola satuan yang digunakan untuk
              barang di BuildPOS.
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

            Tambah Satuan
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

        {/* TABLE CARD */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* TABLE HEADER */}
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">
                  Daftar Satuan
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Total {units.length} satuan
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-600">
                SAT
              </div>
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Memuat data satuan...
              </p>
            </div>
          ) : units.length === 0 ? (

            /* EMPTY */
            <div className="px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                📏
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-800">
                Belum ada satuan
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Tambahkan satuan pertama untuk
                mulai mengelola barang.
              </p>

              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Tambah Satuan
              </button>
            </div>

          ) : (

            /* TABLE */
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      #
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Nama Satuan
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Simbol
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

                  {units.map((unit, index) => (
                    <tr
                      key={unit.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >

                      {/* NO */}
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {index + 1}
                      </td>

                      {/* NAME */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {unit.name}
                        </p>
                      </td>

                      {/* SYMBOL */}
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                          {unit.symbol}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">

                        {unit.is_active !== false ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            Tidak Aktif
                          </span>
                        )}

                      </td>

                      {/* ACTION */}
                      <td className="px-6 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(unit)
                            }
                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(unit)
                            }
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                          >
                            Hapus
                          </button>

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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingUnit
                    ? 'Edit Satuan'
                    : 'Tambah Satuan'}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {editingUnit
                    ? 'Perbarui informasi satuan.'
                    : 'Tambahkan satuan barang baru.'}
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

              {/* MODAL ERROR */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-red-700">
                    {error}
                  </p>
                </div>
              )}

              {/* NAME */}
              <div>

                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Nama Satuan
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
                  placeholder="Contoh: Sak"
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />

              </div>

              {/* SYMBOL */}
              <div>

                <label
                  htmlFor="symbol"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Simbol
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="symbol"
                  name="symbol"
                  type="text"
                  value={form.symbol}
                  onChange={handleChange}
                  placeholder="Contoh: sak"
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Contoh simbol: buah, sak, kg, m,
                  m³, kolbak
                </p>

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
                    Satuan Aktif
                  </p>

                  <p className="text-xs text-slate-500">
                    Satuan dapat digunakan pada produk
                    jika status aktif.
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
                    : editingUnit
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

export default Units