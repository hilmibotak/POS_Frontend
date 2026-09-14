import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import api from '../../services/api'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../context/AuthContext'

function Employees() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [employees, setEmployees] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')

  // Default hanya menampilkan pegawai aktif
  const [status, setStatus] = useState('1')

  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'kasir',
    is_active: true,
  })

  // ==============================
  // CEK ROLE
  // ==============================

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard', {
        replace: true,
      })
    }
  }, [user, navigate])

  // ==============================
  // GET EMPLOYEES
  // ==============================

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/employees', {
        params: {
          search: search || undefined,
          role: role || undefined,

          // Jika all, tampilkan semua status
          // Jika 1, tampilkan aktif
          // Jika 0, tampilkan nonaktif
          is_active:
            status === 'all'
              ? undefined
              : status,
        },
      })

      const result = response.data?.data

      setEmployees(
        Array.isArray(result)
          ? result
          : result?.data || []
      )
    } catch (error) {
      console.error(
        'Gagal mengambil data pegawai:',
        error
      )

      setError(
        error.response?.data?.message ||
        'Gagal mengambil data pegawai.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchEmployees()
    }
  }, [user, search, role, status])

  // ==============================
  // FORM
  // ==============================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setForm((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }))
  }

  const openCreateModal = () => {
    setEditingEmployee(null)

    setForm({
      name: '',
      email: '',
      password: '',
      role: 'kasir',
      is_active: true,
    })

    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const openEditModal = (employee) => {
    setEditingEmployee(employee)

    setForm({
      name: employee.name || '',
      email: employee.email || '',
      password: '',
      role: employee.role || 'kasir',
      is_active: Boolean(employee.is_active),
    })

    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) {
      return
    }

    setShowModal(false)
    setEditingEmployee(null)

    setForm({
      name: '',
      email: '',
      password: '',
      role: 'kasir',
      is_active: true,
    })
  }

  // ==============================
  // CREATE / UPDATE
  // ==============================

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (editingEmployee) {
        const payload = {
          name: form.name,
          email: form.email,
          role: form.role,
          is_active: form.is_active,
        }

        if (form.password.trim() !== '') {
          payload.password = form.password
        }

        await api.put(
          `/employees/${editingEmployee.id}`,
          payload
        )

        setSuccess(
          'Data pegawai berhasil diperbarui.'
        )
      } else {
        await api.post('/employees', {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          is_active: form.is_active,
        })

        setSuccess(
          'Pegawai berhasil ditambahkan.'
        )
      }

      closeModal()
      await fetchEmployees()

      setSuccess(
        editingEmployee
          ? 'Data pegawai berhasil diperbarui.'
          : 'Pegawai berhasil ditambahkan.'
      )
    } catch (error) {
      console.error(
        'Gagal menyimpan pegawai:',
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
          'Data pegawai tidak valid.'
        )
      } else {
        setError(
          error.response?.data?.message ||
          'Gagal menyimpan data pegawai.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  // ==============================
  // NONAKTIFKAN
  // ==============================

  const handleDeactivate = async (employee) => {
    if (!employee.is_active) {
      return
    }

    if (employee.id === user?.id) {
      alert(
        'Kamu tidak dapat menonaktifkan akun sendiri.'
      )

      return
    }

    const confirmed = window.confirm(
      `Apakah kamu yakin ingin menonaktifkan pegawai "${employee.name}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccess('')

      await api.delete(
        `/employees/${employee.id}`
      )

      setSuccess(
        'Pegawai berhasil dinonaktifkan.'
      )

      await fetchEmployees()
    } catch (error) {
      console.error(
        'Gagal menonaktifkan pegawai:',
        error
      )

      setError(
        error.response?.data?.message ||
        'Gagal menonaktifkan pegawai.'
      )
    }
  }

  // ==============================
  // AKTIFKAN KEMBALI
  // ==============================

  const handleActivate = async (employee) => {
    const confirmed = window.confirm(
      `Apakah kamu yakin ingin mengaktifkan kembali pegawai "${employee.name}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccess('')

      await api.put(
        `/employees/${employee.id}`,
        {
          name: employee.name,
          email: employee.email,
          role: employee.role,
          is_active: true,
        }
      )

      setSuccess(
        'Pegawai berhasil diaktifkan kembali.'
      )

      await fetchEmployees()
    } catch (error) {
      console.error(
        'Gagal mengaktifkan pegawai:',
        error
      )

      setError(
        error.response?.data?.message ||
        'Gagal mengaktifkan pegawai.'
      )
    }
  }

  // ==============================
  // ROLE LABEL
  // ==============================

  const getRoleLabel = (employeeRole) => {
    if (employeeRole === 'admin') {
      return 'Admin'
    }

    if (employeeRole === 'kasir') {
      return 'Kasir'
    }

    return employeeRole
  }

  const getRoleClass = (employeeRole) => {
    if (employeeRole === 'admin') {
      return 'bg-purple-100 text-purple-700'
    }

    return 'bg-blue-100 text-blue-700'
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ==============================
            HEADER
        ============================== */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Pegawai
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Kelola data pegawai dan akun pengguna BuildPOS.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <span className="mr-2 text-lg">
              +
            </span>

            Tambah Pegawai
          </button>

        </div>

        {/* ==============================
            SUCCESS
        ============================== */}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* ==============================
            ERROR
        ============================== */}

        {error && !showModal && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ==============================
            FILTER
        ============================== */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* SEARCH */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Cari Pegawai
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Nama atau email..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* ROLE */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Role
              </label>

              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  Semua Role
                </option>

                <option value="admin">
                  Admin
                </option>

                <option value="kasir">
                  Kasir
                </option>
              </select>
            </div>

            {/* STATUS */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="1">
                  Aktif
                </option>

                <option value="0">
                  Nonaktif
                </option>

                <option value="all">
                  Semua Status
                </option>
              </select>
            </div>

          </div>

        </div>

        {/* ==============================
            TABLE
        ============================== */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="border-b border-slate-200 bg-slate-50">

                <tr>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    No
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Nama
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Role
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Aksi
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      Memuat data pegawai...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      Tidak ada data pegawai.
                    </td>
                  </tr>
                ) : (
                  employees.map(
                    (employee, index) => (
                      <tr
                        key={employee.id}
                        className="transition hover:bg-slate-50"
                      >

                        {/* NO */}

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {index + 1}
                        </td>

                        {/* NAMA */}

                        <td className="whitespace-nowrap px-6 py-4">

                          <div className="font-medium text-slate-900">
                            {employee.name}
                          </div>

                        </td>

                        {/* EMAIL */}

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {employee.email}
                        </td>

                        {/* ROLE */}

                        <td className="whitespace-nowrap px-6 py-4">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getRoleClass(employee.role)}`}
                          >
                            {getRoleLabel(
                              employee.role
                            )}
                          </span>

                        </td>

                        {/* STATUS */}

                        <td className="whitespace-nowrap px-6 py-4">

                          {employee.is_active ? (
                            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              Nonaktif
                            </span>
                          )}

                        </td>

                        {/* AKSI */}

                        <td className="whitespace-nowrap px-6 py-4">

                          <div className="flex justify-end gap-2">

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  employee
                                )
                              }
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              Edit
                            </button>

                            {/* NONAKTIFKAN */}

                            {employee.is_active ? (
                              <button
                                type="button"
                                disabled={
                                  employee.id === user?.id
                                }
                                onClick={() =>
                                  handleDeactivate(
                                    employee
                                  )
                                }
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Nonaktifkan
                              </button>
                            ) : (

                              /* AKTIFKAN */

                              <button
                                type="button"
                                onClick={() =>
                                  handleActivate(
                                    employee
                                  )
                                }
                                className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-600 transition hover:bg-green-50"
                              >
                                Aktifkan
                              </button>

                            )}

                          </div>

                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* ==============================
            MODAL
        ============================== */}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">

            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

              {/* MODAL HEADER */}

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                <div>

                  <h2 className="text-lg font-semibold text-slate-900">
                    {editingEmployee
                      ? 'Edit Pegawai'
                      : 'Tambah Pegawai'}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {editingEmployee
                      ? 'Perbarui informasi pegawai.'
                      : 'Tambahkan akun pegawai baru.'}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="text-2xl text-slate-400 transition hover:text-slate-600 disabled:opacity-40"
                >
                  ×
                </button>

              </div>

              {/* MODAL BODY */}

              <form onSubmit={handleSubmit}>

                <div className="space-y-5 px-6 py-6">

                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  {/* NAMA */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Nama
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Masukkan nama pegawai"
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                  </div>

                  {/* EMAIL */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Masukkan email"
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                  </div>

                  {/* PASSWORD */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700">

                      Password

                      {editingEmployee && (
                        <span className="ml-1 font-normal text-slate-400">
                          (kosongkan jika tidak diganti)
                        </span>
                      )}

                    </label>

                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder={
                        editingEmployee
                          ? 'Password baru'
                          : 'Masukkan password'
                      }
                      required={!editingEmployee}
                      minLength="6"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                  </div>

                  {/* ROLE */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Role
                    </label>

                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >

                      <option value="admin">
                        Admin
                      </option>

                      <option value="kasir">
                        Kasir
                      </option>

                    </select>

                  </div>

                  {/* STATUS */}

                  <div className="flex items-center gap-3">

                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />

                    <label
                      htmlFor="is_active"
                      className="text-sm font-medium text-slate-700"
                    >
                      Pegawai aktif
                    </label>

                  </div>

                </div>

                {/* MODAL FOOTER */}

                <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? 'Menyimpan...'
                      : editingEmployee
                        ? 'Simpan Perubahan'
                        : 'Tambah Pegawai'}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  )
}

export default Employees