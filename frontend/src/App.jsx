import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './component/Navbar'
import Home from './component/pages/Home'
import Login from './component/pages/Login'
import Categories from './component/pages/Categories'
import Cart from './component/pages/Cart'
import Register from './component/pages/Register'
import VendorLogin from './component/pages/VendorLogin'
import VendorRegister from './component/pages/VendorRegister'
import VendorDashboard from './component/pages/VendorDashboard'
import Favorites from './component/pages/Favorites'
import Checkout from './component/pages/Checkout'
import Orders from './component/pages/Orders'
import OrderDetails from './component/pages/OrderDetails'
import ForgotPassword from './component/pages/ForgotPassword'
import Terms from './component/pages/Terms'
import Privacy from './component/pages/Privacy'
import { clearAuth, getAuthUser } from './utils/auth'
import './App.css'

// import { ChevronUp } from 'lucide-react';


const App = () => {
  const [user, setUser] = useState(() => {
    try {
      return getAuthUser()
    } catch {
      return null
    }
  })

  const handleLogout = () => { clearAuth(); setUser(null) }

  useEffect(() => {
    const sync = () => setUser(getAuthUser())
    window.addEventListener('storage', sync)
    window.addEventListener('authChanged', sync)
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('authChanged', sync) }
  }, [])

  return (
    <BrowserRouter>
      <Navbar user={user ? { name: user.fullName } : null} cartCount={JSON.parse(localStorage.getItem('shopSphereCart') || '[]').reduce((sum, item) => sum + Number(item.quantity || 1), 0)} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />  
        <Route path="/categories" element={<Categories />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetails />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route path="/vendor/register" element={<VendorRegister />} />
        <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        <Route path="/vendor/products" element={<VendorDashboard />} />
        <Route path="/vendor/products/add" element={<VendorDashboard />} />
        <Route path="/vendor/products/edit/:id" element={<VendorDashboard />} />
        <Route path="/vendor/orders" element={<VendorDashboard />} />
        <Route path="/vendor/profile" element={<VendorDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
