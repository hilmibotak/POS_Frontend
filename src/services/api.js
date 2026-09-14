import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8001/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

const token = localStorage.getItem('token')

if (token) {
  api.defaults.headers.common['Authorization'] =
    `Bearer ${token}`
}

export default api