import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!session) nav("/auth", { replace: true, state: { from: loc.pathname } });
  }, [loading, session, nav, loc.pathname]);

  if (loading) return null;
  if (!session) return null;
  return children;
}
