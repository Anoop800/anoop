const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const requestFavorites = async (path, options = {}) => {
  const token = localStorage.getItem("shopSphereToken") || sessionStorage.getItem("shopSphereToken");
  if (!token) throw new Error("LOGIN_REQUIRED");
  const response = await fetch(`${API_URL}/api/favorites${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Unable to update favorites");
  if (typeof data.count === "number") window.dispatchEvent(new CustomEvent("favoritesChanged", { detail: data.count }));
  return data;
};

export const getFavorites = () => requestFavorites("");
export const addFavorite = (productId) => requestFavorites(`/${productId}`, { method: "POST" });
export const removeFavorite = (productId) => requestFavorites(`/${productId}`, { method: "DELETE" });