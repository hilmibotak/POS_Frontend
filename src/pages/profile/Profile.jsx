import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

function Profile() {
  const navigate = useNavigate()

  const {
    user,
    updateProfile,
  } = useAuth()

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    password_confirmation: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // ==========================================
  // UPDATE FORM KETIKA USER BERUBAH
  // ==========================================

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        password_confirmation: '',
      })
    }
  }, [user])

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    setSuccessMessage('')
    setErrorMessage('')
  }

  // ==========================================
  // UPDATE PROFILE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault()

    setSuccessMessage('')
    setErrorMessage('')

    if (
      formData.password &&
      formData.password !== formData.password_confirmation
    ) {
      setErrorMessage(
        'Konfirmasi password tidak cocok.'
      )

      return
    }

    try {
      setSaving(true)

      const payload = {
        name: formData.name,
        email: formData.email,
      }

      if (formData.password) {
        payload.password = formData.password
      }

      const response = await updateProfile(payload)

      setFormData((prev) => ({
        ...prev,
        password: '',
        password_confirmation: '',
      }))

      setSuccessMessage(
        response?.message ||
          'Profil berhasil diperbarui.'
      )
    } catch (error) {
      console.error(
        'UPDATE PROFILE ERROR:',
        error
      )

      let message =
        error.response?.data?.message ||
        'Gagal memperbarui profil.'

      if (error.response?.data?.errors) {
        const errors =
          error.response.data.errors

        const firstError =
          Object.values(errors)?.[0]?.[0]

        if (firstError) {
          message = firstError
        }
      }

      setErrorMessage(message)
    } finally {
      setSaving(false)
    }
  }

  // ==========================================
  // INITIAL NAMA
  // ==========================================

  const getInitials = (name) => {
    if (!name) {
      return 'U'
    }

    return name
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  // ==========================================
  // ROLE
  // ==========================================

  const getRoleLabel = (role) => {
    if (role === 'admin') {
      return 'Administrator'
    }

    if (role === 'kasir') {
      return 'Kasir'
    }

    return role || '-'
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">

        {/* =====================================
            HEADER PROFILE
        ====================================== */}

        <div className="mb-6 flex items-center justify-between">

          {/* JUDUL */}

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Profil Saya
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Kelola informasi akun dan keamanan
              profil kamu.
            </p>
          </div>

          {/* ===================================
              BUTTON KEMBALI
          ==================================== */}

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            <span className="text-lg leading-none">
              ←
            </span>

            <span>
              Kembali ke Dashboard
            </span>
          </button>

        </div>

        {/* =====================================
            SUCCESS MESSAGE
        ====================================== */}

        {successMessage && (
          <div className="mb-6 flex items-center rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <span className="mr-2 font-bold">
              ✓
            </span>

            {successMessage}
          </div>
        )}

        {/* =====================================
            ERROR MESSAGE
        ====================================== */}

        {errorMessage && (
          <div className="mb-6 flex items-center rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="mr-2 font-bold">
              !
            </span>

            {errorMessage}
          </div>
        )}

        {/* =====================================
            CONTENT
        ====================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ===================================
              PROFILE CARD
          ==================================== */}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex flex-col items-center text-center">

              {/* AVATAR */}

              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                {getInitials(user?.name)}
              </div>

              {/* NAME */}

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                {user?.name || 'Pengguna'}
              </h2>

              {/* EMAIL */}

              <p className="mt-1 text-sm text-slate-500">
                {user?.email || '-'}
              </p>

              {/* ROLE */}

              <div className="mt-4">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    user?.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {getRoleLabel(user?.role)}
                </span>
              </div>

              {/* STATUS */}

              <div className="mt-3 flex items-center gap-2 text-sm">

                <span className="h-2 w-2 rounded-full bg-green-500"></span>

                <span className="text-slate-600">
                  Akun Aktif
                </span>

              </div>

            </div>

            {/* ACCOUNT SUMMARY */}

            <div className="mt-6 border-t border-slate-100 pt-5">

              <div className="flex items-center justify-between text-sm">

                <span className="text-slate-500">
                  Role
                </span>

                <span className="font-medium capitalize text-slate-800">
                  {user?.role || '-'}
                </span>

              </div>

              <div className="mt-3 flex items-center justify-between text-sm">

                <span className="text-slate-500">
                  Status
                </span>

                <span className="font-medium text-green-600">
                  Aktif
                </span>

              </div>

            </div>

          </div>

          {/* ===================================
              FORM PROFILE
          ==================================== */}

          <div className="lg:col-span-2">

            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-slate-200 bg-white shadow-sm"
            >

              {/* INFORMASI AKUN */}

              <div className="border-b border-slate-200 p-6">

                <h2 className="text-lg font-semibold text-slate-900">
                  Informasi Akun
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Perbarui informasi dasar akun kamu.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* NAMA */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Nama Lengkap
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Masukkan nama"
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Masukkan email"
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                  </div>

                </div>

              </div>

              {/* =================================
                  PASSWORD
              ================================== */}

              <div className="p-6">

                <h2 className="text-lg font-semibold text-slate-900">
                  Ubah Password
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Kosongkan jika kamu tidak ingin
                  mengubah password.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* PASSWORD BARU */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Password Baru
                    </label>

                    <div className="relative">

                      <input
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Minimal 6 karakter"
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-24 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            !showPassword
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-800"
                      >
                        {showPassword
                          ? 'Sembunyikan'
                          : 'Lihat'}
                      </button>

                    </div>

                  </div>

                  {/* KONFIRMASI PASSWORD */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Konfirmasi Password
                    </label>

                    <div className="relative">

                      <input
                        type={
                          showConfirmation
                            ? 'text'
                            : 'password'
                        }
                        name="password_confirmation"
                        value={
                          formData.password_confirmation
                        }
                        onChange={handleChange}
                        placeholder="Ulangi password baru"
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-24 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmation(
                            !showConfirmation
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-800"
                      >
                        {showConfirmation
                          ? 'Sembunyikan'
                          : 'Lihat'}
                      </button>

                    </div>

                  </div>

                </div>

                {/* SAVE BUTTON */}

                <div className="mt-6 flex justify-end">

                  <button
                    type="submit"
                    disabled={saving}
                    className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition ${
                      saving
                        ? 'cursor-not-allowed bg-blue-400'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {saving
                      ? 'Menyimpan...'
                      : 'Simpan Perubahan'}
                  </button>

                </div>

              </div>

            </form>

          </div>

        </div>

      </div>
    </div>
  )
}

export default Profile