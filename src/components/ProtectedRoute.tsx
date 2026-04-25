import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const userId = sessionStorage.getItem('userId');

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
