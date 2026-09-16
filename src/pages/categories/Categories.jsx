import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  FolderTree,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'

import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'

function Categories() {
  const [categories, setCategories] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState('all')

  const [showModal, setShowModal] =
    useState(false)

  const [editingCategory, setEditingCategory] =
    useState(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    is_active: true,
  })

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError('')

      const response =
        await api.get('/categories')

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

      setCategories(data)
    } catch (error) {
      console.error(
        'Gagal mengambil kategori:',
        error
      )

      setError(
        error.response?.data?.message ||
          'Gagal mengambil data kategori.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
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
      description: '',
      is_active: true,
    })

    setEditingCategory(null)
  }

  const openCreateModal = () => {
    resetForm()
    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const openEditModal = (category) => {
    setEditingCategory(category)

    setForm({
      name: category.name || '',
      description:
        category.description || '',
      is_active:
        category.is_active !== false,
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
        'Nama kategori wajib diisi.'
      )
      return
    }

    try {
      setSaving(true)
      setSuccess('')

      const payload = {
        name: form.name.trim(),
        description:
          form.description.trim() || null,
        is_active: form.is_active,
      }

      if (editingCategory) {
        await api.put(
          `/categories/${editingCategory.id}`,
          payload
        )

        setSuccess(
          'Kategori berhasil diperbarui.'
        )
      } else {
        await api.post(
          '/categories',
          payload
        )

        setSuccess(
          'Kategori berhasil ditambahkan.'
        )
      }

      await fetchCategories()

      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error(
        'Gagal menyimpan kategori:',
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
            'Data kategori tidak valid.'
        )
      } else {
        setError(
          error.response?.data?.message ||
            'Gagal menyimpan kategori.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category) => {
    const confirmed =
      window.confirm(
        `Yakin ingin menghapus kategori "${category.name}"?`
      )

    if (!confirmed) return

    try {
      setError('')
      setSuccess('')

      await api.delete(
        `/categories/${category.id}`
      )

      setSuccess(
        'Kategori berhasil dihapus.'
      )

      await fetchCategories()
    } catch (error) {
      console.error(
        'Gagal menghapus kategori:',
        error
      )

      setError(
        error.response?.data?.message ||
          'Gagal menghapus kategori.'
      )
    }
  }

  const filteredCategories = useMemo(() => {
    const keyword =
      search.trim().toLowerCase()

    return categories.filter(
      (category) => {
        const matchesSearch =
          !keyword ||
          category.name
            ?.toLowerCase()
            .includes(keyword) ||
          category.description
            ?.toLowerCase()
            .includes(keyword)

        const isActive =
          category.is_active !== false

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
      }
    )
  }, [
    categories,
    search,
    statusFilter,
  ])

  const totalCategories =
    categories.length

  const activeCategories =
    categories.filter(
      (category) =>
        category.is_active !== false
    ).length

  const inactiveCategories =
    totalCategories -
    activeCategories

  return (
    <DashboardLayout
      title="Kategori"
      description="Kelola kategori barang toko"
      activeMenu="Kategori"
    >
      <div className="space-y-6">

        {/* HEADER */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative overflow-hidden p-6 sm:p-7">
            <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-blue-50" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <FolderTree className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Data Kategori
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                    Kelola kategori barang yang
                    digunakan untuk mengelompokkan
                    produk di BuildPOS.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Tambah Kategori
              </button>
            </div>
          </div>
        </section>

        {/* ALERT SUCCESS */}
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

        {/* ALERT ERROR */}
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
                  Total Kategori
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {totalCategories}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Semua kategori
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FolderTree className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Kategori Aktif
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {activeCategories}
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
                  {inactiveCategories}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Tidak digunakan
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <FolderTree className="h-5 w-5" />
              </div>
            </div>
          </div>

        </section>

        {/* TABLE */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* TABLE TOOLBAR */}
          <div className="border-b border-slate-200 p-5 sm:p-6">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <h3 className="font-bold text-slate-900">
                  Daftar Kategori
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Menampilkan{' '}
                  {filteredCategories.length}{' '}
                  dari {categories.length}{' '}
                  kategori
                </p>
              </div>

              <button
                type="button"
                onClick={fetchCategories}
                disabled={loading}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 lg:self-auto"
                title="Refresh data"
                aria-label="Refresh data kategori"
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
                  placeholder="Cari kategori atau deskripsi..."
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
                Memuat data kategori...
              </p>
            </div>
          ) : filteredCategories.length ===
            0 ? (
            <div className="px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <FolderTree className="h-7 w-7" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-800">
                {categories.length === 0
                  ? 'Belum ada kategori'
                  : 'Kategori tidak ditemukan'}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {categories.length === 0
                  ? 'Tambahkan kategori pertama untuk mulai mengelola barang.'
                  : 'Coba gunakan kata kunci pencarian atau filter yang berbeda.'}
              </p>

              {categories.length ===
                0 && (
                <button
                  type="button"
                  onClick={
                    openCreateModal
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Kategori
                </button>
              )}

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[800px]">

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">

                    <th className="w-16 px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      #
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Kategori
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Deskripsi
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
                  {filteredCategories.map(
                    (category, index) => {
                      const isActive =
                        category.is_active !==
                        false

                      return (
                        <tr
                          key={
                            category.id
                          }
                          className="border-b border-slate-100 transition hover:bg-slate-50 last:border-0"
                        >

                          <td className="px-6 py-4 text-sm text-slate-400">
                            {index + 1}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <FolderTree className="h-4 w-4" />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                  {
                                    category.name
                                  }
                                </p>

                                <p className="mt-0.5 text-xs text-slate-400">
                                  ID #{category.id}
                                </p>
                              </div>

                            </div>
                          </td>

                          <td className="max-w-md px-6 py-4">
                            <p className="truncate text-sm text-slate-500">
                              {category.description ||
                                '-'}
                            </p>
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
                                    category
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                                title="Edit kategori"
                                aria-label={`Edit kategori ${category.name}`}
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    category
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                                title="Hapus kategori"
                                aria-label={`Hapus kategori ${category.name}`}
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FolderTree className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingCategory
                      ? 'Edit Kategori'
                      : 'Tambah Kategori'}
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {editingCategory
                      ? 'Perbarui informasi kategori.'
                      : 'Tambahkan kategori barang baru.'}
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

              <div>
                <label
                  htmlFor="category-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Nama Kategori
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="category-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Contoh: Semen"
                  disabled={saving}
                  autoFocus
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="category-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Deskripsi
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    Opsional
                  </span>
                </label>

                <textarea
                  id="category-description"
                  name="description"
                  rows="4"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Contoh: Berbagai jenis semen"
                  disabled={saving}
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

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
                    Kategori Aktif
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Kategori dapat dipilih saat
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
                      {editingCategory
                        ? 'Simpan Perubahan'
                        : 'Tambah Kategori'}
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

export default Categories