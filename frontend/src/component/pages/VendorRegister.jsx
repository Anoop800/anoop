import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import "./Vendor.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const initialForm = { businessName: "", ownerName: "", email: "", phone: "", businessAddress: "", password: "", confirmPassword: "" };

const VendorRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    if (Object.values(form).some((value) => !value.trim())) return setMessage("Please complete every field.");
    if (form.password.length < 8) return setMessage("Password must be at least 8 characters.");
    if (form.password !== form.confirmPassword) return setMessage("Passwords do not match.");
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/vendors/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) return setMessage(data.message || "Unable to register.");
      navigate("/vendor/login");
    } catch { setMessage("Unable to connect to the server."); } finally { setSubmitting(false); }
  };

  return <main className="vendor-auth-page"><form className="vendor-auth-card vendor-auth-card--wide" onSubmit={submit}><Building2 size={30} className="vendor-icon" /><p className="eyebrow">ShopSphere partners</p><h1>Register your business</h1><p className="muted">Create a separate vendor account and receive a unique Vendor ID.</p>{message && <p className="vendor-alert" role="alert">{message}</p>}<div className="vendor-form-grid"><label>Business name<input name="businessName" value={form.businessName} onChange={update} /></label><label>Owner name<input name="ownerName" value={form.ownerName} onChange={update} /></label><label>Email<input name="email" type="email" value={form.email} onChange={update} /></label><label>Phone<input name="phone" value={form.phone} onChange={update} /></label><label className="vendor-form-full">Business address<input name="businessAddress" value={form.businessAddress} onChange={update} /></label><label>Password<input name="password" type="password" value={form.password} onChange={update} /></label><label>Confirm password<input name="confirmPassword" type="password" value={form.confirmPassword} onChange={update} /></label></div><button className="button button--full" type="submit" disabled={submitting}>{submitting ? "Creating account..." : "Create vendor account"}</button><p className="vendor-auth-footer">Already registered? <Link to="/vendor/login">Vendor login</Link></p><Link className="vendor-back-link" to="/"><ArrowLeft size={15} /> Back to shopping</Link></form></main>;
};

export default VendorRegister;
