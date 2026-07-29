const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Client Error:', error);
    throw error;
  }
}

export const client = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' })
};

// API specific methods
export const api = {
  auth: {
    loginPin: (pin) => client.post('/auth/pin', { pin }),
  },
  utensilios: {
    getAll: () => client.get('/utensilios/'),
    get: (id) => client.get(`/utensilios/${id}`),
    create: (data) => client.post('/utensilios/', data),
    update: (id, data) => client.put(`/utensilios/${id}`, data),
    delete: (id) => client.delete(`/utensilios/${id}`),
  },
  packaging: {
    getAll: () => client.get('/packaging/'),
    get: (id) => client.get(`/packaging/${id}`),
    create: (data) => client.post('/packaging/', data),
    update: (id, data) => client.put(`/packaging/${id}`, data),
    delete: (id) => client.delete(`/packaging/${id}`),
  },
  insumos: {
    getAll: () => client.get('/insumos/'),
    get: (id) => client.get(`/insumos/${id}`),
    create: (data) => client.post('/insumos/', data),
    update: (id, data) => client.put(`/insumos/${id}`, data),
    delete: (id) => client.delete(`/insumos/${id}`),
  },
  productos: {
    getAll: () => client.get('/productos/'),
    get: (id) => client.get(`/productos/${id}`),
    create: (data) => client.post('/productos/', data),
    update: (id, data) => client.put(`/productos/${id}`, data),
    delete: (id) => client.delete(`/productos/${id}`),
  },
  fichas: {
    getAll: () => client.get('/fichas/'),
    get: (id) => client.get(`/fichas/${id}`),
    create: (data) => client.post('/fichas/', data),
    update: (id, data) => client.put(`/fichas/${id}`, data),
    delete: (id) => client.delete(`/fichas/${id}`),
  },
  stock: {
    getAll: () => client.get('/stock/'),
    movimientos: () => client.get('/stock/movimientos/'),
    ajustar: (data) => client.post('/stock/ajuste/', data),
  },
  compras: {
    getAll: () => client.get('/compras/'),
    create: (data) => client.post('/compras/', data),
  },
  ventas: {
    getAll: (params) => client.get(`/ventas/${params ? `?${new URLSearchParams(params)}` : ''}`),
    get: (id) => client.get(`/ventas/${id}`),
    create: (data) => client.post('/ventas/', data),
    anular: (id) => client.post(`/ventas/${id}/anular`),
  },
  clientes: {
    getAll: () => client.get('/clientes/'),
    getByTelefono: (telefono) => client.get(`/clientes/telefono/${telefono}`),
    create: (data) => client.post('/clientes/', data),
    update: (id, data) => client.put(`/clientes/${id}`, data),
    delete: (id) => client.delete(`/clientes/${id}`),
    getHistorial: (id) => client.get(`/clientes/${id}/historial`),
  },
  recompensas: {
    getAll: () => client.get('/recompensas/'),
    create: (data) => client.post('/recompensas/', data),
    update: (id, data) => client.put(`/recompensas/${id}`, data),
    delete: (id) => client.delete(`/recompensas/${id}`),
    redimir: (clienteId, recompensaId) => client.post(`/recompensas/redimir`, { cliente_id: clienteId, recompensa_id: recompensaId }),
  },
  dashboard: {
    getKPIs: () => client.get('/dashboard/kpis'),
    getSalesTimeline: (params) => client.get(`/dashboard/sales-timeline${params ? `?${new URLSearchParams(params)}` : ''}`),
    getProductMargins: () => client.get('/dashboard/product-margins'),
    getStockAlerts: () => client.get('/dashboard/stock-alerts'),
    getLoyaltySummary: () => client.get('/dashboard/loyalty-summary'),
    getCorfoReport: () => client.get('/dashboard/reporte-formalizacion'),
    getCorfoReportCompleto: () => client.get('/dashboard/reporte-formalizacion-completo'),
  }
};

export const formatCLP = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
};
