import api from "./api";

export const getAllRewards = async () => {
  const response = await api.get("/api/rewards");
  return response.data;
};

export const getRewardById = async (id) => {
  const response = await api.get(`/api/rewards/${id}`);
  return response.data;
};

export const createReward = async (data) => {
  const response = await api.post("/api/rewards", data);
  return response.data;
};

export const updateReward = async (id, data) => {
  const response = await api.put(`/api/rewards/${id}`, data);
  return response.data;
};

export const deleteReward = async (id) => {
  const response = await api.delete(`/api/rewards/${id}`);
  return response.data;
};

export const redeemReward = async (id) => {
  const response = await api.put(`/api/rewards/redeem/${id}`);
  return response.data;
};
