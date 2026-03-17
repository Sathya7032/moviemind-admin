import api from "./api";

export const getAllUsers = async () => {
  const response = await api.get("/api/users");
  return response.data;
};

export const getUserById = async (id) => {
  const response = await api.get(`/api/users/${id}`);
  return response.data;
};

export const deactivateUser = async (id) => {
  const response = await api.put(`/api/users/${id}/deactivate`);
  return response.data;
};

export const activateUser = async (id) => {
  const response = await api.put(`/api/users/${id}/activate`);
  return response.data;
};

export const getReferralLeaderboard = async () => {
  const response = await api.get("/api/users/leaderboard");
  return response.data;
};
