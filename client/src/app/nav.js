import {
  LayoutDashboard, Users, Repeat, FileText, Wallet, PlayCircle,
  Package, CalendarClock, FileSpreadsheet, Percent, Receipt,
  ScrollText, UserCog, Inbox, User,
} from 'lucide-react'
import { ROLES } from '../lib/roles'

const { ADMIN, STAFF, CUSTOMER } = ROLES

export const NAV_GROUPS = [
  { items: [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: [ADMIN, STAFF] }] },
  {
    title: 'Sales',
    roles: [ADMIN, STAFF],
    items: [
      { label: 'Customers', to: '/customers', icon: Users, roles: [ADMIN, STAFF] },
      { label: 'Subscriptions', to: '/subscriptions', icon: Repeat, roles: [ADMIN, STAFF] },
    ],
  },
  {
    title: 'Billing',
    roles: [ADMIN, STAFF],
    items: [
      { label: 'Invoices', to: '/invoices', icon: FileText, roles: [ADMIN, STAFF] },
      { label: 'Payments', to: '/payments', icon: Wallet, roles: [ADMIN, STAFF] },
      { label: 'Billing run', to: '/billing', icon: PlayCircle, roles: [ADMIN, STAFF] },
    ],
  },
  {
    title: 'Catalog',
    roles: [ADMIN, STAFF],
    items: [
      { label: 'Products', to: '/products', icon: Package, roles: [ADMIN, STAFF] },
      { label: 'Plans', to: '/plans', icon: CalendarClock, roles: [ADMIN, STAFF] },
      { label: 'Quotation templates', to: '/templates', icon: FileSpreadsheet, roles: [ADMIN, STAFF] },
      { label: 'Discounts', to: '/discounts', icon: Percent, roles: [ADMIN, STAFF] },
    ],
  },
  {
    title: 'Settings',
    roles: [ADMIN, STAFF],
    items: [
      { label: 'Taxes', to: '/taxes', icon: Receipt, roles: [ADMIN, STAFF] },
      { label: 'Payment terms', to: '/payment-terms', icon: ScrollText, roles: [ADMIN, STAFF] },
      { label: 'Users', to: '/users', icon: UserCog, roles: [ADMIN] },
      { label: 'Outbox', to: '/outbox', icon: Inbox, roles: [ADMIN] },
    ],
  },
  {
    title: 'My account',
    roles: [CUSTOMER],
    items: [
      { label: 'My subscriptions', to: '/portal/subscriptions', icon: Repeat, roles: [CUSTOMER] },
      { label: 'My invoices', to: '/portal/invoices', icon: FileText, roles: [CUSTOMER] },
      { label: 'My profile', to: '/portal/profile', icon: User, roles: [CUSTOMER] },
    ],
  },
]

export function navForRole(role) {
  return NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)) })).filter(
    (g) => g.items.length > 0,
  )
}
