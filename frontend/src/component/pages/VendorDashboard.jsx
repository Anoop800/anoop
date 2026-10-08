import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { BarChart3, Box, ClipboardList, LogOut, Pencil, Plus, Save, Store, Trash2, UserRound } from "lucide-react";
import "./Vendor.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const blankProduct = { name: "", description: "", category: "", price: "", stock: "", brand: "", image: "" };

const VendorDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [vendor, setVendor] = useState(() => JSON.parse(localStorage.getItem("vendorUser") || "null"));
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ totalProducts: 0, activeProducts: 0, outOfStockProducts: 0, totalOrders: 0 });
  const [form, setForm] = useState(blankProduct);
  const [profile, setProfile] = useState({ businessName: "", ownerName: "", phone: "", businessAddress: "" });
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState([]);

  const token = localStorage.getItem("vendorToken");
  const request = async (path, options = {}) => {
    const response = await fetch(`${API_URL}/api/vendors${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
    if (response.status === 401 || response.status === 403) { logout(); throw new Error("Vendor authentication expired"); }
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  };
  const logout = () => { localStorage.removeItem("vendorToken"); localStorage.removeItem("vendorUser"); navigate("/vendor/login"); };

  useEffect(() => {
    if (!token || !vendor) { navigate("/vendor/login", { replace: true }); return; }
    request("/profile").then((data) => { setVendor(data); setProfile({ businessName: data.businessName || "", ownerName: data.ownerName || "", phone: data.phone || "", businessAddress: data.businessAddress || "" }); }).catch(() => {});
    request("/products").then(setProducts).catch((error) => setMessage(error.message));
    request("/dashboard").then(setStats).catch(() => {});
    request("/orders").then(setOrders).catch(() => {});
    fetch(`${API_URL}/api/catalog/categories`).then((response) => response.json()).then(setCategories).catch(() => {});
  // Bootstrap the vendor workspace once after the protected route mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (id && products.length) {
      const product = products.find((item) => item._id === id);
      if (product) setForm({ name: product.name, description: product.description, category: product.category?._id || product.category, price: product.price, stock: product.stock, brand: product.brand, image: product.image });
    }
  }, [id, products]);

  const refreshProducts = () => Promise.all([request("/products"), request("/dashboard")]).then(([items, dashboard]) => { setProducts(items); setStats(dashboard); });
  const submitProduct = async (event) => { event.preventDefault(); setMessage(""); try { await request(id ? `/products/${id}` : "/products", { method: id ? "PUT" : "POST", body: JSON.stringify(form) }); setMessage(id ? "Product updated." : "Product created."); await refreshProducts(); navigate("/vendor/products"); } catch (error) { setMessage(error.message); } };
  const deleteProduct = async (productId) => { if (!window.confirm("Delete this product?")) return; try { await request(`/products/${productId}`, { method: "DELETE" }); await refreshProducts(); setMessage("Product deleted."); } catch (error) { setMessage(error.message); } };
  const updateOrder = async (orderId, status) => { try { await request(`/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ status }) }); const next = await request("/orders"); setOrders(next); setMessage("Order status updated."); } catch (error) { setMessage(error.message); } };

  const saveProfile = async (event) => { event.preventDefault(); try { const data = await request("/profile", { method: "PUT", body: JSON.stringify(profile) }); setVendor(data.vendor); localStorage.setItem("vendorUser", JSON.stringify(data.vendor)); setMessage("Profile updated."); } catch (error) { setMessage(error.message); } };

  const path = location.pathname;
  const isForm = path.includes("/products/add") || path.includes("/products/edit/");
  const title = path === "/vendor/dashboard" ? "Overview" : path === "/vendor/products" ? "My products" : path === "/vendor/orders" ? "Orders" : path === "/vendor/profile" ? "Vendor profile" : id ? "Edit product" : "Add product";
  const nav = [{ label: "Dashboard", to: "/vendor/dashboard", icon: BarChart3 }, { label: "My products", to: "/vendor/products", icon: Box }, { label: "Add product", to: "/vendor/products/add", icon: Plus }, { label: "Orders", to: "/vendor/orders", icon: ClipboardList }, { label: "Profile", to: "/vendor/profile", icon: UserRound }];

  return <main className="vendor-shell"><aside className="vendor-sidebar"><Link className="vendor-brand" to="/"><Store size={19} /> ShopSphere</Link><div className="vendor-identity"><strong>{vendor?.businessName}</strong><span>{vendor?.vendorId}</span></div><nav>{nav.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? "vendor-nav-link active" : "vendor-nav-link"}><Icon size={17} />{label}</NavLink>)}</nav><button className="vendor-logout" type="button" onClick={logout}><LogOut size={17} /> Logout</button></aside><section className="vendor-content"><header className="vendor-header"><div><p className="eyebrow">Vendor workspace</p><h1>{title}</h1></div><span className="vendor-id-badge">{vendor?.vendorId}</span></header>{message && <p className="vendor-alert" role="status">{message}</p>}{path === "/vendor/dashboard" && <div className="vendor-dashboard"><section className="vendor-welcome"><div><p className="eyebrow">Good to see you</p><h2>{vendor?.businessName}</h2><p className="muted">Business owner: {vendor?.ownerName}</p></div><Link className="button" to="/vendor/products/add"><Plus size={17} /> Add product</Link></section><div className="vendor-stat-grid"><div><span>Total products</span><strong>{stats.totalProducts}</strong></div><div><span>Active products</span><strong>{stats.activeProducts}</strong></div><div><span>Out of stock</span><strong>{stats.outOfStockProducts}</strong></div><div><span>Related orders</span><strong>{stats.totalOrders}</strong></div></div></div>}{path === "/vendor/products" && <div className="vendor-products"><div className="vendor-section-heading"><p className="muted">Only products owned by {vendor?.vendorId} appear here.</p><Link className="button" to="/vendor/products/add"><Plus size={17} /> Add product</Link></div>{products.length ? <div className="vendor-product-list">{products.map((product) => <article key={product._id}><img src={product.image} alt={product.name} /><div><h3>{product.name}</h3><p>{product.category?.name} · {product.brand}</p><strong>₹{Number(product.price).toLocaleString("en-IN")}</strong></div><span className={product.stock ? "stock-active" : "stock-empty"}>{product.stock ? `${product.stock} in stock` : "Out of stock"}</span><div className="vendor-actions"><Link className="icon-button" to={`/vendor/products/edit/${product._id}`} aria-label={`Edit ${product.name}`}><Pencil size={16} /></Link><button className="icon-button" type="button" onClick={() => deleteProduct(product._id)} aria-label={`Delete ${product.name}`}><Trash2 size={16} /></button></div></article>)}</div> : <div className="vendor-empty"><Box size={28} /><p>No products yet.</p><Link className="button" to="/vendor/products/add">Create your first product</Link></div>}</div>}{isForm && <form className="vendor-panel vendor-product-form" onSubmit={submitProduct}><div className="vendor-form-grid"><label>Product name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Brand<input required value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} /></label><label>Description<textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label>Category<select required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="">Select category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.parent ? `${category.name}` : category.name}</option>)}</select></label><label>Price<input required min="0" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label><label>Stock quantity<input required min="0" type="number" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} /></label><label className="vendor-form-full">Product image URL<input required type="url" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} /></label></div><button className="button" type="submit"><Save size={17} /> {id ? "Save changes" : "Create product"}</button></form>}{path === "/vendor/orders" && <div className="vendor-products">{orders.length ? orders.map(order => <article key={order._id}><div><h3>{order.orderNumber}</h3><p>{order.customer?.fullName || "Customer"} · {order.customer?.phone || ""}</p><p>{order.items.map(item => `${item.name} × ${item.quantity}`).join(", ")}</p><strong>₹{Number(order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)).toLocaleString("en-IN")}</strong></div><span>{order.status}</span><select value={order.status} onChange={event => updateOrder(order._id, event.target.value)} disabled={order.status === "cancelled"}><option value="placed">Placed</option><option value="confirmed">Confirmed</option><option value="packed">Packed</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></article>) : <div className="vendor-empty vendor-panel"><ClipboardList size={30} /><h2>No vendor orders yet</h2><p className="muted">Orders containing your products will appear here.</p></div>}</div>}{path === "/vendor/profile" && <form className="vendor-panel vendor-form-grid" onSubmit={saveProfile}><label>Vendor ID<input value={vendor?.vendorId || ""} disabled /></label><label>Email<input value={vendor?.email || ""} disabled /></label><label>Business name<input value={profile.businessName} onChange={(event) => setProfile({ ...profile, businessName: event.target.value })} /></label><label>Owner name<input value={profile.ownerName} onChange={(event) => setProfile({ ...profile, ownerName: event.target.value })} /></label><label>Phone<input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label><label className="vendor-form-full">Business address<input value={profile.businessAddress} onChange={(event) => setProfile({ ...profile, businessAddress: event.target.value })} /></label><button className="button" type="submit"><Save size={17} /> Save profile</button></form>}</section></main>;
};

export default VendorDashboard;
