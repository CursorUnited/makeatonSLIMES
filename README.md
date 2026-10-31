# Brightloop Subscriptions

One system to run plans, subscriptions and recurring billing in one place. Built in 8 hours for the **Odoo x FLUX Lucknow Hackathon '26** (virtual round, problem statement *Subscription Management System*).

Brightloop Software sells everything on subscription. Until now it tracked subscriptions in a spreadsheet, typed invoices by hand, matched payments by scrolling bank statements and built revenue reports once a quarter. This app replaces all of that. It covers accounts and roles, a catalog with variants, recurring plans, quotation templates, and subscriptions with a visible lifecycle. On top of that sit automatic invoicing with taxes and discounts, payments, and a finance dashboard that stays fast with 10,000 subscriptions.

Everything runs locally: React, Express and a local PostgreSQL database. No cloud services. Emails land in an **Outbox** inside the app, so even the password-reset flow works with Wi-Fi off.

---

## What each role can do

| Role | Can |
| --- | --- |
| **Admin** | Everything: products and variants, plans, taxes, payment terms, quotation templates, discount rules, staff accounts, Outbox |
| **Staff** | Day-to-day work: customers, subscriptions and their lifecycle, billing runs, invoices (confirm, cancel, send, print), payments, dashboard. Read-only catalog |
| **Customer** | Portal: own subscriptions and invoices only; pause, resume, renew or close a subscription when the plan allows; print invoices |

Sign-up always creates a Customer. Only an Admin can create Staff.

## Highlights

- **Subscription lifecycle:** Draft → Quotation → Confirmed → Active → Closed, plus Paused. There is a status bar and a full history of who did what. The server returns the allowed actions, so the UI only shows valid buttons.
- **Billing run: nothing billed twice or skipped.**
  - One click, or the daily job at 00:05 IST, bills every due subscription. Each subscription is billed in its own database transaction with its row locked.
  - A unique key on `(subscription_id, period_start)` makes a duplicate invoice impossible, even if two runs overlap.
  - Missed periods are caught up in one run.
- **Taxes and discounts applied automatically.** GST per line, after discounts. Discount rules (fixed or percent, minimum quantity or purchase, dates, usage limit; scoped to products or subscriptions) appear on the next invoice by themselves. A rule stops when it expires or runs out; usage is counted when an invoice is confirmed.
- **Money is exact:** decimal maths only, rounded half-up per line, computed on the server.
- **Payments:** partial payments allowed, and you can never pay more than the amount due. Paid, outstanding and overdue are visible at any time.
- **Fast with 10,000 subscriptions:** every API call answers in under 300 ms (numbers below).

## Stack

| Part | Tech |
| --- | --- |
| Client | React 18, Vite, Tailwind CSS, React Query, react-hook-form + zod, Recharts |
| Server | Node.js 24, Express 5, Prisma 6, zod, JWT in an httpOnly cookie, node-cron |
| Database | PostgreSQL 18 (local) |
| Tests | Vitest + Supertest against a separate test database |

```
odooSLIMES/
├── server/   Express API, Prisma schema, migrations, seeds, tests
└── client/   React app (admin, staff, customer portal)
```

---

## Run it locally

### Prerequisites

- **Node.js 24+**
- **PostgreSQL 18** running on `localhost:5432`. On Windows it is usually at `C:\Program Files\PostgreSQL\18` and not on `PATH`; use the full path to `psql.exe`.

### 1. Database

```bash
psql -U postgres -c "CREATE DATABASE slimes;" -c "CREATE DATABASE slimes_test;"
# Windows: "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE slimes;" -c "CREATE DATABASE slimes_test;"
```

### 2. Server (port 4000)

