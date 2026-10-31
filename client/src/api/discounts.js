import { api } from './client';

export function listDiscounts(params) {
  return api.get('/discounts', { params }).then((r) => r.data);
}

export function getDiscount(id) {
  return api.get(`/discounts/${id}`).then((r) => r.data.data);
}

export function createDiscount(body) {
  return api.post('/discounts', body).then((r) => r.data.data);
}

export function updateDiscount(id, body) {
  return api.patch(`/discounts/${id}`, body).then((r) => r.data.data);
}
