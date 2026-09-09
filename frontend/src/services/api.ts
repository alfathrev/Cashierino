const API_BASE = 'http://localhost:5000/api';

function getHeaders(includeAuth = true) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (includeAuth) {
    const token = localStorage.getItem('cashierino_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function loginApi(credentials: { username: string; password: string }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify(credentials),
  });
  return res.json();
}

export async function fetchProductsApi(params?: {
  category?: string;
  search?: string;
  sort?: string;
}) {
  const url = new URL(`${API_BASE}/products`);
  if (params) {
    if (params.category && params.category !== 'All') url.searchParams.set('category', params.category);
    if (params.search) url.searchParams.set('search', params.search);
    if (params.sort) url.searchParams.set('sort', params.sort);
  }
  const res = await fetch(url.toString(), {
    headers: getHeaders(false),
  });
  return res.json();
}

export async function createProductApi(productData: {
  name: string;
  category: 'Makanan' | 'Minuman';
  price: number;
  image_url?: string;
  is_new?: boolean;
  is_popular?: boolean;
}) {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(productData),
  });
  return res.json();
}

export async function updateProductApi(
  id: number,
  productData: {
    name?: string;
    category?: 'Makanan' | 'Minuman';
    price?: number;
    image_url?: string;
    is_new?: boolean;
    is_popular?: boolean;
    is_available?: boolean;
  }
) {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify(productData),
  });
  return res.json();
}

export async function deleteProductApi(id: number) {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
    headers: getHeaders(true),
  });
  return res.json();
}

export async function createTransactionApi(payload: {
  items: Array<{ product_id: number; quantity: number }>;
  customer_name?: string;
  cash_paid: number;
  payment_method?: string;
}) {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchTransactionsApi(params?: {
  date?: string;
  search?: string;
  limit?: number;
}) {
  const url = new URL(`${API_BASE}/transactions`);
  if (params) {
    if (params.date) url.searchParams.set('date', params.date);
    if (params.search) url.searchParams.set('search', params.search);
    if (params.limit) url.searchParams.set('limit', String(params.limit));
  }
  const res = await fetch(url.toString(), {
    headers: getHeaders(true),
  });
  return res.json();
}

export async function fetchDashboardStatsApi() {
  const res = await fetch(`${API_BASE}/transactions/stats`, {
    headers: getHeaders(true),
  });
  return res.json();
}

export async function cleanupOldTransactionsApi() {
  const res = await fetch(`${API_BASE}/transactions/cleanup`, {
    method: 'POST',
    headers: getHeaders(true),
  });
  return res.json();
}

export function getExportTransactionsUrl() {
  return `${API_BASE}/transactions/export`;
}
