import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './app/AppLayout';
import { RequireRole, RedirectIfAuthed } from './app/RequireRole';
import { ForbiddenPage, NotFoundPage } from './app/StatusPages';
import { ROLES, BACK_OFFICE, landingPathFor } from './lib/roles';
import { useAuth } from './app/AuthProvider';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? landingPathFor(user.role) : '/login'} replace />;
}

import { SignupPage } from './features/auth/SignupPage';
import { LoginPage } from './features/auth/LoginPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';

import { DashboardPage } from './features/dashboard/DashboardPage';
import { OutboxListPage } from './features/outbox/OutboxListPage';
import { UsersPage } from './features/users/UsersPage';
import { ProductsListPage } from './features/products/ProductsListPage';
import { ProductFormPage } from './features/products/ProductFormPage';
import { PlansListPage } from './features/plans/PlansListPage';
import { PlanFormPage } from './features/plans/PlanFormPage';
import { TaxesPage } from './features/taxes/TaxesPage';
import { PaymentTermsPage } from './features/paymentTerms/PaymentTermsPage';
import { TemplatesListPage } from './features/templates/TemplatesListPage';
import { TemplateFormPage } from './features/templates/TemplateFormPage';
import { CustomersListPage } from './features/customers/CustomersListPage';
import { CustomerFormPage } from './features/customers/CustomerFormPage';
import { SubscriptionsListPage } from './features/subscriptions/SubscriptionsListPage';
import { SubscriptionFormPage } from './features/subscriptions/SubscriptionFormPage';
import { InvoicesListPage } from './features/invoices/InvoicesListPage';
import { InvoiceFormPage } from './features/invoices/InvoiceFormPage';
import { InvoicePrintPage } from './features/invoices/InvoicePrintPage';
import { BillingRunPage } from './features/billing/BillingRunPage';
import { PaymentsListPage } from './features/payments/PaymentsListPage';
import { DiscountsListPage } from './features/discounts/DiscountsListPage';
import { DiscountFormPage } from './features/discounts/DiscountFormPage';
import { PortalSubscriptionsPage } from './features/portal/PortalSubscriptionsPage';
import { PortalSubscriptionDetailPage } from './features/portal/PortalSubscriptionDetailPage';
import { PortalInvoicesPage } from './features/portal/PortalInvoicesPage';
import { PortalInvoicePrintPage } from './features/portal/PortalInvoicePrintPage';
import { PortalProfilePage } from './features/portal/PortalProfilePage';

const ADMIN = [ROLES.ADMIN];
const CUSTOMER = [ROLES.CUSTOMER];

export function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/signup" element={<RedirectIfAuthed><SignupPage /></RedirectIfAuthed>} />
      <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
      <Route path="/forgot-password" element={<RedirectIfAuthed><ForgotPasswordPage /></RedirectIfAuthed>} />
      <Route path="/reset-password" element={<RedirectIfAuthed><ResetPasswordPage /></RedirectIfAuthed>} />

      {/* Print views: no sidebar/top bar */}
      <Route element={<RequireRole roles={BACK_OFFICE} />}>
        <Route path="/invoices/:id/print" element={<InvoicePrintPage />} />
      </Route>
      <Route element={<RequireRole roles={CUSTOMER} />}>
        <Route path="/portal/invoices/:id/print" element={<PortalInvoicePrintPage />} />
      </Route>

      {/* Back office */}
      <Route element={<RequireRole roles={BACK_OFFICE} />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersListPage />} />
          <Route path="/customers/:id" element={<CustomerFormPage />} />
          <Route path="/subscriptions" element={<SubscriptionsListPage />} />
          <Route path="/subscriptions/new" element={<SubscriptionFormPage />} />
          <Route path="/subscriptions/:id" element={<SubscriptionFormPage />} />
          <Route path="/invoices" element={<InvoicesListPage />} />
          <Route path="/invoices/:id" element={<InvoiceFormPage />} />
          <Route path="/payments" element={<PaymentsListPage />} />
          <Route path="/billing" element={<BillingRunPage />} />
          <Route path="/products" element={<ProductsListPage />} />
          <Route path="/products/:id" element={<ProductFormPage />} />
          <Route path="/plans" element={<PlansListPage />} />
          <Route path="/plans/:id" element={<PlanFormPage />} />
          <Route path="/templates" element={<TemplatesListPage />} />
          <Route path="/templates/:id" element={<TemplateFormPage />} />
          <Route path="/discounts" element={<DiscountsListPage />} />
          <Route path="/discounts/:id" element={<DiscountFormPage />} />
          <Route path="/taxes" element={<TaxesPage />} />
          <Route path="/payment-terms" element={<PaymentTermsPage />} />

          {/* Admin only */}
          <Route element={<RequireRole roles={ADMIN} />}>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/outbox" element={<OutboxListPage />} />
          </Route>
        </Route>
      </Route>

      {/* Customer portal */}
      <Route element={<RequireRole roles={CUSTOMER} />}>
        <Route element={<AppLayout />}>
          <Route path="/portal/subscriptions" element={<PortalSubscriptionsPage />} />
          <Route path="/portal/subscriptions/:id" element={<PortalSubscriptionDetailPage />} />
          <Route path="/portal/invoices" element={<PortalInvoicesPage />} />
          <Route path="/portal/profile" element={<PortalProfilePage />} />
        </Route>
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
