import api from "./api";

/**
 * Fetch all homepage videos.
 */
export const getAllVideos = async () => {
  const response = await api.get("/api/admin/homepage-videos");
  return response.data;
};

/**
 * Fetch a homepage video by its ID.
 */
export const getVideoById = async (id) => {
  const response = await api.get(`/api/admin/homepage-videos/${id}`);
  return response.data;
};

/**
 * Create a new homepage video.
 */
export const createVideo = async (payload) => {
  const response = await api.post("/api/admin/homepage-videos", payload);
  return response.data;
};

/**
 * Update an existing homepage video.
 */
export const updateVideo = async (id, payload) => {
  const response = await api.put(`/api/admin/homepage-videos/${id}`, payload);
  return response.data;
};

/**
 * Delete a homepage video.
 */
export const deleteVideo = async (id) => {
  const response = await api.delete(`/api/admin/homepage-videos/${id}`);
  return response.data;
};
