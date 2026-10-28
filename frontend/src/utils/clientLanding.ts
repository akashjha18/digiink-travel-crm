export function getClientLanding(permissions: Record<string, { view?: boolean }> | undefined) {
  if (permissions?.dashboard?.view) return "/app/dashboard";
  if (permissions?.enquiries?.view) return "/app/enquiries";
  if (permissions?.bookings?.view) return "/app/bookings";
  if (permissions?.customers?.view) return "/app/customers";
  if (permissions?.reports?.view) return "/app/reports";
  return "/app/profile";
}
