import api from "./api";

export const getFullLeaderboard = async () => {
  const response = await api.get("/api/leaderboard/all");
  return response.data;
};
