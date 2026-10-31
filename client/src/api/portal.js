import { api } from './client';

export function listSubscriptions() {
  return api.get('/subscriptions', { params: { pageSize: 100 } }).then((r) => r.data.data);
}

export function getSubscription(id) {
  return api.get(`/subscriptions/${id}`).then((r) => r.data.data);
}

export function listInvoicesForSubscription(subscriptionId) {
  return api.get('/invoices', { params: { subscriptionId, pageSize: 5 } }).then((r) => r.data.data);
}

export function runSubscriptionAction(id, action, note) {
  return api.post(`/subscriptions/${id}/actions/${action}`, note ? { note } : {}).then((r) => r.data.data);
}

export function listInvoices(params) {
  return api.get('/invoices', { params }).then((r) => r.data);
}

export function getInvoice(id) {
  return api.get(`/invoices/${id}`).then((r) => r.data.data);
}

export function updateCustomer(customerId, body) {
  return api.patch(`/customers/${customerId}`, body).then((r) => r.data.data);
}
