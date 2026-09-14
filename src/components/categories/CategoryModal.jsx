import { useEffect, useState } from 'react'

function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  category,
  loading,
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (category) {
      setName(category.name || '')
      setDescription(category.description || '')
      setIsActive(category.is_active !== false)
    } else {
      setName('')
      setDescription('')
      setIsActive(true)
    }
  }, [category, isOpen])

  if (!isOpen) {
    return null
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    onSubmit({
      name,
      description,
      is_active: isActive,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {category
                ? 'Edit Kategori'
                : 'Tambah Kategori'}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {category
                ? 'Perbarui informasi kategori.'
                : 'Tambahkan kategori barang baru.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-5 p-6">
            {/* Nama */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Nama Kategori
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Semen"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Deskripsi */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Deskripsi
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Contoh: Berbagai jenis semen"
                rows="4"
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </label>

              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 transition ${
                  isActive
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="text-left">
                  <p
                    className={`text-sm font-semibold ${
                      isActive
                        ? 'text-emerald-700'
                        : 'text-slate-600'
                    }`}
                  >
                    {isActive
                      ? 'Kategori Aktif'
                      : 'Kategori Tidak Aktif'}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {isActive
                      ? 'Kategori dapat digunakan.'
                      : 'Kategori tidak digunakan.'}
                  </p>
                </div>

                <div
                  className={`relative h-6 w-11 rounded-full transition ${
                    isActive
                      ? 'bg-emerald-500'
                      : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                      isActive
                        ? 'left-6'
                        : 'left-1'
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? 'Menyimpan...'
                : category
                  ? 'Simpan Perubahan'
                  : 'Tambah Kategori'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CategoryModal