```bash
cd server
cp .env.example .env        # then edit: your Postgres password in both DATABASE_URL lines, and a JWT_SECRET of 32+ characters
npm install
npm run db:deploy           # creates all tables, sequences and indexes
npm run db:seed             # demo accounts and catalog
npm run db:seed:bulk        # optional: 10,000 subscriptions with 12 months of history (~35 s)
npm run dev                 # http://localhost:4000/api/v1/health → {"status":"ok","db":"ok",...}
```

### 3. Client (port 5173)

```bash
cd client
npm install
npm run dev                 # http://localhost:5173 (Vite proxies /api to :4000)
```

### Demo accounts (local test values only)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@brightloop.test` | `Admin@1234` |
| Staff | `staff@brightloop.test` | `Staff@1234` |
| Customer | `customer@brightloop.test` | `Customer@1234` |

These exist only in your local database (created by `npm run db:seed` from `server/.env.example`).

### Reset the demo data

```bash
cd server
npm run db:reset && npm run db:seed && npm run db:seed:bulk
```

---

## Demo data

**Base seed** (`npm run db:seed`):
- **Taxes:** GST 5%, 12% and 18%.
- **Payment terms:** Immediate, Net 15, Net 30.
- **Products:** Brightloop CRM ₹999, with variants Brand: Odoo (+₹560) and Brand: Generic; Analytics Add-on; Priority Support.
- **Plans:** Monthly, Yearly (min 5 seats, not pausable), Weekly and Daily. Each plan's price is a base fee billed as its own line.
- **Quotation templates:** two. "Starter CRM (monthly)" is 10 × CRM (Odoo); it bills ₹17,145.40 a month with the "10% for 10+ seats" discount and GST.

**Bulk seed** (`npm run db:seed:bulk`) adds:
- 2,000 customers and 10,000 subscriptions across all statuses.
- 51,166 invoices and 44,602 payments over 12 months, of which 4,304 invoices are overdue.

It uses the same billing maths and period rules as the app, so a billing run right after it creates nothing new.

## How billing works

1. **Run billing** (Billing page, Admin or Staff) or the daily job (`BILLING_CRON`, default `5 0 * * *` in IST) runs the same steps:
   - activate confirmed subscriptions whose start date has come;
   - invoice every active subscription whose next invoice date has come (one invoice per due period);
   - close expired subscriptions on auto-close plans.
2. Invoices are created as **Draft**, with lines, taxes, discounts and totals filled in. Staff review and **Confirm** them, one at a time or with "Confirm selected". Confirming sets the due date from the payment term.
3. **Send** writes the email to the Outbox (and sends it over SMTP if `SMTP_URL` is set). **Print** opens an A4 page; use your browser's "Save as PDF".
4. **Register payment** records method, amount, date and note. The invoice becomes **Paid** when nothing is left to pay. Confirmed invoices past their due date show as **Overdue**.

Billing is in advance with full periods, and there is no proration. Month-end starts clamp to the last day of the month without drifting: 31 Jan → 28 Feb → 31 Mar.

## Performance (10,000 subscriptions)

Measured on a laptop with `npm run perf` (20 calls per endpoint, as Admin) after the bulk seed:

| Endpoint | Server p95 | Round trip p95 |
| --- | --- | --- |
| Subscriptions list (page 1 / status filter / search) | 50 / 8 / 16 ms | 55 / 19 / 30 ms |
| Invoices list (page 1 / overdue / confirmed by total) | 10 / 8 / 13 ms | 25 / 23 / 20 ms |
| Payments list | 9 ms | 24 ms |
| Dashboard summary (this month / 12 months) | 51 / 150 ms | 67 / 163 ms |
| Revenue by month (12 months) | 272 ms | 284 ms |
| Overdue invoices | 6 ms | 17 ms |
| Billing run with nothing due (10k subscriptions) | 10 ms | — |

Every response carries an `X-Response-Time` header, so you can check any page in DevTools. The speed comes from three things:
- server-side pagination on every list;
- indexes on status, due date, next invoice date, customer and plan;
- report numbers computed in SQL.

## Tests

