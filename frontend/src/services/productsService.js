const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/* ===========================
   Helper: headers con JWT
=========================== */
function authHeaders() {
  const token = localStorage.getItem("authToken");

  return {
    Authorization: `Bearer ${token}`,
  };
}

/* ===========================
   CATÁLOGO (PÚBLICO)
=========================== */
export async function getProducts(filters = {}) {
  const params = new URLSearchParams();

  if (filters.category) params.append("category", filters.category);
  if (filters.size) params.append("size", filters.size);
  if (filters.search) params.append("search", filters.search);

  const url =
    params.toString().length > 0
      ? `${API_URL}/products?${params.toString()}`
      : `${API_URL}/products`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Error al obtener productos");
  }

  return await res.json();
}


export async function searchProducts(query) {
  const res = await fetch(
    `${API_URL}/products/search?q=${encodeURIComponent(query)}`
  );

  if (!res.ok) {
    throw new Error("Error al buscar productos");
  }

  return await res.json();
}

/* ===========================
   ADMIN (TODOS LOS PRODUCTOS)
=========================== */
export async function getAllProductsAdmin() {
  const url = `${API_URL}/products?includeInactive=true`;

  const res = await fetch(url, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error('Error al obtener productos (admin)');
  }

  return await res.json();
}

export async function searchProductsAdmin(query) {
  const url = `${API_URL}/products/search?q=${encodeURIComponent(query)}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Error buscando productos");
  }

  return await res.json();
}

/* ===========================
   PRODUCTO POR ID
=========================== */
export async function getProductById(id) {
  const url = `${API_URL}/products/${id}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error('Error al obtener el producto');
  }

  return await res.json();
}

/* ===========================
   ELIMINAR PRODUCTO (ADMIN)
=========================== */
export async function deleteProduct(id) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error('Error al eliminar el producto');
  }

  return await res.json();
}

/* ===========================
   CREAR PRODUCTO (ADMIN)
=========================== */
export async function createProduct(productData) {
  const formData = new FormData();

  formData.append('name', productData.name);
  formData.append('category', productData.category);
  formData.append('subcategory', productData.subcategory || '');
  formData.append('description', productData.description || '');
  formData.append('price', productData.price);
  formData.append('active', productData.active);

  if (productData.imageFiles && productData.imageFiles.length > 0) {
    productData.imageFiles.forEach((file) => {
      formData.append('images', file);
    });
    formData.append('mainImageIndex', productData.mainImageIndex ?? 0);
  } else if (productData.imageFile) {
    // compatibilidad con el campo anterior
    formData.append('images', productData.imageFile);
    formData.append('mainImageIndex', 0);
  }

  // Agregar talles si existen
  if (productData.sizes && productData.sizes.length > 0) {
    formData.append('sizes', JSON.stringify(productData.sizes));
  }

  const res = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Error al crear el producto');
  }

  return await res.json();
}

/* ===========================
   ACTUALIZAR PRODUCTO (ADMIN)
=========================== */
export async function updateProduct(id, productData) {
  const formData = new FormData();

  formData.append('name', productData.name);
  formData.append('category', productData.category);
  formData.append('subcategory', productData.subcategory || '');
  formData.append('description', productData.description || '');
  formData.append('price', productData.price);
  formData.append('active', productData.active);

  if (productData.imageFiles && productData.imageFiles.length > 0) {
    productData.imageFiles.forEach((file) => {
      formData.append('images', file);
    });
  } else if (productData.imageFile) {
    // compatibilidad con el campo anterior
    formData.append('images', productData.imageFile);
  }

  if (productData.mainImageId) {
    formData.append('mainImageId', productData.mainImageId);
  }

  if (productData.mainImageIndex !== undefined && productData.mainImageIndex !== null) {
    formData.append('mainImageIndex', productData.mainImageIndex);
  }

  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Error al actualizar el producto');
  }

  const result = await res.json();

  // Actualizar talles si existen
  if (productData.sizes && productData.sizes.length > 0) {
    const sizesRes = await fetch(`${API_URL}/products/${id}/sizes`, {
      method: 'PUT',
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sizes: productData.sizes }),
    });

    if (!sizesRes.ok) {
      throw new Error('Error al actualizar talles del producto');
    }
  }

  return result;
}

/* ===========================
   ELIMINAR IMAGEN DE PRODUCTO (ADMIN)
=========================== */
export async function deleteProductImage(productId, imageId) {
  const res = await fetch(`${API_URL}/products/${productId}/images/${imageId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error('Error al eliminar la imagen');
  }

  return await res.json();
}
