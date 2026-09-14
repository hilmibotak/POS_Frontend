import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../services/api'

function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    is_active: true,
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/customers')

      const data = response.data.data || response.data

      setCustomers(
        Array.isArray(data)
          ? data
          : data.data || []
      )
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
        'Gagal mengambil data pelanggan'
      )
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      name: '',
      phone: '',
      address: '',
      is_active: true,
    })

    setEditing(null)
  }

  const openCreateModal = () => {
    resetForm()
    setError('')
    setSuccess('')
    setModalOpen(true)
  }

  const openEditModal = (customer) => {
    setEditing(customer)

    setForm({
      name: customer.name || '',
      phone: customer.phone || '',
      address: customer.address || '',
      is_active: Boolean(customer.is_active),
    })

    setError('')
    setSuccess('')
    setModalOpen(true)
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (!form.name.trim()) {
        setError('Nama pelanggan wajib diisi')
        return
      }

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        is_active: Boolean(form.is_active),
      }

      if (editing) {
        await api.put(`/customers/${editing.id}`, payload)

        setSuccess('Pelanggan berhasil diperbarui')
      } else {
        await api.post('/customers', payload)

        setSuccess('Pelanggan berhasil ditambahkan')
      }

      setModalOpen(false)
      resetForm()

      await fetchCustomers()
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
        'Gagal menyimpan data pelanggan'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (customer) => {
    const confirmed = window.confirm(
      `Nonaktifkan pelanggan "${customer.name}"?`
    )

    if (!confirmed) return

    try {
      setError('')
      setSuccess('')

      await api.delete(`/customers/${customer.id}`)

      setSuccess('Pelanggan berhasil dinonaktifkan')

      await fetchCustomers()
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
        'Gagal menonaktifkan pelanggan'
      )
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const keyword = search.toLowerCase()

    return (
      customer.name?.toLowerCase().includes(keyword) ||
      customer.phone?.toLowerCase().includes(keyword) ||
      customer.address?.toLowerCase().includes(keyword)
    )
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Pelanggan
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Kelola data pelanggan BuildPOS
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Tambah Pelanggan
          </button>
        </div>

        {/* SUCCESS */}
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* ERROR */}
        {error && !modalOpen && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* CONTENT */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* SEARCH */}
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="font-semibold text-slate-900">
                Daftar Pelanggan
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredCustomers.length} pelanggan ditemukan
              </p>
            </div>

            <div className="w-full sm:w-80">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, no. HP, atau alamat..."
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

          </div>

          {/* TABLE */}
          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              Memuat data pelanggan...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="px-5 py-12 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                ♙
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                {search
                  ? 'Pelanggan tidak ditemukan'
                  : 'Belum ada pelanggan'}
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                {search
                  ? 'Coba gunakan kata kunci pencarian yang lain.'
                  : 'Tambahkan pelanggan untuk digunakan dalam transaksi.'}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  + Tambah Pelanggan
                </button>
              )}

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px] text-left">

                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Pelanggan
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      No. HP
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Alamat
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

                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-slate-50"
                    >

                      {/* NAME */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                            {customer.name
                              ?.charAt(0)
                              ?.toUpperCase() || 'P'}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {customer.name}
                            </p>

                            <p className="text-xs text-slate-400">
                              ID #{customer.id}
                            </p>
                          </div>

                        </div>
                      </td>

                      {/* PHONE */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {customer.phone || '-'}
                      </td>

                      {/* ADDRESS */}
                      <td className="max-w-xs px-5 py-4 text-sm text-slate-600">
                        <p className="truncate">
                          {customer.address || '-'}
                        </p>
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-4">
                        {customer.is_active ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            Aktif
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* ACTION */}
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(customer)
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                          >
                            Edit
                          </button>

                          {customer.is_active && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(customer)
                              }
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

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editing
                    ? 'Edit Pelanggan'
                    : 'Tambah Pelanggan'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Lengkapi informasi pelanggan
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

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* NAME */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Nama Pelanggan
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Contoh: Toko Jaya"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* PHONE */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  No. HP
                </label>

                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Contoh: 081234567890"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* ADDRESS */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Alamat
                </label>

                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Masukkan alamat pelanggan..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* STATUS */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Status Aktif
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Pelanggan dapat dipilih saat transaksi.
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
                      : 'Tambah Pelanggan'}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Customers