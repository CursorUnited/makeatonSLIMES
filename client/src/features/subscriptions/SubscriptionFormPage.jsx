import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Button,
  LinkButton,
  Select,
  DateInput,
  Textarea,
  FormField,
  ConfirmDialog,
  DiscardChangesDialog,
  useToast,
  Skeleton,
  StatusBadge,
  ExpiredQuoteBadge,
  ErrorBanner,
} from '../../components/ui';
import { formatDate, formatINR } from '../../lib/format';
import { api } from '../../api/client';
import { getSubscription, createSubscription, updateSubscription, previewSubscription, runSubscriptionAction, getSubscriptionEvents } from '../../api/subscriptions';
import { LinesEditor } from './LinesEditor';
import { HistoryPanel } from './HistoryPanel';
import { StatusBar } from './StatusBar';

const EMPTY_FORM = { customerId: '', planId: '', templateId: '', startDate: '', expiryDate: '', paymentTermId: '', notes: '', lines: [] };

const ACTION_META = {
  'send-quotation': { label: 'Send quotation', variant: 'secondary' },
  confirm: { label: 'Confirm', variant: 'primary' },
  activate: { label: 'Activate', variant: 'primary' },
  pause: { label: 'Pause', variant: 'secondary' },
  resume: { label: 'Resume', variant: 'primary' },
  renew: { label: 'Renew', variant: 'secondary' },
  close: { label: null, variant: 'destructive' },
};

const ACTION_SUCCESS = {
  'send-quotation': 'Quotation sent',
  confirm: 'Subscription confirmed',
  activate: 'Subscription activated',
  pause: 'Subscription paused',
  resume: 'Subscription resumed',
  close: 'Subscription updated',
  renew: 'Subscription renewed',
};

const NEEDS_CONFIRM_DIALOG = new Set(['close', 'renew']);

function closeLabel(status) {
  return status === 'DRAFT' || status === 'QUOTATION' ? 'Cancel' : 'Close';
}

