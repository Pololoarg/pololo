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
  formData.append('description', productData.description || '');
  formData.append('price', productData.price);
  formData.append('active', productData.active);

  if (productData.imageFile) {
    formData.append('image', productData.imageFile);
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
  formData.append('description', productData.description || '');
  formData.append('price', productData.price);
  formData.append('active', productData.active);

  if (productData.imageFile) {
    formData.append('image', productData.imageFile);
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
