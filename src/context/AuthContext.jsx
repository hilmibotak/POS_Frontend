import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { Navigate } from 'react-router-dom'

import api from '../services/api'


// =====================================================
// AUTH CONTEXT
// =====================================================

const AuthContext = createContext(null)


// =====================================================
// AUTH PROVIDER
// =====================================================

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)


  // ===================================================
  // SET TOKEN KE AXIOS
  // ===================================================

  const setAuthToken = (token) => {
    if (token) {
      api.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common[
        'Authorization'
      ]
    }
  }


  // ===================================================
  // CLEAR AUTHENTICATION
  // ===================================================

  const clearAuthentication = () => {
    localStorage.removeItem('token')

    setAuthToken(null)

    setUser(null)
  }


  // ===================================================
  // AMBIL DATA USER DARI RESPONSE
  // ===================================================

  const extractUser = (response) => {
    return (
      response?.data?.data ||
      response?.data?.user ||
      response?.data ||
      null
    )
  }


  // ===================================================
  // CHECK AUTHENTICATION
  // ===================================================

  useEffect(() => {
    const checkAuthentication = async () => {
      const token =
        localStorage.getItem('token')

      // Tidak ada token
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        // Pasang token ke Axios
        setAuthToken(token)

        // Ambil user yang sedang login
        const response =
          await api.get('/me')

        const userData =
          extractUser(response)

        if (!userData) {
          throw new Error(
            'Data user tidak ditemukan'
          )
        }

        setUser(userData)

      } catch (error) {
        console.error(
          'AUTH CHECK ERROR:',
          error
        )

        clearAuthentication()

      } finally {
        setLoading(false)
      }
    }

    checkAuthentication()
  }, [])


  // ===================================================
  // LOGIN
  // ===================================================

  const login = async (
    email,
    password
  ) => {
    try {
      const response =
        await api.post('/login', {
          email,
          password,
        })

      console.log(
        'LOGIN RESPONSE:',
        response.data
      )

      // Ambil token
      const token =
        response.data?.token ||
        response.data?.data?.token ||
        response.data?.access_token

      if (!token) {
        throw new Error(
          'Token tidak ditemukan dari response login'
        )
      }

      // Simpan token
      localStorage.setItem(
        'token',
        token
      )

      // Pasang token
      setAuthToken(token)


      // ===============================================
      // Ambil data user terbaru
      // ===============================================

      const meResponse =
        await api.get('/me')

      console.log(
        'ME RESPONSE:',
        meResponse.data
      )

      const userData =
        extractUser(meResponse)

      if (!userData) {
        throw new Error(
          'Data user tidak ditemukan setelah login'
        )
      }

      setUser(userData)

      return userData

    } catch (error) {
      console.error(
        'LOGIN ERROR:',
        error
      )

      // Kalau login gagal,
      // bersihkan token
      clearAuthentication()

      throw error
    }
  }


  // ===================================================
  // REFRESH USER
  // ===================================================
  //
  // Digunakan kalau kita ingin mengambil
  // data user terbaru dari backend.
  //
  // Contoh:
  // - setelah update profile
  // - setelah perubahan akun
  // - setelah halaman dibuka kembali
  //
  // ===================================================

  const refreshUser = async () => {
    const token =
      localStorage.getItem('token')

    if (!token) {
      setUser(null)
      return null
    }

    try {
      setAuthToken(token)

      const response =
        await api.get('/me')

      const userData =
        extractUser(response)

      if (!userData) {
        throw new Error(
          'Data user tidak ditemukan'
        )
      }

      setUser(userData)

      return userData

    } catch (error) {
      console.error(
        'REFRESH USER ERROR:',
        error
      )

      clearAuthentication()

      throw error
    }
  }


  // ===================================================
  // UPDATE USER
  // ===================================================
  //
  // Update data user langsung di state React.
  //
  // Dipakai setelah API berhasil mengubah profile.
  //
  // ===================================================

  const updateUser = (userData) => {
    if (!userData) {
      return
    }

    setUser(userData)
  }


  // ===================================================
  // UPDATE PROFILE
  // ===================================================
  //
  // API:
  // PUT /api/profile
  //
  // Data:
  // {
  //   name,
  //   email,
  //   password
  // }
  //
  // ===================================================

  const updateProfile = async (
    profileData
  ) => {
    try {
      const payload = {
        name: profileData.name,
        email: profileData.email,
      }


      // Password hanya dikirim
      // kalau memang diisi
      if (
        profileData.password &&
        profileData.password.trim() !== ''
      ) {
        payload.password =
          profileData.password
      }


      const response =
        await api.put(
          '/profile',
          payload
        )

      console.log(
        'UPDATE PROFILE RESPONSE:',
        response.data
      )


      const updatedUser =
        extractUser(response)

      if (updatedUser) {
        setUser(updatedUser)
      } else {
        // Kalau backend tidak mengembalikan
        // user, ambil ulang dari /me
        await refreshUser()
      }


      return response.data

    } catch (error) {
      console.error(
        'UPDATE PROFILE ERROR:',
        error
      )

      throw error
    }
  }


  // ===================================================
  // LOGOUT
  // ===================================================

  const logout = async () => {
    try {
      const token =
        localStorage.getItem('token')

      if (token) {
        setAuthToken(token)

        await api.post('/logout')
      }

    } catch (error) {
      console.error(
        'LOGOUT ERROR:',
        error
      )

    } finally {
      clearAuthentication()
    }
  }


  // ===================================================
  // HELPER ROLE
  // ===================================================

  const isAdmin =
    user?.role === 'admin'

  const isKasir =
    user?.role === 'kasir'

  const isAuthenticated =
    !!user


  // ===================================================
  // CONTEXT VALUE
  // ===================================================

  const contextValue = {
    // User
    user,
    updateUser,
    refreshUser,
    updateProfile,

    // Authentication
    loading,
    isAuthenticated,

    // Role
    isAdmin,
    isKasir,

    // Actions
    login,
    logout,
  }


  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  )
}


// =====================================================
// USE AUTH
// =====================================================

export function useAuth() {
  return useContext(AuthContext)
}


// =====================================================
// PROTECTED ROUTE
// =====================================================

export function ProtectedRoute({
  children,
}) {
  const {
    user,
    loading,
  } = useAuth()


  // Masih mengecek authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">
          Memeriksa autentikasi...
        </div>
      </div>
    )
  }


  // Belum login
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }


  return children
}


// =====================================================
// ROLE ROUTE
// =====================================================

export function RoleRoute({
  roles,
  children,
}) {
  const {
    user,
    loading,
  } = useAuth()


  // Masih loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">
          Memeriksa autentikasi...
        </div>
      </div>
    )
  }


  // Belum login
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }


  // Role tidak sesuai
  if (!roles.includes(user.role)) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }


  return children
}


// =====================================================
// PUBLIC ROUTE
// =====================================================

export function PublicRoute({
  children,
}) {
  const {
    user,
    loading,
  } = useAuth()


  // Masih loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">
          Memeriksa autentikasi...
        </div>
      </div>
    )
  }


  // Sudah login
  if (user) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }


  return children
}