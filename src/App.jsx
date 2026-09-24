import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Categories from './pages/categories/Categories'
import Units from './pages/units/Units'
import Products from './pages/products/Products'
import ProductUnits from './pages/products/ProductUnits'
import Customers from './pages/customers/Customers'
import Cashier from './pages/cashier/Cashier'

import Transactions from './pages/transactions/Transactions'
import TransactionDetail from './pages/transactions/TransactionDetail'

import Stock from './pages/stock/Stock'
import StockIn from './pages/stock/StockIn'
import Employees from './pages/employees/Employees'
import Reports from './pages/reports/Reports'
import Profile from './pages/profile/Profile'

import PaymentHistory from './pages/payment-history/PaymentHistory'
import PaymentHistoryDetail from './pages/payment-history/PaymentHistoryDetail'

import {
  AuthProvider,
  ProtectedRoute,
  PublicRoute,
  RoleRoute,
} from './context/AuthContext'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>

        <Routes>

          {/* =========================
              LOGIN
          ========================= */}

          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />


          {/* =========================
              DASHBOARD
              ADMIN + KASIR
          ========================= */}

          <Route
            path="/dashboard"
            element={
              <RoleRoute
                roles={['admin', 'kasir']}
              >
                <Dashboard />
              </RoleRoute>
            }
          />


          {/* =========================
              KASIR
              ADMIN + KASIR
          ========================= */}

          <Route
            path="/cashier"
            element={
              <RoleRoute
                roles={['admin', 'kasir']}
              >
                <Cashier />
              </RoleRoute>
            }
          />


          {/* =========================
              PROFILE
              ADMIN + KASIR
          ========================= */}

          <Route
            path="/profile"
            element={
              <RoleRoute
                roles={['admin', 'kasir']}
              >
                <Profile />
              </RoleRoute>
            }
          />


          {/* =========================
              PEMBAYARAN LANGSUNG
              
              Metode:
              - Cash
              - Debit
              - QRIS
              - Transfer
          ========================= */}

          <Route
            path="/transactions"
            element={
              <RoleRoute
                roles={['admin', 'kasir']}
              >
                <Transactions />
              </RoleRoute>
            }
          />

          {/* Detail Pembayaran Langsung */}

          <Route
            path="/transactions/:id"
            element={
              <RoleRoute
                roles={['admin', 'kasir']}
              >
                <TransactionDetail />
              </RoleRoute>
            }
          />


          {/* =========================
              RIWAYAT TAGIHAN
              
              Metode:
              - Bon / Kasbon
              - Credit
              - Partial
          ========================= */}

          <Route
            path="/payment-history"
            element={
              <RoleRoute
                roles={['admin', 'kasir']}
              >
                <PaymentHistory />
              </RoleRoute>
            }
          />

          {/* Detail Riwayat Tagihan */}

          <Route
            path="/payment-history/:id"
            element={
              <RoleRoute
                roles={['admin', 'kasir']}
              >
                <PaymentHistoryDetail />
              </RoleRoute>
            }
          />


          {/* =========================
              PRODUCTS
              ADMIN + KASIR
          ========================= */}

          <Route
            path="/products"
            element={
              <RoleRoute
                roles={['admin', 'kasir']}
              >
                <Products />
              </RoleRoute>
            }
          />


          {/* =========================
              CUSTOMERS
              ADMIN + KASIR
          ========================= */}

          <Route
            path="/customers"
            element={
              <RoleRoute
                roles={['admin', 'kasir']}
              >
                <Customers />
              </RoleRoute>
            }
          />


          {/* =========================
              ADMIN ONLY
              CATEGORIES
          ========================= */}

          <Route
            path="/categories"
            element={
              <RoleRoute
                roles={['admin']}
              >
                <Categories />
              </RoleRoute>
            }
          />


          {/* =========================
              ADMIN ONLY
              UNITS
          ========================= */}

          <Route
            path="/units"
            element={
              <RoleRoute
                roles={['admin']}
              >
                <Units />
              </RoleRoute>
            }
          />


          {/* =========================
              ADMIN ONLY
              PRODUCT UNITS
          ========================= */}

          <Route
            path="/products/:productId/units"
            element={
              <RoleRoute
                roles={['admin']}
              >
                <ProductUnits />
              </RoleRoute>
            }
          />


          {/* =========================
              ADMIN ONLY
              STOCK
          ========================= */}

          <Route
            path="/stock"
            element={
              <RoleRoute
                roles={['admin']}
              >
                <Stock />
              </RoleRoute>
            }
          />

          <Route
            path="/stock/in"
            element={
              <RoleRoute
                roles={['admin']}
              >
                <StockIn />
              </RoleRoute>
            }
          />


          {/* =========================
              ADMIN ONLY
              EMPLOYEES
          ========================= */}

          <Route
            path="/employees"
            element={
              <RoleRoute
                roles={['admin']}
              >
                <Employees />
              </RoleRoute>
            }
          />


          {/* =========================
              ADMIN ONLY
              REPORTS
          ========================= */}

          <Route
            path="/reports"
            element={
              <RoleRoute
                roles={['admin']}
              >
                <Reports />
              </RoleRoute>
            }
          />


          {/* =========================
              DEFAULT
          ========================= */}

          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

        </Routes>

      </AuthProvider>
    </BrowserRouter>
  )
}

export default App