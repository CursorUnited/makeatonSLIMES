import { api } from './client';

export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'CARD', label: 'Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'OTHER', label: 'Other' },
];

export function listPayments(params) {
  return api.get('/payments', { params }).then((r) => r.data);
}

export function registerPayment(body) {
  return api.post('/payments', body).then((r) => r.data.data);
}
