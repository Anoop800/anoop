import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
} from "lucide-react";
import "./Register.css";

// Configurable API base URL — set in .env as VITE_API_URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const INITIAL_FORM_STATE = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

// Reasonable phone format: optional leading +, 7–15 digits total
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // { type: "success" | "error", message: string }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear the field-level error as soon as the user starts correcting it
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Full Name
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required.";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Please enter your full name.";
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    // Phone
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!PHONE_REGEX.test(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number.";
    }

    // Password
    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setAgreedToTerms(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);

    if (!agreedToTerms) {
      setSubmitStatus({
        type: "error",
        message: "Please accept the Terms and Conditions to continue.",
      });
      return;
    }

    const isValid = validateForm();
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        // Response had no JSON body — fall through to status-based handling
      }

      if (response.ok) {
        setSubmitStatus({
          type: "success",
          message: "Account created successfully! Redirecting to login...",
        });
        resetForm();

        setTimeout(() => {
          navigate("/login");
        }, 1500);
        return;
      }

      if (response.status === 409) {
        setSubmitStatus({
          type: "error",
          message: "An account with this email already exists.",
        });
      } else if (response.status === 400) {
        setSubmitStatus({
          type: "error",
          message: data?.message || "Please check the information you entered.",
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
    <>
      <main className="register-page">
        <div className="register-card">
          <div className="register-card__header">
            <Link to="/" className="register-card__logo">
              Shop<span className="register-card__logo-accent">Sphere</span>
            </Link>
            <h1 className="register-card__heading">Create Your Account</h1>
            <p className="register-card__subtext">
              Register to start shopping with us.
            </p>
          </div>

          {submitStatus && (
            <div
              className={
                submitStatus.type === "success"
                  ? "register-alert register-alert--success"
                  : "register-alert register-alert--error"
              }
              role="alert"
            >
              {submitStatus.message}
            </div>
          )}

          <form
            className="register-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <div
                className={
                  errors.name
                    ? "form-input-wrapper form-input-wrapper--error"
                    : "form-input-wrapper"
                }
              >
                <User size={18} className="form-input-icon" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
              </div>
              {errors.name && (
                <span id="name-error" className="form-error">
                  {errors.name}
                </span>
              )}
            </div>

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

            {/* Phone */}
            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Phone Number
              </label>
              <div
                className={
                  errors.phone
                    ? "form-input-wrapper form-input-wrapper--error"
                    : "form-input-wrapper"
                }
              >
                <Phone size={18} className="form-input-icon" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                />
              </div>
              {errors.phone && (
                <span id="phone-error" className="form-error">
                  {errors.phone}
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
                  placeholder="Create a password (min. 8 characters)"
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

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <div
                className={
                  errors.confirmPassword
                    ? "form-input-wrapper form-input-wrapper--error"
                    : "form-input-wrapper"
                }
              >
                <Lock size={18} className="form-input-icon" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={
                    errors.confirmPassword
                      ? "confirm-password-error"
                      : undefined
                  }
                />
                <button
                  type="button"
                  className="form-input-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <span id="confirm-password-error" className="form-error">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="form-checkbox-group">
              <input
                id="terms"
                type="checkbox"
                className="form-checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <label htmlFor="terms" className="form-checkbox-label">
                I agree to the{" "}
                <Link to="/terms" className="register-inline-link">
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="register-inline-link">
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="register-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Creating Account..."
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="register-login-text">
            Already have an account?{" "}
            <Link to="/login" className="register-inline-link">
              Login
            </Link>
          </p>
        </div>
      </main>
    </>
  );
};

export default Register;
