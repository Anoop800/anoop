export const getAuthToken = () => localStorage.getItem("shopSphereToken") || sessionStorage.getItem("shopSphereToken");
export const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("shopSphereUser") || sessionStorage.getItem("shopSphereUser") || "null"); } catch { return null; }
};
export const clearAuth = () => {
  [localStorage, sessionStorage].forEach(storage => { storage.removeItem("shopSphereToken"); storage.removeItem("shopSphereUser"); storage.removeItem("authToken"); });
};
export const saveAuth = (token, user, remember) => {
  clearAuth();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("shopSphereToken", token);
  storage.setItem("shopSphereUser", JSON.stringify(user));
};
