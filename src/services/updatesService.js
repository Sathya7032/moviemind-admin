import api from "./api";

export const getAllUpdates = async () => {
  const response = await api.get("/api/updates");
  return response.data;
};

export const getUpdateById = async (id) => {
  const response = await api.get(`/api/updates/${id}`);
  return response.data;
};

export const createUpdate = async (updateData) => {
  const response = await api.post("/api/updates", updateData);
  return response.data;
};

export const updateUpdate = async (id, updateData) => {
  const response = await api.put(`/api/updates/${id}`, updateData);
  return response.data;
};

export const deleteUpdate = async (id) => {
  const response = await api.delete(`/api/updates/${id}`);
  return response.data;
};