```bash
cd server
npm run db:test:prepare     # applies migrations to slimes_test
npm test                    # 124 tests
```

The tests cover:
- the password rule;
- roles and row-level access;
- every subscription transition and guard;
- billing: period maths, catch-up, running twice, two runs at once, auto-close;
- tax and discount maths against hand-worked examples;
- discount usage limits, payments and over-payment, reports.

The test helper refuses to wipe any database except `slimes_test`.

## API

REST under `/api/v1`, JSON in and out, money as strings with 2 decimals (`"1559.00"`), dates as `YYYY-MM-DD`.

- **Lists** take `page`, `pageSize` (max 100), `sort` (`-field` for descending), `q` and filters. They return `{ data, page, pageSize, total }`.
- **Errors** always look like `{ "error": { "code", "message", "fields"?, "requestId" } }`. `fields` maps each form field to its message.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/signup` · `/auth/login` · `/auth/logout` · `/auth/forgot-password` · `/auth/reset-password` · `GET /auth/me` |
| Users (Admin) | `GET/POST /users` · `PATCH /users/:id` |
| Customers | `GET/POST /customers` · `GET/PATCH /customers/:id` |
| Catalog | `/products` (+ `/products/:id/variants`, `/variants/:id`) · `/plans` · `/taxes` · `/payment-terms` · `/quotation-templates` |
| Subscriptions | `GET/POST /subscriptions` · `POST /subscriptions/preview` · `GET/PATCH /subscriptions/:id` · `POST /subscriptions/:id/actions/{send-quotation, confirm, activate, pause, resume, close, renew}` · `GET /subscriptions/:id/events` · `POST /subscriptions/:id/invoice` |
| Billing | `POST /billing/run` · `GET /billing/runs` |
| Invoices | `GET /invoices` · `GET /invoices/:id` · `POST /invoices/:id/actions/{confirm, cancel, send}` · `POST /invoices/actions/confirm-bulk` |
| Discounts | `GET/POST /discounts` · `GET/PATCH /discounts/:id` |
| Payments | `GET/POST /payments` |
| Reports | `GET /reports/summary` · `/reports/revenue-by-month` · `/reports/overdue-invoices` |
| Outbox (Admin) | `GET /outbox` · `GET /outbox/:id` |
| Health | `GET /health` |

## Configuration (`server/.env`)

| Key | Default | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | — | Local PostgreSQL database |
| `DATABASE_URL_TEST` | — | Test database (`npm test` only) |
| `JWT_SECRET` | — | 32+ random characters; signs the session cookie |
| `PORT` | `4000` | API port |
| `TZ` | `Asia/Kolkata` | "Today" for billing and overdue |
| `APP_URL` | `http://localhost:5173` | Base for links in emails |
| `SMTP_URL` | empty | Optional real SMTP (needs `npm i nodemailer`); empty = Outbox only |
| `BILLING_AUTO_CONFIRM` | `false` | Confirm invoices as soon as the run creates them |
| `BILLING_CRON` | `5 0 * * *` | Daily billing job schedule |
| `RESET_TOKEN_TTL_MIN` | `30` | Password reset link lifetime |
| `COMPANY_*` | Brightloop Software | Name, address, email, GSTIN on invoices |

## Out of scope (on purpose)

- Online payment gateways, refunds and credit notes.
- Multi-currency (INR only).
- Proration and mid-period plan changes.
- Scheduled reminder emails: overdue invoices are listed, and staff send them by hand.
- Multi-attribute variant combinations.

## Rules we chose where the brief was open

- **Password:** "More than eight characters" means at least 9, plus one uppercase, one lowercase and one special character.
- **Renew** extends the expiry date by one original term.
- **Paused periods** are never billed later.
- **Overdue** is derived, not stored: a confirmed invoice past its due date with money still owed.
- **Discounts don't stack within a scope:** at most one product discount per line and one subscription discount per invoice.
