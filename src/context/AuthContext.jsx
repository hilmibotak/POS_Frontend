import { createContext, useContext, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const login = async (email, password) => {
    const response = await api.post('/login', {
      email,
      password,
    })

    console.log('LOGIN RESPONSE:', response.data)

    /*
     * Laravel bisa mengembalikan token dalam beberapa bentuk.
     * Kita cek beberapa kemungkinan supaya aman.
     */
    const token =
      response.data.token ||
      response.data.data?.token ||
      response.data.access_token

    if (!token) {
      console.error(
        'Token tidak ditemukan. Response Laravel:',
        response.data
      )

      throw new Error('Token tidak ditemukan dari response login')
    }

    // Simpan token
    localStorage.setItem('token', token)

    // Pasang token ke Axios
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    console.log('TOKEN:', token)

    // Ambil data user yang sedang login
    const meResponse = await api.get('/me')

    console.log('ME RESPONSE:', meResponse.data)

    const userData =
      meResponse.data.data || meResponse.data.user || meResponse.data

    setUser(userData)

    return userData
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } catch (error) {
      console.error('Logout error:', error)
    }

    localStorage.removeItem('token')

    delete api.defaults.headers.common['Authorization']

    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
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