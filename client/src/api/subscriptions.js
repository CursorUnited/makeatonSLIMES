import { api } from './client';

export function listSubscriptions(params) {
  return api.get('/subscriptions', { params }).then((r) => r.data);
}

export function getSubscription(id) {
  return api.get(`/subscriptions/${id}`).then((r) => r.data.data);
}

export function createSubscription(body) {
  return api.post('/subscriptions', body).then((r) => r.data.data);
}

export function updateSubscription(id, body) {
  return api.patch(`/subscriptions/${id}`, body).then((r) => r.data.data);
}

export function previewSubscription(body) {
  return api.post('/subscriptions/preview', body).then((r) => r.data.data);
}

export function runSubscriptionAction(id, action, note) {
  return api.post(`/subscriptions/${id}/actions/${action}`, note !== undefined ? { note } : {}).then((r) => r.data.data);
}

export function getSubscriptionEvents(id) {
  return api.get(`/subscriptions/${id}/events`).then((r) => {
    const body = r.data;
    return Array.isArray(body) ? body : body.data;
  });
}
