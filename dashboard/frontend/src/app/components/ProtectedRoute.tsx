import { Navigate, Outlet } from 'react-router';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <LoaderCircle className="size-4 animate-spin" />
          <span>Validando sessão...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
