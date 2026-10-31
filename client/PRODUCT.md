# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three roles on one app. **Admin**: owns the whole system — catalog, plans, taxes, discounts, staff, billing config. **Staff**: day-to-day operations — customers, subscriptions, invoices, payments, billing runs — with read-only catalog access. **Customer**: a small-business owner managing their own subscriptions and invoices through a self-serve portal, with no back-office vocabulary. Admin and Staff work in short, frequent sessions at a desk; Customers check in occasionally, often on mobile, to see what they owe or pause a plan.

## Product Purpose

Runs a subscription business's whole billing month in one place — products and plans, quotations, subscription lifecycle, automatic recurring invoicing with tax and discounts, payments, and a finance dashboard — replacing a spreadsheet-and-memory process where renewals get missed and invoices go out wrong.

## Positioning

The mechanism a spreadsheet can't offer: idempotent, auditable recurring billing — every subscription has a visible state machine (Draft → Quotation → Confirmed → Active → Closed/Paused) and a billing run that is provably safe to re-run (nothing is ever billed twice or skipped), with the full history of every transition kept against the record.

## Operating Context

Odoo-style back office: a sidebar of areas, a list view with server-side search/filter/pagination per area, and a form view per record with a status bar for anything with a lifecycle. Everything reads from a live local database — no static data. Built originally for a one-day hackathon (Odoo x FLUX), now being extended past that deadline with dark mode, portal/admin onboarding, and a dashboard.

## Capabilities and Constraints

Server computes and owns all money math (tax, discounts, totals) — the client only renders what the API returns, never computes or rounds currency itself. Every list is server-paginated (expect up to 10,000 subscriptions). Money in INR (`₹1,23,456.00`), dates `en-IN` short form. Role-based route guards block forbidden URLs outright (403), not just hide nav items. Customer-portal copy never uses internal terms ("billing run", "period start") — plain language only ("Next bill on 1 Dec").

## Brand Commitments

Primary color is pinned: `#714B67` (Odoo purple), used for primary actions, active nav, links, and the current step of any status bar. This is a binding brand constraint, not a default — it carries through any visual-system update, including dark mode and future style passes.

## Evidence on Hand

Full UX spec with text wireframes, exact color/spacing tokens, and copy rules exists at `docs/docs/design/UI_UX_SPEC.md` (outside this client folder, in the sibling docs/ directory) — treat it as authoritative product/UX truth already captured; this PRODUCT.md does not restate its screen-by-screen detail.

## Product Principles

1. One look, one component set — a new screen is assembled from `components/ui`, never styled from scratch.
2. The server is the only source of truth for money and state; the client reflects, never computes.
3. Status is always shown by icon + text, never color alone.
4. The portal speaks the customer's language; the back office speaks the operator's.
5. Every list and form has a real loading, empty, and error state — no screen ships with only the happy path.

## Accessibility & Inclusion

WCAG 2.1 AA: contrast ≥4.5:1 body / ≥3:1 large text, visible focus rings, full keyboard reachability, 44×44px touch targets under 768px, works at 200% zoom with no horizontal scroll.
