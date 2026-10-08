import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../App.css";
import { formatCurrency } from "../../utils/currency";
import { getFavorites, removeFavorite } from "../../utils/favorites";

const Favorites = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFavorites().then(setProducts).catch((error) => {
      if (error.message === "LOGIN_REQUIRED") navigate("/login");
      else setMessage("Favorites are unavailable right now.");
    }).finally(() => setLoading(false));
  }, [navigate]);

  const remove = async (productId) => {
    try {
      await removeFavorite(productId);
      setProducts((current) => current.filter((product) => product._id !== productId));
    } catch { setMessage("Unable to remove this favorite."); }
  };

  return <main className="page-shell"><div className="catalog-header"><div><p className="eyebrow"><Heart size={14} /> Your collection</p><h1>My Favorites</h1><p className="muted">Products you want to keep close.</p></div><span className="filter-pill">{products.length} saved</span></div>{message && <p className="catalog-message" role="alert">{message}</p>}{loading ? <p className="muted">Loading favorites...</p> : products.length ? <div className="product-grid">{products.map((product) => <article className="product-card" key={product._id}><Link to="/categories" state={{ productId: product._id }}><img className="product-image" src={product.image} alt={product.name} /></Link><div className="product-info"><p className="eyebrow">{product.category?.name}</p><h3>{product.name}</h3><p className="muted product-vendor">{product.brand} · {product.stock} in stock</p><div className="product-meta"><span className="price">{formatCurrency(product.price)}</span><div style={{ display: "flex", gap: 7 }}><button className="icon-button" type="button" aria-label={`Remove ${product.name} from favorites`} onClick={() => remove(product._id)}><Trash2 size={17} /></button><button className="icon-button" type="button" aria-label={`Add ${product.name} to cart`} onClick={() => { const items = JSON.parse(localStorage.getItem("shopSphereCart") || "[]"); const existing = items.find(item => item._id === product._id); const next = existing ? items.map(item => item._id === product._id ? { ...item, quantity: Math.min(Number(product.stock || 1), Number(item.quantity || 1) + 1) } : item) : [...items, { ...product, quantity: 1 }]; localStorage.setItem("shopSphereCart", JSON.stringify(next)); window.dispatchEvent(new Event("cartChanged")); }}><ShoppingCart size={17} /></button></div></div></div></article>)}</div> : <section className="glass-panel" style={{ padding: 32, textAlign: "center" }}><Heart size={28} /><h2>No favorite products yet.</h2><p className="muted">Save products from the collection and they will appear here.</p><Link className="button" to="/categories">Continue shopping</Link></section>}</main>;
};

export default Favorites;