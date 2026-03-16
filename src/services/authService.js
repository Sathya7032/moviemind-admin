import api from "./api";

export const adminLogin = async (email, password) => {
  const response = await api.post("/auth/admin-login", { email, password });
  return response.data;
};

export const refreshToken = async (refreshToken) => {
  const response = await api.post("/auth/refresh-token", { refreshToken });
  return response.data;
};
