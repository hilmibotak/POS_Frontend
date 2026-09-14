import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { Navigate } from 'react-router-dom'

import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Cek apakah user masih memiliki session
  useEffect(() => {
    const checkAuthentication = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        api.defaults.headers.common[
          'Authorization'
        ] = `Bearer ${token}`

        const response = await api.get('/me')

        const userData =
          response.data?.data ||
          response.data?.user ||
          response.data

        setUser(userData)
      } catch (error) {
        console.error(
          'AUTH CHECK ERROR:',
          error
        )

        localStorage.removeItem('token')

        delete api.defaults.headers.common[
          'Authorization'
        ]

        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuthentication()
  }, [])

  // Login
  const login = async (email, password) => {
    const response = await api.post('/login', {
      email,
      password,
    })

    console.log(
      'LOGIN RESPONSE:',
      response.data
    )

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

    // Pasang token ke Axios
    api.defaults.headers.common[
      'Authorization'
    ] = `Bearer ${token}`

    // Ambil data user
    const meResponse =
      await api.get('/me')

    console.log(
      'ME RESPONSE:',
      meResponse.data
    )

    const userData =
      meResponse.data?.data ||
      meResponse.data?.user ||
      meResponse.data

    setUser(userData)

    return userData
  }

  // Logout sementara tetap sederhana
  const logout = async () => {
    try {
      await api.post('/logout')
    } catch (error) {
      console.error(
        'LOGOUT ERROR:',
        error
      )
    }

    localStorage.removeItem('token')

    delete api.defaults.headers.common[
      'Authorization'
    ]

    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}


// ==============================
// PROTECTED ROUTE
// ==============================

export function ProtectedRoute({
  children,
}) {
  const {
    user,
    loading,
  } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">
          Memeriksa autentikasi...
        </div>
      </div>
    )
  }

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

export function RoleRoute({
  roles,
  children,
}) {
  const {
    user,
    loading,
  } = useAuth()

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

// ==============================
// PUBLIC ROUTE
// ==============================

export function PublicRoute({
  children,
}) {
  const {
    user,
    loading,
  } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">
          Memeriksa autentikasi...
        </div>
      </div>
    )
  }

  // Kalau sudah login,
  // tidak boleh kembali ke halaman login
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