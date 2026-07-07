import api from "./api";

export const getAllUsers = async (page = 0, size = 10, sortOrder = "desc") => {
  const response = await api.get(`/api/users?page=${page}&size=${size}&sort=createdTime,${sortOrder}`);
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

export const getReferralLeaderboard = async (page = 0, size = 10) => {
  const response = await api.get(`/api/users/leaderboard?page=${page}&size=${size}`);
  return response.data;
};

export const getUserSummaryById = async (id) => {
  const response = await api.get(`/api/users/${id}/summary`);
  return response.data;
};

export const getReferredUsersByUserId = async (id) => {
  const response = await api.get(`/api/users/${id}/referred`);
  return response.data;
};

export const getRewardTransactionsByUserId = async (id) => {
  const response = await api.get(`/api/users/${id}/rewards`);
  return response.data;
};

