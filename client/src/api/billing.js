import { api } from './client';

export function runBillingRun(asOf) {
  return api.post('/billing/run', asOf ? { asOf } : {}).then((r) => r.data.data);
}

export function listBillingRuns() {
  return api.get('/billing/runs').then((r) => r.data.data ?? r.data);
}
