import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import "./Login.css";
import { saveAuth } from "../../utils/auth";

// Configurable API base URL — set in .env as VITE_API_URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const INITIAL_FORM_STATE = {
  email: "",
  password: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // { type: "success" | "error", message: string }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    // Password
    if (!formData.password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);

    const isValid = validateForm();
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        // Response had no JSON body — fall through to status-based handling
      }

      if (response.ok) {
        const token = data?.token;
        if (token && data?.user) { saveAuth(token, data.user, rememberMe); window.dispatchEvent(new Event("authChanged")); }

        setSubmitStatus({
          type: "success",
          message: "Login successful! Redirecting...",
        });

        setTimeout(() => {
          navigate("/");
        }, 1000);
        return;
      }

      if (response.status === 401 || response.status === 400) {
        setSubmitStatus({
          type: "error",
          message: data?.message || "Invalid email or password.",
        });
      } else if (response.status === 404) {
        setSubmitStatus({
          type: "error",
          message: "No account found with this email.",
        });
      } else if (response.status >= 500) {
        setSubmitStatus({
          type: "error",
          message: "Something went wrong. Please try again.",
        });
      } else {
        setSubmitStatus({
          type: "error",
          message: data?.message || "Something went wrong. Please try again.",
        });
      }
    } catch {
      setSubmitStatus({
        type: "error",
        message: "Unable to connect to the server.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
        <div className="login-card">
          <div className="login-card__header">
            <Link to="/" className="login-card__logo">
              Shop<span className="login-card__logo-accent">Sphere</span>
            </Link>
            <h1 className="login-card__heading">Welcome Back</h1>
            <p className="login-card__subtext">
              Login to continue shopping with us.
            </p>
          </div>

          {submitStatus && (
            <div
              className={
                submitStatus.type === "success"
                  ? "login-alert login-alert--success"
                  : "login-alert login-alert--error"
              }
              role="alert"
            >
              {submitStatus.message}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div
                className={
                  errors.email
                    ? "form-input-wrapper form-input-wrapper--error"
                    : "form-input-wrapper"
                }
              >
                <Mail size={18} className="form-input-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && (
                <span id="email-error" className="form-error">
                  {errors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div
                className={
                  errors.password
                    ? "form-input-wrapper form-input-wrapper--error"
                    : "form-input-wrapper"
                }
              >
                <Lock size={18} className="form-input-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                />
                <button
                  type="button"
                  className="form-input-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span id="password-error" className="form-error">
                  {errors.password}
                </span>
              )}
            </div>

            {/* Remember me + Forgot password */}
            <div className="login-form__row">
              <div className="form-checkbox-group">
                <input
                  id="rememberMe"
                  type="checkbox"
                  className="form-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="rememberMe" className="form-checkbox-label">
                  Remember me
                </label>
              </div>

              <Link to="/forgot-password" className="login-inline-link">
                Forgot Password?
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="login-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Logging in..."
              ) : (
                <>
                  <LogIn size={18} />
                  Login
                </>
              )}
            </button>
          </form>

          <p className="login-register-text">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="login-inline-link">
              Create Account
            </Link>
          </p>
        </div>
    </main>
  );
};

export default Login;
