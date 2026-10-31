import { api } from './client';

export const customersApi = {
  list: (params) => api.get('/customers', { params }).then((r) => r.data),
  get: (id) => api.get(`/customers/${id}`).then((r) => r.data.data),
  create: (body) => api.post('/customers', body).then((r) => r.data.data),
  update: (id, body) => api.patch(`/customers/${id}`, body).then((r) => r.data.data),
};
