import api from "./api";

export const createEvent = async (payload) => {
  const response = await api.post("/api/admin/daily-challenges", payload);
  return response.data;
};

export const getAllEvents = async () => {
  const response = await api.get("/api/admin/daily-challenges");
  return response.data;
};

export const toggleEvent = async (eventId) => {
  const response = await api.patch(`/api/admin/daily-challenges/${eventId}/toggle`);
  return response.data;
};

export const distributePrizes = async (eventId) => {
  const response = await api.post(`/api/admin/daily-challenges/${eventId}/distribute-prizes`);
  return response.data;
};

export const updateEvent = async (eventId, payload) => {
  const response = await api.put(`/api/events/${eventId}`, payload);
  return response.data;
};

export const deleteEvent = async (eventId) => {
  const response = await api.delete(`/api/events/${eventId}`);
  return response.data;
};

export const getLeaderboard = async (eventId) => {
  const response = await api.get(`/api/daily-challenges/${eventId}/leaderboard`);
  return response.data;
};
