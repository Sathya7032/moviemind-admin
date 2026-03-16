import api from "./api";

const buildFormData = (payload, imageFile) => {
  const formData = new FormData();

  Object.keys(payload).forEach((key) => {
    if (key === "options") {
      payload.options.forEach((opt, i) => {
        formData.append(`options[${i}].optionText`, opt.optionText || "");
        formData.append(`options[${i}].correct`, String(opt.correct ?? false));
      });
    } else {
      formData.append(key, payload[key] ?? "");
    }
  });

  if (imageFile) {
    formData.append("image", imageFile);
  }

  return formData;
};

export const addQuestion = async (payload, imageFile) => {
  const formData = buildFormData(payload, imageFile);
  const response = await api.post("/api/questions", formData);
  return response.data;
};

export const getAllQuestions = async () => {
  const response = await api.get("/api/questions");
  return response.data;
};

export const getQuestionById = async (id) => {
  const response = await api.get(`/api/questions/${id}`);
  return response.data;
};

export const updateQuestion = async (id, payload, imageFile) => {
  const formData = buildFormData(payload, imageFile);
  const response = await api.put(`/api/questions/${id}`, formData);
  return response.data;
};

export const deleteQuestion = async (id) => {
  const response = await api.delete(`/api/questions/${id}`);
  return response.data;
};
