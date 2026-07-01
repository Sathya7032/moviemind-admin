import api from "./api";

export const getAllSpins = async (page = 0, size = 15) => {
  try {
    const response = await api.get("/api/admin/spins", {
      params: { page, size },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching spins:", error);
    throw error;
  }
};