export function SubscriptionFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionPending, setActionPending] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [discardTarget, setDiscardTarget] = useState(null);
  const initialized = useRef(false);

  const {
    data: sub,
    isLoading: subLoading,
    error: subError,
    refetch: refetchSub,
  } = useQuery({ queryKey: ['subscription', id], queryFn: () => getSubscription(id), enabled: !isNew });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['subscription-events', id],
    queryFn: () => getSubscriptionEvents(id),
    enabled: !isNew,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-lookup'],
    queryFn: () => api.get('/customers', { params: { pageSize: 100 } }).then((r) => r.data.data),
  });
  const { data: plans } = useQuery({
    queryKey: ['plans-lookup'],
    queryFn: () => api.get('/plans', { params: { pageSize: 100 } }).then((r) => r.data.data),
  });
  const { data: templates } = useQuery({
    queryKey: ['templates-lookup'],
    queryFn: () => api.get('/quotation-templates', { params: { pageSize: 100 } }).then((r) => r.data.data),
    enabled: isNew,
  });
  const { data: paymentTerms } = useQuery({
    queryKey: ['payment-terms-lookup'],
    queryFn: () => api.get('/payment-terms', { params: { pageSize: 100 } }).then((r) => r.data.data),
  });
  const { data: products } = useQuery({
    queryKey: ['products-lookup'],
    queryFn: () => api.get('/products', { params: { pageSize: 100 } }).then((r) => r.data.data),
  });

  useEffect(() => {
    if (!sub || initialized.current) return;
    setForm({
      customerId: sub.customer?.id ?? '',
      planId: sub.plan?.id ?? '',
      templateId: '',
      startDate: sub.startDate ?? '',
      expiryDate: sub.expiryDate ?? '',
      paymentTermId: sub.paymentTerm?.id ?? '',
      notes: sub.notes ?? '',
      lines: (sub.lines ?? []).map((l) => ({
        productId: l.product?.id ?? '',
        variantId: l.variant?.id ?? '',
        quantity: l.quantity,
        description: l.description ?? '',
      })),
    });
    initialized.current = true;
  }, [sub]);

  const editable = isNew || sub?.status === 'DRAFT' || sub?.status === 'QUOTATION';

  function set(patch) {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  }

  useEffect(() => {
    function handler(e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  function goToList() {
    if (dirty) setDiscardTarget('/subscriptions');
    else navigate('/subscriptions');
  }

  const selectedPlan = useMemo(() => (plans ?? []).find((p) => String(p.id) === String(form.planId)), [plans, form.planId]);
  const minQuantity = selectedPlan?.minQuantity ?? 1;

  const requestBody = useMemo(() => {
    const body = {};
    if (form.customerId) body.customerId = Number(form.customerId);
    if (isNew && form.templateId) body.templateId = Number(form.templateId);
    if (form.planId) body.planId = Number(form.planId);
    if (form.paymentTermId) body.paymentTermId = Number(form.paymentTermId);
    if (form.startDate) body.startDate = form.startDate;
    body.expiryDate = form.expiryDate || null;
    body.notes = form.notes;
    const includeLines = !isNew || form.lines.length > 0 || !form.templateId;
    if (includeLines) {
      body.lines = form.lines
        .filter((l) => l.productId)
        .map((l) => ({
          productId: Number(l.productId),
          variantId: l.variantId ? Number(l.variantId) : undefined,
          quantity: Number(l.quantity) || 0,
          description: l.description || undefined,
        }));
    }
    return body;
  }, [form, isNew]);

  const usingTemplateLines = isNew && Boolean(form.templateId) && form.lines.length === 0;

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const debounceRef = useRef(null);
  const previewKey = JSON.stringify(requestBody);

  useEffect(() => {
    if (!editable || !requestBody.customerId || !requestBody.startDate) {
      setPreview(null);
      return;
    }
    setPreviewLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      previewSubscription(requestBody)
        .then((data) => setPreview(data))
        .catch(() => setPreview(null))
        .finally(() => setPreviewLoading(false));
    }, 400);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey, editable]);

  const totals = editable ? preview?.totals : sub?.totals;
  const appliedDiscounts = editable ? preview?.appliedDiscounts : sub?.appliedDiscounts;
  const totalsLoading = editable && previewLoading;

  const linesMode = !editable ? 'readonly' : usingTemplateLines ? 'template' : 'editable';
  const displayLines = !editable ? sub?.lines : preview?.lines;

  const effectiveLineCount = !editable ? (sub?.lines?.length ?? 0) : usingTemplateLines ? (preview?.lines?.length ?? 0) : form.lines.filter((l) => l.productId).length;

  function handleCustomize() {
    const next = (preview?.lines ?? []).map((l) => ({
      productId: l.product?.id ?? '',
      variantId: l.variant?.id ?? '',
      quantity: l.quantity,
      description: l.description ?? '',
    }));
    set({ lines: next });
  }

  function validate() {
    const errs = {};
    if (!form.customerId) errs.customerId = 'Choose a customer.';
    if (!form.planId && !(isNew && form.templateId)) errs.planId = 'Choose a plan.';
    if (!form.startDate) errs.startDate = 'Choose a start date.';
    if (form.expiryDate && form.startDate && form.expiryDate <= form.startDate) {
      errs.expiryDate = 'Expiry date must be after the start date.';
    }
    if (selectedPlan) {
      form.lines.forEach((l, idx) => {
        if (l.productId && Number(l.quantity) < minQuantity) {
          errs[`lines.${idx}.quantity`] = `Quantity must be at least ${minQuantity} for the ${selectedPlan.name} plan.`;
        }
      });
    }
    return errs;
  }

  async function handleSave() {
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      if (isNew) {
        const created = await createSubscription(requestBody);
        toast('Subscription created');
        setDirty(false);
        navigate(`/subscriptions/${created.id}`, { replace: true });
      } else {
        const updated = await updateSubscription(id, requestBody);
        queryClient.setQueryData(['subscription', id], updated);
        setFieldErrors({});
        toast('Saved');
        setDirty(false);
      }
    } catch (err) {
      if (err.fields) setFieldErrors((f) => ({ ...f, ...err.fields }));
      if (!err.fields) toast(err.message, 'danger');
    } finally {
      setSaving(false);
    }
  }

  async function performAction(action, note) {
    setActionPending(action);
    try {
      const updated = await runSubscriptionAction(id, action, note);
      queryClient.setQueryData(['subscription', id], updated);
      queryClient.invalidateQueries({ queryKey: ['subscription-events', id] });
      toast(ACTION_SUCCESS[action] ?? 'Done');
      setConfirmAction(null);
    } catch (err) {
      if (err.fields) setFieldErrors((f) => ({ ...f, ...err.fields }));
      toast(err.message, 'danger');
      refetchSub();
    } finally {
      setActionPending(null);
    }
  }

  function onActionClick(action) {
    if (action === 'confirm' && effectiveLineCount === 0) {
      toast('Add at least one product line before confirming.', 'danger');
      return;
    }
    if (NEEDS_CONFIRM_DIALOG.has(action)) {
      setConfirmAction(action);
      return;
    }
    performAction(action);
  }

  const confirmConfig =
    confirmAction === 'close'
      ? {
          title: closeLabel(sub?.status) === 'Cancel' ? 'Cancel subscription?' : 'Close subscription?',
          message: 'This stops billing on this subscription and cannot be undone. You can add an optional reason below.',
          confirmLabel: closeLabel(sub?.status),
          destructive: true,
          withNote: true,
        }
      : confirmAction === 'renew'
        ? {
            title: 'Renew subscription?',
            message: 'This extends the expiry date by one original term and keeps billing going.',
            confirmLabel: 'Renew',
            destructive: false,
            withNote: false,
          }
        : {};

  if (!isNew && subLoading) {
    return (
      <div>
        <PageHeader title="Loading…" breadcrumb="Subscriptions" />
        <Card>
          <CardBody>
            <Skeleton className="mb-4 h-6 w-1/3" />
            <Skeleton className="h-40 w-full" />
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!isNew && subError) {
    return (
      <div>
        <PageHeader title="Subscription" breadcrumb="Subscriptions" />
        <ErrorBanner message="Couldn't load this subscription." onRetry={refetchSub} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={sub?.number ?? 'New subscription'}
        breadcrumb="Subscriptions"
        actions={
          <div className="flex items-center gap-3">
            {sub && <StatusBadge kind="subscription" status={sub.status} />}
            {sub?.isExpired && sub.status === 'QUOTATION' && <ExpiredQuoteBadge />}
            <LinkButton onClick={goToList}>Back to list</LinkButton>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-darkborder dark:bg-darksurface">
        <div className="flex flex-wrap items-center gap-2">
          {editable && (
            <Button variant="secondary" loading={saving} onClick={handleSave}>
              Save
            </Button>
          )}
          {(sub?.allowedActions ?? []).map((action) => {
            const meta = ACTION_META[action];
            if (!meta) return null;
            const label = action === 'close' ? closeLabel(sub.status) : meta.label;
            return (
              <Button key={action} variant={meta.variant} loading={actionPending === action} onClick={() => onActionClick(action)}>
                {label}
              </Button>
            );
          })}
          {sub?.status === 'CONFIRMED' && !sub.allowedActions?.includes('activate') && (
            <span className="text-sm text-gray-500 dark:text-gray-500">Starts on {formatDate(sub.startDate)}</span>
          )}
        </div>
        <StatusBar status={sub?.status ?? 'DRAFT'} />
      </div>

      <Card className="mb-6">
        <CardHeader title="Details" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Customer" error={fieldErrors.customerId} required>
            {(p) => (
              <Select
                {...p}
                value={form.customerId}
                onChange={(e) => set({ customerId: e.target.value })}
                disabled={!editable}
                placeholder="Choose a customer"
                options={(customers ?? []).map((c) => ({ value: c.id, label: c.name }))}
              />
            )}
          </FormField>
          <FormField label="Plan" error={fieldErrors.planId} required={!form.templateId}>
            {(p) => (
              <Select
                {...p}
                value={form.planId}
                onChange={(e) => set({ planId: e.target.value })}
                disabled={!editable}
                placeholder={isNew && form.templateId ? '(from template)' : 'Choose a plan'}
                options={(plans ?? []).map((pl) => ({ value: pl.id, label: pl.name }))}
              />
            )}
          </FormField>
          {isNew && (
            <FormField label="Template" optional>
              {(p) => (
                <Select
                  {...p}
                  value={form.templateId}
                  onChange={(e) => set({ templateId: e.target.value, lines: [] })}
                  placeholder="No template — build from scratch"
                  options={(templates ?? []).map((t) => ({ value: t.id, label: t.name }))}
                />
              )}
            </FormField>
          )}
          <FormField label="Payment terms" optional>
            {(p) => (
              <Select
                {...p}
                value={form.paymentTermId}
                onChange={(e) => set({ paymentTermId: e.target.value })}
                disabled={!editable}
                placeholder={isNew && form.templateId ? '(from template)' : 'Choose payment terms'}
                options={(paymentTerms ?? []).map((t) => ({ value: t.id, label: t.name }))}
              />
            )}
          </FormField>
          <FormField label="Start date" error={fieldErrors.startDate} required>
            {(p) => <DateInput {...p} value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} disabled={!editable} />}
          </FormField>
          <FormField label="Expiry date" error={fieldErrors.expiryDate} optional>
            {(p) => <DateInput {...p} value={form.expiryDate ?? ''} onChange={(e) => set({ expiryDate: e.target.value })} disabled={!editable} />}
          </FormField>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Quote valid until</p>
            <p className="mt-1.5 h-10 text-sm leading-10 text-gray-700 dark:text-gray-300">
              {sub?.quotationValidUntil ? formatDate(sub.quotationValidUntil) : '—  (set when a quotation is sent)'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Next invoice</p>
            <p className="mt-1.5 h-10 text-sm leading-10 text-gray-700 dark:text-gray-300">
              {sub?.nextInvoiceDate ? formatDate(sub.nextInvoiceDate) : '—  (set when the subscription becomes Active)'}
            </p>
          </div>
          <div className="sm:col-span-2">
            <FormField label="Notes" optional>
              {(p) => <Textarea {...p} value={form.notes} onChange={(e) => set({ notes: e.target.value })} disabled={!editable} />}
            </FormField>
          </div>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader title="Order lines" />
        <CardBody>
          <LinesEditor
            mode={linesMode}
            lines={form.lines}
            displayLines={displayLines}
            computedLines={preview?.lines}
            previewLoading={previewLoading}
            products={products ?? []}
            errors={fieldErrors}
            minQuantity={minQuantity}
            onChange={(lines) => set({ lines })}
            onCustomize={handleCustomize}
          />
          {!editable && !isNew && <p className="mt-3 text-sm text-gray-500 dark:text-gray-500">Confirmed subscriptions cannot be edited.</p>}

          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-sm rounded-md border border-gray-200 p-4 text-sm dark:border-darkborder">
              {totalsLoading ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : totals ? (
                <>
                  <div className="flex justify-between">
                    <span>Untaxed amount</span>
                    <span className="tabular-nums">{formatINR(totals.untaxed)}</span>
                  </div>
                  {appliedDiscounts?.map((d) => (
                    <div key={d.id} className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Discount ({d.name})</span>
                      <span className="tabular-nums">− {formatINR(d.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span className="tabular-nums">{formatINR(totals.tax)}</span>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-gray-200 pt-1 font-semibold dark:border-darkborder">
                    <span>Total</span>
                    <span className="tabular-nums">{formatINR(totals.total)}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">(preview, per billing period)</p>
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-500">Choose a customer and start date to preview totals.</p>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {!isNew && (
        <Card>
          <CardHeader title="History" />
          <CardBody>
            <HistoryPanel events={events} isLoading={eventsLoading} />
          </CardBody>
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={(note) => performAction(confirmAction, confirmAction === 'close' ? note : undefined)}
        loading={actionPending === confirmAction}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        destructive={confirmConfig.destructive}
        withNote={confirmConfig.withNote}
      />

      <DiscardChangesDialog
        open={Boolean(discardTarget)}
        onStay={() => setDiscardTarget(null)}
        onDiscard={() => {
          const target = discardTarget;
          setDiscardTarget(null);
          setDirty(false);
          navigate(target);
        }}
      />
    </div>
  );
}
