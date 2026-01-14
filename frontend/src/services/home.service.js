import axios from "axios";

// Usar la variable de entorno si está, si no, fallback al backend local
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Obtener info del home (carrusel + destacados)
export const getHome = async () => {
  try {
    const response = await axios.get(`${API_URL}/home`);
    const ct = (response.headers && response.headers['content-type']) || '';
    if (!ct.includes('application/json')) {
      const raw = await axios.get(`${API_URL}/home`, { responseType: 'text' });
      console.warn('getHome: esperado JSON pero se recibió:', ct, '\nBody snippet:', raw.data.slice(0, 500));
      throw new Error('Respuesta inesperada no-JSON en /home');
    }
    return response.data;
  } catch (err) {
    console.error('getHome error:', err);
    throw err;
  }
};

// services/home.service.js
export const getHomeProducts = async () => {
  try {
    const response = await axios.get(`${API_URL}/home/products`);
    const ct = (response.headers && response.headers['content-type']) || '';
    if (!ct.includes('application/json')) {
      const raw = await axios.get(`${API_URL}/home/products`, { responseType: 'text' });
      console.warn('getHomeProducts: esperado JSON pero se recibió:', ct, '\nBody snippet:', raw.data.slice(0, 500));
      throw new Error('Respuesta inesperada no-JSON en /home/products');
    }
    return response.data;
  } catch (err) {
    console.error('getHomeProducts error:', err);
    throw err;
  }
};
