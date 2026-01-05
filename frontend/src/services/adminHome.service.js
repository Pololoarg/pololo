import {apiClient} from "./apiClient"; // el axios instance que ya usás

// ===== CAROUSEL =====
export const getAdminCarousel = async () => {
  const { data } = await apiClient.get("/admin/home/carousel");
  return data;
};

export const createCarouselImage = (formData) =>
  apiClient.post("/admin/home/carousel", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const updateCarouselImage = async (id, payload) => {
  const { data } = await apiClient.put(`/admin/home/carousel/${id}`, payload);
  return data;
};

export const deleteCarouselImage = async (id) => {
  const { data } = await apiClient.delete(`/admin/home/carousel/${id}`);
  return data;
};

export const toggleCarouselImage = (id, activo) => {
  return apiClient.patch(
    `/admin/home/carousel/${id}/toggle`,
    { activo }   // 👈 ESTO ES CLAVE
  );
};

export const updateCarouselOrder = async (items) => {
  // Actualizar el orden de múltiples imágenes
  const promises = items.map((item) =>
    apiClient.put(`/admin/home/carousel/${item.id}`, { orden: item.orden })
  );
  await Promise.all(promises);
};

// ===== HOME PRODUCTS =====
export const getAdminHomeProducts = async () => {
  const { data } = await apiClient.get("/admin/home/products");
  return data;
};

export const createHomeProduct = async (payload) => {
  const { data } = await apiClient.post("/admin/home/products", payload);
  return data;
};

export const updateHomeProduct = async (id, payload) => {
  const { data } = await apiClient.put(`/admin/home/products/${id}`, payload);
  return data;
};

export const deleteHomeProduct = async (id) => {
  const { data } = await apiClient.delete(`/admin/home/products/${id}`);
  return data;
};

export const updateHomeProductOrder = async (items) => {
  // Actualizar el orden de múltiples productos
  const promises = items.map((item) =>
    apiClient.put(`/admin/home/products/${item.id}`, { orden: item.orden })
  );
  const responses = await Promise.all(promises);
  return responses.map(r => r.data);
};

