import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { getFavorites } from "../utils/favorites";
import { getAuthToken } from "../utils/auth";
import {
  Search,
  User,
  Heart,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import "./Navbar.css";

/**
 * Navbar
 *
 * Props (all optional — component works standalone and is easy to wire
 * up to real auth/cart/wishlist state from Redux, Context, or props):
 *
 * @param {Object|null} user          - Logged in user object, e.g. { name: "John Doe" }. null/undefined => show Login/Register.
 * @param {number} cartCount          - Number of items in the cart.
 * @param {number} wishlistCount      - Number of items in the wishlist.
 * @param {function} onSearch         - Callback fired with the search query when user submits search.
 * @param {function} onLogout         - Callback fired when user clicks "Logout" from the profile dropdown.
 */
const Navbar = ({
  user = null,
  cartCount = 0,
  wishlistCount = 0,
  onSearch,
  onLogout,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteCount, setFavoriteCount] = useState(wishlistCount);

  const profileRef = useRef(null);
  const navigate = useNavigate();

  const [liveCartCount, setLiveCartCount] = useState(() => JSON.parse(localStorage.getItem("shopSphereCart") || "[]").reduce((sum, item) => sum + Number(item.quantity || 1), 0));

  useEffect(() => {
    const updateCart = () => setLiveCartCount(JSON.parse(localStorage.getItem("shopSphereCart") || "[]").reduce((sum, item) => sum + Number(item.quantity || 1), 0));
    window.addEventListener("cartChanged", updateCart);
    window.addEventListener("storage", updateCart);
    return () => { window.removeEventListener("cartChanged", updateCart); window.removeEventListener("storage", updateCart); };
  }, []);

  useEffect(() => {
    setFavoriteCount(wishlistCount);
    if (!getAuthToken()) return undefined;
    getFavorites().then((items) => setFavoriteCount(items.length)).catch(() => {});
    const updateCount = (event) => setFavoriteCount(event.detail ?? 0);
    window.addEventListener("favoritesChanged", updateCount);
    return () => window.removeEventListener("favoritesChanged", updateCount);
  }, [wishlistCount]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Categories", path: "/categories" },
    { name: "Vendor Login", path: "/vendor/login" },
  ];

  // Close mobile menu whenever the viewport is resized to desktop width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close profile dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    if (onSearch) {
      onSearch(trimmedQuery);
    } else {
      // Fallback behaviour if no onSearch handler is passed by the parent
      navigate(`/categories?search=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  const handleLogoutClick = () => {
    setIsProfileOpen(false);
    if (onLogout) onLogout();
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="navbar">
      <div className="navbar__container">
        {/* Logo */}
        <Link
          to="/"
          className="navbar__logo"
          onClick={closeMobileMenu}
          aria-label="Go to homepage"
        >
          Shop<span className="navbar__logo-accent">Sphere</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="navbar__links" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === "/"}
              className={({ isActive }) =>
                isActive ? "navbar__link navbar__link--active" : "navbar__link"
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>

        {/* Search bar */}
        <form
          className="navbar__search"
          onSubmit={handleSearchSubmit}
          role="search"
        >
          <label htmlFor="navbar-search-input" className="sr-only">
            Search products
          </label>
          <input
            id="navbar-search-input"
            type="text"
            className="navbar__search-input"
            placeholder="Search for products, brands and more..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            className="navbar__search-btn"
            aria-label="Search"
          >
            <Search size={19} />
          </button>
        </form>

        {/* Right side actions */}
        <div className="navbar__actions">
          {/* Wishlist */}
          <Link
            to="/favorites"
            className="navbar__icon-btn"
            aria-label={`Favorites, ${favoriteCount} items`}
            title="Favorites"
          >
            <Heart size={22} />
            {favoriteCount > 0 && (
              <span className="navbar__badge">{favoriteCount}</span>
            )}
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            className="navbar__icon-btn"
            aria-label={`Shopping cart, ${cartCount} items`}
            title="Cart"
          >
            <ShoppingCart size={22} />
            {(liveCartCount || cartCount) > 0 && (
              <span className="navbar__badge">{liveCartCount || cartCount}</span>
            )}
          </Link>

          {/* Auth / Profile */}
          {user ? (
            <div className="navbar__profile" ref={profileRef}>
              <button
                type="button"
                className="navbar__profile-btn"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={isProfileOpen}
                aria-label="Account menu"
              >
                <User size={20} />
                <span className="navbar__profile-name">{user.name}</span>
                <ChevronDown
                  size={16}
                  className={
                    isProfileOpen
                      ? "navbar__chevron navbar__chevron--open"
                      : "navbar__chevron"
                  }
                />
              </button>

              {isProfileOpen && (
                <div className="navbar__dropdown" role="menu">
                  <Link
                    to="/orders"
                    className="navbar__dropdown-item"
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    My Orders
                  </Link>
                  <button
                    type="button"
                    className="navbar__dropdown-item navbar__dropdown-item--danger"
                    role="menuitem"
                    onClick={handleLogoutClick}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar__auth">
              <Link to="/login" className="navbar__auth-link">
                Login
              </Link>
              <span className="navbar__auth-divider" aria-hidden="true">
                |
              </span>
              <Link to="/register" className="navbar__auth-link">
                Register
              </Link>
            </div>
          )}

          {/* Hamburger toggle (mobile/tablet only) */}
          <button
            type="button"
            className="navbar__hamburger"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile search bar (shown under the main bar on small screens) */}
      <form
        className="navbar__search navbar__search--mobile"
        onSubmit={handleSearchSubmit}
        role="search"
      >
        <label htmlFor="navbar-search-input-mobile" className="sr-only">
          Search products
        </label>
        <input
          id="navbar-search-input-mobile"
          type="text"
          className="navbar__search-input"
          placeholder="Search for products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          type="submit"
          className="navbar__search-btn"
          aria-label="Search"
        >
          <Search size={19} />
        </button>
      </form>

      {/* Mobile nav links (slide-down menu) */}
      {isMobileMenuOpen && (
        <nav
          className="navbar__mobile-menu"
          aria-label="Mobile navigation"
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === "/"}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                isActive
                  ? "navbar__mobile-link navbar__mobile-link--active"
                  : "navbar__mobile-link"
              }
            >
              {link.name}
            </NavLink>
          ))}

          {!user && (
            <div className="navbar__mobile-auth">
              <Link
                to="/login"
                className="navbar__mobile-link"
                onClick={closeMobileMenu}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="navbar__mobile-link"
                onClick={closeMobileMenu}
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
};

export default Navbar;
