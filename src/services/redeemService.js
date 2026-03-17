import api from "./api";

export const getAllRedeems = async () => {
  const response = await api.get("/api/admin/redeems");
  return response.data;
};

export const markProcessing = async (redeemId) => {
  const response = await api.put(`/api/admin/redeems/${redeemId}/processing`);
  return response.data;
};

export const approveRedeem = async (redeemId) => {
  const response = await api.put(`/api/admin/redeems/${redeemId}/approve`);
  return response.data;
};

export const rejectRedeem = async (redeemId) => {
  const response = await api.put(`/api/admin/redeems/${redeemId}/reject`);
  return response.data;
};
