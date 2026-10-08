import { ArrowRight, Heart, ShoppingCart, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../App.css";
import { formatCurrency } from "../../utils/currency";
import { addFavorite, getFavorites, removeFavorite } from "../../utils/favorites";
import { getAuthToken } from "../../utils/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/catalog/categories`).then((response) => response.json()),
      fetch(`${API_URL}/catalog/products`).then((response) => response.json()),
    ]).then(([categoryData, productData]) => {
      setCategories(categoryData.filter((category) => !category.parent).slice(0, 4));
      setProducts(productData.slice(0, 4));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (getAuthToken()) getFavorites().then((items) => setFavoriteIds(new Set(items.map((item) => item._id)))).catch(() => {});
  }, []);

  const toggleFavorite = async (product) => {
    if (!getAuthToken()) return window.location.assign("/login");
    try {
      if (favoriteIds.has(product._id)) {
        await removeFavorite(product._id);
        setFavoriteIds((current) => { const next = new Set(current); next.delete(product._id); return next; });
      } else {
        await addFavorite(product._id);
        setFavoriteIds((current) => new Set(current).add(product._id));
      }
    } catch {}
  };

  return (
  <main className="page-shell">
    <section className="hero-panel">
      <div className="hero-copy">
        <p className="eyebrow">The quiet edit / 2026</p>
        <h1>Objects with a little more soul.</h1>
        <p>Thoughtful essentials for considered spaces, wardrobes, and everyday rituals. Curated slowly, chosen well.</p>
        <Link className="button" to="/categories">Explore the collection <ArrowRight size={17} /></Link>
      </div>
    </section>
    <section className="category-strip" aria-label="Shop categories">
      {categories.map((category, index) => <Link className="category-tile" to={`/categories?category=${category.slug}`} key={category._id}><strong>{category.name}</strong><span>0{index + 1}</span></Link>)}
    </section>
    <section>
      <div className="section-heading"><div><p className="eyebrow">Handpicked for you</p><h2>New in the shop</h2></div><Link className="text-link" to="/categories">View all <ArrowRight size={15} /></Link></div>
      <div className="product-grid">{products.map((product) => <article className="product-card" key={product._id}><img className="product-image" src={product.image} alt={product.name} /><div className="product-info"><h3>{product.name}</h3><div className="rating"><span>★★★★★</span><span className="muted">{product.rating}</span></div><div className="product-meta"><span className="price">{formatCurrency(product.price)}</span><button className="icon-button" type="button" aria-label={`${favoriteIds.has(product._id) ? "Remove" : "Save"} ${product.name} ${favoriteIds.has(product._id) ? "from favorites" : "to favorites"}`} onClick={() => toggleFavorite(product)}><Heart size={17} fill={favoriteIds.has(product._id) ? "currentColor" : "none"} /></button></div></div></article>)}</div>
    </section>
    <section className="glass-panel" style={{ marginTop: 72, padding: "30px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}><div><p className="eyebrow"><Sparkles size={13} /> Member notes</p><h2 style={{ margin: 0 }}>A better way to browse.</h2><p className="muted" style={{ marginTop: 8 }}>Save your favorites and keep your next find close.</p></div><Link className="button button--secondary" to="/register">Join ShopSphere <ShoppingCart size={16} /></Link></section>
  </main>
  );
};

export default Home;
