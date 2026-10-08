import { Heart, Plus, Search, ShoppingCart, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../../App.css";
import { formatCurrency } from "../../utils/currency";
import { addFavorite, getFavorites, removeFavorite } from "../../utils/favorites";
import { getAuthToken } from "../../utils/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Categories = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  useEffect(() => {
    if (getAuthToken()) getFavorites().then((items) => setFavoriteIds(new Set(items.map((item) => item._id)))).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/catalog/categories`)
      .then((response) => response.json())
      .then(setCategories)
      .catch(() => setMessage("Categories are unavailable right now."));
  }, []);

  useEffect(() => {
    setLoading(true);
    setMessage("");
    const query = new URLSearchParams();
    if (search.trim()) query.set("search", search.trim());
    if (selectedCategory) query.set("category", selectedCategory);
    fetch(`${API_URL}/catalog/products?${query}`)
      .then((response) => {
        if (!response.ok) throw new Error("Products unavailable");
        return response.json();
      })
      .then(setProducts)
      .catch(() => setMessage("Products are unavailable right now."))
      .finally(() => setLoading(false));
  }, [search, selectedCategory]);

  const updateFilters = (nextSearch, nextCategory) => {
    setSearch(nextSearch);
    setSelectedCategory(nextCategory);
    const nextParams = {};
    if (nextSearch.trim()) nextParams.search = nextSearch.trim();
    if (nextCategory) nextParams.category = nextCategory;
    setSearchParams(nextParams);
  };

  const toggleFavorite = async (product) => {
    if (!getAuthToken()) return navigate("/login");
    try {
      if (favoriteIds.has(product._id)) {
        await removeFavorite(product._id);
        setFavoriteIds((current) => { const next = new Set(current); next.delete(product._id); return next; });
      } else {
        await addFavorite(product._id);
        setFavoriteIds((current) => new Set(current).add(product._id));
      }
    } catch { setMessage("Unable to update favorites."); }
  };

  const saveItem = (key, product) => {
    if (Number(product.stock) <= 0) return setMessage("This product is out of stock.");
    const items = JSON.parse(localStorage.getItem(key) || "[]");
    if (key === "shopSphereCart") {
      const existing = items.find(item => item._id === product._id);
      const next = existing ? items.map(item => item._id === product._id ? { ...item, quantity: Math.min(Number(item.stock || product.stock), Number(item.quantity || 1) + 1) } : item) : [...items, { ...product, quantity: 1 }];
      localStorage.setItem(key, JSON.stringify(next)); window.dispatchEvent(new Event("cartChanged")); setMessage("Added to cart"); return;
    }
    if (!items.some((item) => item._id === product._id)) { localStorage.setItem(key, JSON.stringify([...items, product])); setMessage("Saved"); }
  };

  const parentCategories = categories.filter((category) => !category.parent);

  return <main className="page-shell">
    <div className="catalog-header"><div><p className="eyebrow">The collection</p><h1>Find your next favorite.</h1><p className="muted">A considered mix of useful, beautiful things.</p></div><span className="filter-pill">{products.length} products</span></div>
    <div className="catalog-controls">
      <label className="catalog-search"><Search size={17} /><span className="sr-only">Search products</span><input value={search} onChange={(event) => updateFilters(event.target.value, selectedCategory)} placeholder="Search products or brands" /></label>
      <select value={selectedCategory} onChange={(event) => updateFilters(search, event.target.value)} aria-label="Filter by category"><option value="">All categories</option>{parentCategories.map((category) => <option value={category.slug} key={category._id}>{category.name}</option>)}</select>
      {selectedCategory && <button className="text-link catalog-clear" type="button" onClick={() => updateFilters(search, "")}>Clear category <X size={15} /></button>}
    </div>
    {message && <p className="catalog-message" role="status">{message}</p>}
    {loading ? <p className="muted">Searching...</p> : products.length ? <div className="product-grid">{products.map((product) => <article className="product-card" key={product._id}><button className="product-image-button" type="button" onClick={() => setSelectedProduct(product)}><img className="product-image" src={product.image} alt={product.name} /></button><div className="product-info"><p className="eyebrow" style={{ marginBottom: 8 }}>{product.category?.name}</p><h3>{product.name}</h3><p className="muted product-vendor">{product.brand} · {product.stock} in stock</p><div className="product-meta"><span className="price">{formatCurrency(product.price)}</span><div style={{ display: "flex", gap: 7 }}><button className="icon-button" type="button" aria-label={`${favoriteIds.has(product._id) ? "Remove" : "Save"} ${product.name} ${favoriteIds.has(product._id) ? "from favorites" : "to favorites"}`} onClick={() => toggleFavorite(product)}><Heart size={17} fill={favoriteIds.has(product._id) ? "currentColor" : "none"} /></button><button className="icon-button" type="button" aria-label={`Add ${product.name} to cart`} onClick={() => saveItem("shopSphereCart", product)}><Plus size={17} /></button></div></div></div></article>)}</div> : <p className="muted">No products found.</p>}
    {selectedProduct && <div className="product-dialog" role="dialog" aria-modal="true" aria-label={selectedProduct.name}><button className="icon-button dialog-close" type="button" onClick={() => setSelectedProduct(null)} aria-label="Close product details"><X size={18} /></button><img className="dialog-image" src={selectedProduct.image} alt={selectedProduct.name} /><div><p className="eyebrow">{selectedProduct.category?.name}</p><h2>{selectedProduct.name}</h2><p className="muted">{selectedProduct.description}</p><p className="price">{formatCurrency(selectedProduct.price)}</p><p className="muted">Sold by {selectedProduct.vendor?.businessName || "ShopSphere vendor"}</p><button className="button" type="button" onClick={() => toggleFavorite(selectedProduct)}><Heart size={16} fill={favoriteIds.has(selectedProduct._id) ? "currentColor" : "none"} /> {favoriteIds.has(selectedProduct._id) ? "Remove favorite" : "Add to favorites"}</button><button className="button button--secondary" type="button" onClick={() => saveItem("shopSphereCart", selectedProduct)}><ShoppingCart size={16} /> Add to cart</button></div></div>}
  </main>;
};

export default Categories;
