import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Obtener info del home (carrusel + destacados)
export const getHome = async () => {
  const response = await axios.get(`${API_URL}/home`);
  return response.data;
};

// services/home.service.js
export const getHomeProducts = async () => {
  const response = await axios.get(`${API_URL}/home/products`);
  return response.data;
};
