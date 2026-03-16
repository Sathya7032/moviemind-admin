import api from "./api";

export const createCategory = async (categoryDto) => {
  const response = await api.post("/api/categories", categoryDto);
  return response.data;
};

export const getAllCategories = async () => {
  const response = await api.get("/api/categories");
  return response.data;
};

export const getCategoryById = async (id) => {
  const response = await api.get(`/api/categories/${id}`);
  return response.data;
};

export const updateCategory = async (id, categoryDto) => {
  const response = await api.put(`/api/categories/${id}`, categoryDto);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(`/api/categories/${id}`);
  return response.data;
};
