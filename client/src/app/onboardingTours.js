const backOfficeShared = [
  { target: '[data-tour="brand"]', title: 'Welcome to Brightloop', body: 'This sidebar is how you get around. Every area the server lets your role touch shows up here.' },
  { target: '[data-tour="nav-/dashboard"]', title: 'Dashboard', body: 'Active subscriptions, revenue, and overdue invoices at a glance. Everything here is live from the database.' },
  { target: '[data-tour="nav-/subscriptions"]', title: 'Subscriptions', body: 'Every subscription moves through Draft → Quotation → Confirmed → Active → Closed. The status bar always shows where it stands.' },
  { target: '[data-tour="nav-/billing"]', title: 'Billing run', body: "One click creates invoices for every subscription that's due. Running it again never double-bills." },
  { target: '[data-tour="theme-toggle"]', title: 'Light or dark', body: 'Switch themes any time — it remembers your choice.' },
  { target: '[data-tour="user-menu"]', title: "You're set", body: 'Replay this tour any time from the help menu here. Go explore.' },
];

export const TOURS = {
  ADMIN: [
    ...backOfficeShared.slice(0, 4),
    { target: '[data-tour="nav-/users"]', title: 'Staff', body: 'Only Admins can add staff members — that’s you.' },
    ...backOfficeShared.slice(4),
  ],
  STAFF: backOfficeShared,
  CUSTOMER: [
    { target: '[data-tour="brand"]', title: 'Welcome to Brightloop', body: 'This is your self-serve portal — manage your subscriptions and invoices without emailing anyone.' },
    { target: '[data-tour="nav-/portal/subscriptions"]', title: 'My subscriptions', body: 'See what you’re subscribed to, when you’ll next be billed, and pause or renew if your plan allows it.' },
    { target: '[data-tour="nav-/portal/invoices"]', title: 'My invoices', body: 'Every invoice we’ve sent you, with a one-click download.' },
    { target: '[data-tour="theme-toggle"]', title: 'Light or dark', body: 'Switch themes any time — it remembers your choice.' },
    { target: '[data-tour="user-menu"]', title: "You're set", body: 'Replay this tour any time from the help menu here.' },
  ],
};
