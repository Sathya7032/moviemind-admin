import api from "./api";

export const getAnalytics = async () => {
  const response = await api.get("/api/analytics");
  return response.data;
};
