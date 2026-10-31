import { api } from './client';

export function listInvoices(params) {
  return api.get('/invoices', { params }).then((r) => r.data);
}

export function getInvoice(id) {
  return api.get(`/invoices/${id}`).then((r) => r.data.data);
}

/** Resolves to `{ data: invoice, warnings: [] }` — the server may flag things like an exhausted discount. */
export function confirmInvoice(id) {
  return api.post(`/invoices/${id}/actions/confirm`).then((r) => r.data);
}

export function cancelInvoice(id) {
  return api.post(`/invoices/${id}/actions/cancel`).then((r) => r.data.data);
}

export function sendInvoice(id) {
  return api.post(`/invoices/${id}/actions/send`).then((r) => r.data.data);
}

export function confirmInvoicesBulk(ids) {
  return api.post('/invoices/actions/confirm-bulk', { ids }).then((r) => r.data.data);
}
