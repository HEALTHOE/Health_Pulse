import api from "./api";

export const login = async (email, password) => {
  const response = await api.post("/api/auth/login", {
    email,
    password,
  });

  localStorage.setItem("access_token", response.data.access_token);

  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/api/auth/me");
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("access_token");
};

export const isAuthenticated = () => {
  return Boolean(localStorage.getItem("access_token"));
};