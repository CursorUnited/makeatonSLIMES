export const ROLES = { ADMIN: 'ADMIN', STAFF: 'STAFF', CUSTOMER: 'CUSTOMER' }
export const BACK_OFFICE = [ROLES.ADMIN, ROLES.STAFF]

export function landingPathFor(role) {
  return role === ROLES.CUSTOMER ? '/portal/subscriptions' : '/dashboard'
}
