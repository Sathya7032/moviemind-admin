import api from "./api";

const buildFormData = (payload, imageFile) => {
  const formData = new FormData();
  formData.append("postType", payload.postType || "POST");
  formData.append("author", payload.author || "");
  formData.append("authorSubtitle", payload.authorSubtitle || "");
  formData.append("description", payload.description || "");
  
  if (imageFile) {
    formData.append("image", imageFile);
  }

  if (payload.postType === "POLL" && payload.options) {
    payload.options.forEach((opt, index) => {
      formData.append(`options[${index}].optionText`, opt.optionText);
    });
  }

  return formData;
};

export const createPost = async (payload, imageFile) => {
  const formData = buildFormData(payload, imageFile);
  const response = await api.post("/api/admin/posts", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getAllPosts = async () => {
  const response = await api.get("/api/posts");
  console.log("getAllPosts response:", response.data); // Debugging line
  return response.data;
};

export const getPostById = async (id) => {
  const response = await api.get(`/api/posts/${id}`);
  return response.data;
};

export const getPostComments = async (postId) => {
  const response = await api.get(`/api/posts/${postId}/comments`);
  return response.data;
};

export const updatePost = async (id, payload, imageFile) => {
  const formData = buildFormData(payload, imageFile);
  const response = await api.put(`/api/admin/posts/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const deletePost = async (id) => {
  const response = await api.delete(`/api/admin/posts/${id}`);
  return response.data;
};
