import api from "./api";

const buildFormData = (payload, imageFile) => {
  const formData = new FormData();
  formData.append("title", payload.title || "");
  formData.append("description", payload.description || "");
  if (imageFile) {
    formData.append("image", imageFile);
  }
  return formData;
};

export const createBanner = async (payload, imageFile) => {
  const formData = buildFormData(payload, imageFile);
  const response = await api.post("/api/banners", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getAllBanners = async () => {
  const response = await api.get("/api/banners");
  return response.data;
};

export const getBannerById = async (id) => {
  const response = await api.get(`/api/banners/${id}`);
  return response.data;
};

export const updateBanner = async (id, payload, imageFile) => {
  const formData = buildFormData(payload, imageFile);
  const response = await api.put(`/api/banners/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const deleteBanner = async (id) => {
  const response = await api.delete(`/api/banners/${id}`);
  return response.data;
};
