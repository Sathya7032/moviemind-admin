import axios from "axios";

const API_BASE_URL = "https://javifybackend.bytebodh.in";
// const API_BASE_URL = "http://localhost:8088"; // For local development

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem("refreshToken")
    ) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken: localStorage.getItem("refreshToken"),
        });

        const { accessToken, refreshToken } = res.data.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
