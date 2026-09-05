import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types/auth";

/**
 * Route guard mirroring the backend guard chain on the frontend: this is
 * UX only (hiding routes a user shouldn't see) — the backend's
 * authenticate/resolveTenant/entitlement/RBAC chain is what actually
 * enforces access, per SRS section 42. A user who manually edits the URL
 * still gets rejected server-side even if they briefly see this route.
 */
export function ProtectedRoute({ allow }: { allow: UserRole[] }) {
  const { auth } = useAuth();

  // Two separate login pages now exist (client vs. super-admin), so an
  // unauthenticated or wrong-role visitor is bounced to whichever one
  // actually matches the route they tried to reach.
  const loginPath = allow.includes("SUPER_ADMIN") ? "/admin/login" : "/login";

  if (!auth) return <Navigate to={loginPath} replace />;
  if (!allow.includes(auth.role)) return <Navigate to={loginPath} replace />;

  // A LOCKED client must only ever reach the payment-renewal page,
  // regardless of which URL they typed — per SRS section 43.
  if (auth.role === "CLIENT_USER" && auth.subscriptionStatus === "LOCKED") {
    return <Navigate to="/payment-renewal" replace />;
  }

  return <Outlet />;
}
