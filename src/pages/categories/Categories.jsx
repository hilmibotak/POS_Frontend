import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'

function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    is_active: true,
  })

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/categories')

      const data =
        response.data.data ||
        response.data

      setCategories(
        Array.isArray(data)
          ? data
          : []
      )
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
    setEditingCategory(null)

    setForm({
      name: '',
      description: '',
      is_active: true,
    })

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
    setEditingCategory(null)

    setForm({
      name: '',
      description: '',
      is_active: true,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      setError('Nama kategori wajib diisi.')
      return
    }

    try {
      setSaving(true)
      setError('')
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
      setEditingCategory(null)

      setForm({
        name: '',
        description: '',
        is_active: true,
      })
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
    const confirmed = window.confirm(
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

  return (
    <DashboardLayout
      title="Kategori"
      description="Kelola kategori barang toko"
      activeMenu="Kategori"
    >
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Data Kategori
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Kelola kategori barang yang digunakan
              di BuildPOS.
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

            Tambah Kategori
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
                  Daftar Kategori
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Total {categories.length} kategori
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Memuat data kategori...
              </p>
            </div>
          ) : categories.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                📁
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-800">
                Belum ada kategori
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Tambahkan kategori pertama untuk
                mulai mengelola barang.
              </p>

              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Tambah Kategori
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      #
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Nama Kategori
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Deskripsi
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
                  {categories.map(
                    (category, index) => (
                      <tr
                        key={category.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {index + 1}
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {category.name}
                          </p>
                        </td>

                        <td className="max-w-md px-6 py-4 text-sm text-slate-500">
                          {category.description ||
                            '-'}
                        </td>

                        <td className="px-6 py-4">
                          {category.is_active !==
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

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  category
                                )
                              }
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  category
                                )
                              }
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                            >
                              Hapus
                            </button>

                          </div>
                        </td>
                      </tr>
                    )
                  )}
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
                  {editingCategory
                    ? 'Edit Kategori'
                    : 'Tambah Kategori'}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {editingCategory
                    ? 'Perbarui informasi kategori.'
                    : 'Tambahkan kategori barang baru.'}
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

            {/* MODAL BODY */}
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
                  Nama Kategori
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
                  placeholder="Contoh: Semen"
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Deskripsi
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Contoh: Berbagai jenis semen"
                  disabled={saving}
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
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
                    Kategori Aktif
                  </p>

                  <p className="text-xs text-slate-500">
                    Kategori dapat digunakan untuk
                    produk jika status aktif.
                  </p>
                </div>
              </label>

              {/* MODAL FOOTER */}
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
                    : editingCategory
                      ? 'Simpan Perubahan'
                      : 'Tambah Kategori'}
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