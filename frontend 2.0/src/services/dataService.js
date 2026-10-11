import api from "./api";

export const uploadHealthData = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/api/data/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};