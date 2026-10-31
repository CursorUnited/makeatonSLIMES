import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { z } from 'zod';
import { Modal, Button, FormField, Select, MoneyInput, DateInput, Textarea, useToast } from '../../components/ui';
import { useApiForm } from '../../lib/useApiForm';
import { registerPayment, PAYMENT_METHODS } from '../../api/payments';

const paymentSchema = z.object({
  method: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'CHEQUE', 'OTHER']),
  amount: z.string().min(1, 'Enter an amount.'),
  paymentDate: z.string().min(1, 'Pick a date.'),
  note: z.string().max(500, 'Keep it under 500 characters.').optional(),
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function RegisterPaymentModal({ open, invoice, onClose, onRegistered }) {
  const toast = useToast();
  const {
    register,
    control,
    handleSubmit,
    reset,
    submitApi,
    formState: { errors, isSubmitting },
  } = useApiForm(paymentSchema, {
    defaultValues: { method: 'CASH', amount: '', paymentDate: todayISO(), note: '' },
  });

  useEffect(() => {
    if (open && invoice) {
      reset({ method: 'CASH', amount: invoice.amountDue ?? '', paymentDate: todayISO(), note: '' });
    }
  }, [open, invoice, reset]);

  const onSubmit = async (body) => {
    try {
      await submitApi(() => registerPayment({ invoiceId: invoice.id, ...body }));
      toast('Payment recorded');
      onRegistered();
    } catch (err) {
      if (!err.fields) toast(err.message, 'danger');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Register payment"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
            Register payment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <FormField label="Method" error={errors.method?.message} required>
          {(p) => <Select {...p} {...register('method')} options={PAYMENT_METHODS} />}
        </FormField>
        <FormField label="Amount" error={errors.amount?.message} required>
          {(p) => (
            <Controller
              control={control}
              name="amount"
              render={({ field }) => <MoneyInput {...p} value={field.value} onChange={field.onChange} />}
            />
          )}
        </FormField>
        <FormField label="Payment date" error={errors.paymentDate?.message} required>
          {(p) => <DateInput {...p} {...register('paymentDate')} />}
        </FormField>
        <FormField label="Note" error={errors.note?.message} optional>
          {(p) => <Textarea {...p} {...register('note')} />}
        </FormField>
      </form>
    </Modal>
  );
}
