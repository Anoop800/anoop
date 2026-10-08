import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Store, Eye, EyeOff } from "lucide-react";
import "./Vendor.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const VendorLogin = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.email.trim() || !form.password) {
      return setMessage("Email and password are required.");
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/vendors/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        return setMessage(data.message || "Unable to sign in.");
      }

      localStorage.setItem("vendorToken", data.token);
      localStorage.setItem("vendorUser", JSON.stringify(data.vendor));

      navigate("/vendor/dashboard");
    } catch {
      setMessage("Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="vendor-auth-page">
      <form className="vendor-auth-card" onSubmit={submit}>
        <Store size={30} className="vendor-icon" />

        <p className="eyebrow">ShopSphere partners</p>

        <h1>Vendor login</h1>

        <p className="muted">
          Manage your products and storefront.
        </p>

        {message && (
          <p className="vendor-alert" role="alert">
            {message}
          </p>
        )}

        <label>
          Email

          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm({
                ...form,
                email: event.target.value,
              })
            }
            placeholder="business@example.com"
          />
        </label>

        <label>
          Password

          <div className="vendor-input-icon">
            <Lock size={16} />

            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(event) =>
                setForm({
                  ...form,
                  password: event.target.value,
                })
              }
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </label>

        <button
          className="button button--full"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Signing in..." : "Sign in as vendor"}
        </button>

        <p className="vendor-auth-footer">
          New partner?{" "}
          <Link to="/vendor/register">
            Register your business
          </Link>
        </p>

        <Link className="vendor-back-link" to="/">
          Back to shopping
        </Link>
      </form>
    </main>
  );
};

export default VendorLogin;