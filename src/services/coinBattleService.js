import api from "./api";

export const getAllBattlesForAdmin = async () => {
  const response = await api.get("/api/coin-battles/admin/all");
  return response.data;
};

export const getAdminBattleDetails = async (battleId) => {
  const response = await api.get(`/api/coin-battles/admin/${battleId}/details`);
  return response.data;
};

export const completeBattle = async (battleId) => {
  const response = await api.post(`/api/coin-battles/${battleId}/complete`);
  return response.data;
};
