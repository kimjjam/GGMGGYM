// client/src/components/Protected.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import type { ReactNode } from "react";

export default function Protected({ children }: { children: ReactNode }) {
  const token = useAuth((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
