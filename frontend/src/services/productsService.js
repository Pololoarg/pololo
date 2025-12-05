// src/services/productsService.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function getProducts(category) {
  let url = `${API_URL}/products`;

  if (category) {
    url += `?category=${encodeURIComponent(category)}`;
  }

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error('Error al obtener productos');
  }

  return await res.json();
}

export async function getProductById(id) {
  const url = `${API_URL}/products/${id}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error('Error al obtener el producto');
  }

  return await res.json();
}

export async function deleteProduct(id) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error('Error al eliminar el producto');
  }

  return await res.json(); // { message: 'Producto eliminado correctamente' }
}

// 👇👇 CAMBIAN ESTAS DOS

export async function createProduct(productData) {
  const formData = new FormData();

  formData.append('name', productData.name);
  formData.append('category', productData.category);
  formData.append('description', productData.description || '');
  formData.append('price', productData.price);
  formData.append('stock', productData.stock ?? 0);
  formData.append('active', productData.active);

  // archivo de imagen (si lo hay)
  if (productData.imageFile) {
    formData.append('image', productData.imageFile);
  }

  const res = await fetch(`${API_URL}/products`, {
    method: 'POST',
    body: formData, // ⚠️ sin headers, el navegador pone Content-Type
  });

  if (!res.ok) {
    throw new Error('Error al crear el producto');
  }

  return await res.json();
}

export async function updateProduct(id, productData) {
  const formData = new FormData();

  formData.append('name', productData.name);
  formData.append('category', productData.category);
  formData.append('description', productData.description || '');
  formData.append('price', productData.price);
  formData.append('stock', productData.stock ?? 0);
  formData.append('active', productData.active);

  if (productData.imageFile) {
    formData.append('image', productData.imageFile);
  }

  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Error al actualizar el producto');
  }

  return await res.json();
}
