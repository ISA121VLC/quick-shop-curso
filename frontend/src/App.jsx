import { Route, Routes } from 'react-router-dom'
import Cart from './pages/cart/Cart.jsx'
import Layout from './layouts/Layout.jsx'
import AdminProducts from './pages/admin/AdminProducts.jsx'
import AdminOrderDetail from './pages/admin/AdminOrderDetail.jsx'
import AdminOrders from './pages/admin/AdminOrders.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'
import ProductForm from './pages/admin/ProductForm.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import Forbidden from './pages/Forbidden.jsx'
import NotFound from './pages/NotFound.jsx'
import OrderDetail from './pages/orders/OrderDetail.jsx'
import Orders from './pages/orders/Orders.jsx'
import Profile from './pages/profile/Profile.jsx'
import Catalog from './pages/products/Catalog.jsx'
import ProductDetail from './pages/products/ProductDetail.jsx'
import RequireAuth from './routes/RequireAuth.jsx'
import RequireRole from './routes/RequireRole.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Catalog />} />
          <Route path="/productos/:id" element={<ProductDetail />} />
          <Route path="/perfil" element={<Profile />} />
          <Route element={<RequireRole roles={['customer']} />}>
            <Route path="/carrito" element={<Cart />} />
            <Route path="/pedidos" element={<Orders />} />
            <Route path="/pedidos/:id" element={<OrderDetail />} />
          </Route>
          <Route element={<RequireRole roles={['admin']} />}>
            <Route path="/admin/productos" element={<AdminProducts />} />
            <Route path="/admin/productos/nuevo" element={<ProductForm />} />
            <Route path="/admin/productos/:id/editar" element={<ProductForm />} />
            <Route path="/admin/usuarios" element={<AdminUsers />} />
            <Route path="/admin/pedidos" element={<AdminOrders />} />
            <Route path="/admin/pedidos/:id" element={<AdminOrderDetail />} />
          </Route>
        </Route>
        <Route path="/403" element={<Forbidden />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
