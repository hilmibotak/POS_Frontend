import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Plus,
  Ruler,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'

import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'

function Units() {
  const [units, setUnits] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState('all')

  const [showModal, setShowModal] =
    useState(false)

  const [editingUnit, setEditingUnit] =
    useState(null)

  const [form, setForm] = useState({
    name: '',
    symbol: '',
    is_active: true,
  })

  const fetchUnits = async () => {
    try {
      setLoading(true)
      setError('')

      const response =
        await api.get('/units')

      const responseData =
        response.data?.data

      let data = []

      if (Array.isArray(responseData)) {
        data = responseData
      } else if (
        Array.isArray(responseData?.data)
      ) {
        data = responseData.data
      } else if (
        Array.isArray(response.data)
      ) {
        data = response.data
      }

      setUnits(data)
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
      symbol: '',
      is_active: true,
    })

    setEditingUnit(null)
  }

  const openCreateModal = () => {
    resetForm()
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
    resetForm()
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')

    if (!form.name.trim()) {
      setError(
        'Nama satuan wajib diisi.'
      )
      return
    }

    if (!form.symbol.trim()) {
      setError(
        'Simbol satuan wajib diisi.'
      )
      return
    }

    try {
      setSaving(true)
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
      resetForm()
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
    const confirmed =
      window.confirm(
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

  const filteredUnits = useMemo(() => {
    const keyword =
      search.trim().toLowerCase()

    return units.filter((unit) => {
      const matchesSearch =
        !keyword ||
        unit.name
          ?.toLowerCase()
          .includes(keyword) ||
        unit.symbol
          ?.toLowerCase()
          .includes(keyword)

      const isActive =
        unit.is_active !== false

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' &&
          isActive) ||
        (statusFilter === 'inactive' &&
          !isActive)

      return (
        matchesSearch &&
        matchesStatus
      )
    })
  }, [
    units,
    search,
    statusFilter,
  ])

  const totalUnits = units.length

  const activeUnits = units.filter(
    (unit) =>
      unit.is_active !== false
  ).length

  const inactiveUnits =
    totalUnits - activeUnits

  return (
    <DashboardLayout
      title="Satuan"
      description="Kelola satuan barang toko"
      activeMenu="Satuan"
    >
      <div className="space-y-6">

        {/* HEADER */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative overflow-hidden p-6 sm:p-7">
            <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-violet-50" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <Ruler className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Data Satuan
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                    Kelola satuan barang seperti
                    buah, sak, kg, meter, m³,
                    dan kolbak di BuildPOS.
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Tambah Satuan
              </button>

            </div>
          </div>
        </section>

        {/* SUCCESS */}
        {success && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">

            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

            <p className="flex-1 text-sm font-medium text-emerald-700">
              {success}
            </p>

            <button
              type="button"
              onClick={() =>
                setSuccess('')
              }
              className="rounded-lg p-1 text-emerald-500 transition hover:bg-emerald-100 hover:text-emerald-700"
              title="Tutup"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </button>

          </div>
        )}

        {/* ERROR */}
        {error && !showModal && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">

            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <p className="flex-1 text-sm font-medium text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError('')}
              className="rounded-lg p-1 text-red-500 transition hover:bg-red-100 hover:text-red-700"
              title="Tutup"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </button>

          </div>
        )}

        {/* SUMMARY */}
        <section className="grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Satuan
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {totalUnits}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Semua satuan
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Ruler className="h-5 w-5" />
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Satuan Aktif
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {activeUnits}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Dapat digunakan
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Tidak Aktif
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-600">
                  {inactiveUnits}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Tidak digunakan
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <Ruler className="h-5 w-5" />
              </div>

            </div>
          </div>

        </section>

        {/* TABLE */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* TOOLBAR */}
          <div className="border-b border-slate-200 p-5 sm:p-6">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <h3 className="font-bold text-slate-900">
                  Daftar Satuan
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Menampilkan{' '}
                  {filteredUnits.length} dari{' '}
                  {units.length} satuan
                </p>
              </div>

              <button
                type="button"
                onClick={fetchUnits}
                disabled={loading}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 lg:self-auto"
                title="Refresh data"
                aria-label="Refresh data satuan"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    loading
                      ? 'animate-spin'
                      : ''
                  }`}
                />
              </button>

            </div>

            {/* SEARCH + FILTER */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">

              <div className="relative flex-1">

                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Cari nama satuan atau simbol..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-44"
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

          {/* CONTENT */}
          {loading ? (
            <div className="px-6 py-16 text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Memuat data satuan...
              </p>

            </div>
          ) : filteredUnits.length ===
            0 ? (
            <div className="px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Ruler className="h-7 w-7" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-800">
                {units.length === 0
                  ? 'Belum ada satuan'
                  : 'Satuan tidak ditemukan'}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {units.length === 0
                  ? 'Tambahkan satuan pertama untuk mulai mengelola barang.'
                  : 'Coba gunakan kata kunci pencarian atau filter yang berbeda.'}
              </p>

              {units.length ===
                0 && (
                <button
                  type="button"
                  onClick={
                    openCreateModal
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Satuan
                </button>
              )}

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[700px]">

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">

                    <th className="w-16 px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      #
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Satuan
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Simbol
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="w-32 px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                      Aksi
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {filteredUnits.map(
                    (unit, index) => {
                      const isActive =
                        unit.is_active !==
                        false

                      return (
                        <tr
                          key={unit.id}
                          className="border-b border-slate-100 transition hover:bg-slate-50 last:border-0"
                        >

                          <td className="px-6 py-4 text-sm text-slate-400">
                            {index + 1}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                <Ruler className="h-4 w-4" />
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {unit.name}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-400">
                                  ID #{unit.id}
                                </p>
                              </div>

                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex min-w-14 items-center justify-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                              {unit.symbol}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                Tidak Aktif
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    unit
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                                title="Edit satuan"
                                aria-label={`Edit satuan ${unit.name}`}
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    unit
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                                title="Hapus satuan"
                                aria-label={`Hapus satuan ${unit.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-[2px]">

          <div className="my-8 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Ruler className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingUnit
                      ? 'Edit Satuan'
                      : 'Tambah Satuan'}
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {editingUnit
                      ? 'Perbarui informasi satuan.'
                      : 'Tambahkan satuan barang baru.'}
                  </p>
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
              className="space-y-5 px-6 py-6"
            >

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

                  <p className="text-sm font-medium text-red-700">
                    {error}
                  </p>

                </div>
              )}

              {/* NAME */}
              <div>
                <label
                  htmlFor="unit-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Nama Satuan
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="unit-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Contoh: Sak"
                  disabled={saving}
                  autoFocus
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

              {/* SYMBOL */}
              <div>
                <label
                  htmlFor="unit-symbol"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Simbol
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="unit-symbol"
                  name="symbol"
                  type="text"
                  value={form.symbol}
                  onChange={handleChange}
                  placeholder="Contoh: sak"
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Contoh: buah, sak, kg, m, m³,
                  kolbak
                </p>
              </div>

              {/* PREVIEW */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Preview
                </p>

                <div className="mt-3 flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                    <Ruler className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {form.name ||
                        'Nama Satuan'}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Simbol satuan
                    </p>
                  </div>

                  <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
                    {form.symbol ||
                      '-'}
                  </span>

                </div>

              </div>

              {/* STATUS */}
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100">

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
                    Satuan Aktif
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Satuan dapat dipilih saat
                    membuat atau mengedit produk.
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
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      {editingUnit
                        ? 'Simpan Perubahan'
                        : 'Tambah Satuan'}
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

export default Units