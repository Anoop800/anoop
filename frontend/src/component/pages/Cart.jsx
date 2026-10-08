import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../App.css";
import { formatCurrency } from "../../utils/currency";

const readCart = () => JSON.parse(localStorage.getItem("shopSphereCart") || "[]");
const Cart = () => {
  const [items, setItems] = useState(readCart);
  const update = (next) => { setItems(next); localStorage.setItem("shopSphereCart", JSON.stringify(next)); window.dispatchEvent(new Event("cartChanged")); };
  useEffect(() => { const sync = () => setItems(readCart()); window.addEventListener("cartChanged", sync); return () => window.removeEventListener("cartChanged", sync); }, []);
  const changeQty = (id, delta) => update(items.map(item => item._id === id ? { ...item, quantity: Math.max(1, Math.min(Number(item.stock ?? 999999), Number(item.quantity || 1) + delta)) } : item));
  const removeItem = id => update(items.filter(item => item._id !== id));
  const subtotal = items.reduce((total, item) => total + Number(item.price) * Number(item.quantity || 1), 0);
  return <main className="page-shell"><div className="catalog-header"><div><p className="eyebrow">Your selections</p><h1>Shopping cart</h1><p className="muted">{items.length ? `${items.length} product${items.length === 1 ? "" : "s"} in your cart.` : "Your cart is ready for its first find."}</p></div></div><div className="cart-layout"><section className="glass-panel cart-panel">{items.length ? items.map(item => <div className="cart-row" key={item._id}><img className="cart-thumb" src={item.image} alt={item.name} /><div><h3>{item.name}</h3><p>{item.category?.name} · {item.brand}</p><div style={{display:"flex",alignItems:"center",gap:8,marginTop:12}}><button className="icon-button" onClick={() => changeQty(item._id,-1)} disabled={Number(item.quantity||1)<=1}><Minus size={14}/></button><strong>{item.quantity || 1}</strong><button className="icon-button" onClick={() => changeQty(item._id,1)} disabled={Number(item.quantity||1)>=Number(item.stock ?? 999999)}><Plus size={14}/></button><span className="muted">{item.stock != null ? `${item.stock} available` : ""}</span></div></div><strong>{formatCurrency(Number(item.price)*Number(item.quantity||1))}</strong><button className="icon-button" type="button" aria-label={`Remove ${item.name}`} onClick={() => removeItem(item._id)}><Trash2 size={16}/></button></div>) : <p className="muted">No products in your cart yet. <Link to="/categories">Browse the collection</Link>.</p>}</section><aside className="glass-panel summary"><h2>Order summary</h2><div className="summary-line"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div><div className="summary-line"><span>Shipping</span><strong>Free</strong></div><div className="summary-line summary-total"><span>Total</span><strong>{formatCurrency(subtotal)}</strong></div>{items.length ? <Link className="button button--full" to="/checkout">Continue to checkout <ArrowRight size={16}/></Link> : <Link className="button button--full" to="/categories">Start shopping</Link>}</aside></div></main>;
};
export default Cart;
