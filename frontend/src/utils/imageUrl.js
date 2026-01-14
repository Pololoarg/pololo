const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const BACKEND_BASE_URL = API_URL.replace("/api", "");

export function getImageUrl(image) {
  if (!image) return "";

  // Si es una URL completa (https...), se usa así
  if (image.startsWith("http")) return image;

  // Normalizar: asegurar que la ruta empiece con '/'
  const path = image.startsWith("/") ? image : `/${image}`;

  // Si es un archivo cargado (/uploads/...), lo pegamos al backend
  return `${BACKEND_BASE_URL}${path}`;
}
