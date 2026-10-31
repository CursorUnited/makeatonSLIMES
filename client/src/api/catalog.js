import { api } from './client';

export const productsApi = {
  list: (params) => api.get('/products', { params }).then((r) => r.data),
  get: (id) => api.get(`/products/${id}`).then((r) => r.data.data),
  create: (body) => api.post('/products', body).then((r) => r.data.data),
  update: (id, body) => api.patch(`/products/${id}`, body).then((r) => r.data.data),
  addVariant: (productId, body) => api.post(`/products/${productId}/variants`, body).then((r) => r.data.data),
  updateVariant: (variantId, body) => api.patch(`/variants/${variantId}`, body).then((r) => r.data.data),
};

export const plansApi = {
  list: (params) => api.get('/plans', { params }).then((r) => r.data),
  get: (id) => api.get(`/plans/${id}`).then((r) => r.data.data),
  create: (body) => api.post('/plans', body).then((r) => r.data.data),
  update: (id, body) => api.patch(`/plans/${id}`, body).then((r) => r.data.data),
};

export const taxesApi = {
  list: (params) => api.get('/taxes', { params }).then((r) => r.data),
  create: (body) => api.post('/taxes', body).then((r) => r.data.data),
  update: (id, body) => api.patch(`/taxes/${id}`, body).then((r) => r.data.data),
};

export const paymentTermsApi = {
  list: (params) => api.get('/payment-terms', { params }).then((r) => r.data),
  create: (body) => api.post('/payment-terms', body).then((r) => r.data.data),
};

export const templatesApi = {
  list: (params) => api.get('/quotation-templates', { params }).then((r) => r.data),
  get: (id) => api.get(`/quotation-templates/${id}`).then((r) => r.data.data),
  create: (body) => api.post('/quotation-templates', body).then((r) => r.data.data),
  update: (id, body) => api.patch(`/quotation-templates/${id}`, body).then((r) => r.data.data),
};
