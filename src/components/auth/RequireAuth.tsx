// @ts-nocheck
import { ReactNode, forwardRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

type RequireAuthProps = {
  children: ReactNode;
};

const RequireAuth = forwardRef<HTMLDivElement, RequireAuthProps>(
  ({ children }, ref) => {
    const { user, session, loading, approvalStatus, userRole } = useAuth();
    const location = useLocation();

    if (loading) {
      return (
        <div ref={ref} className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      );
    }

    if (!user || !session) {
      const redirect = `${location.pathname}${location.search}${location.hash}`;
      return <Navigate to={`/login?reason=expired&redirect=${encodeURIComponent(redirect)}`} replace />;
    }

    // Wait for role hydration before gating
    if (approvalStatus === null && !userRole) {
      return (
        <div ref={ref} className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      );
    }

    if (approvalStatus === 'pending') {
      return <Navigate to="/dashboard/pending" replace />;
    }

    if (approvalStatus === 'rejected') {
      return <Navigate to="/access-denied" replace />;
    }

    return <div ref={ref}>{children}</div>;
  }
);

RequireAuth.displayName = "RequireAuth";

export default RequireAuth;
