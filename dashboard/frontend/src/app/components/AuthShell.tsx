import { Outlet } from 'react-router';
import { AuthProvider } from '../context/AuthContext';

export function AuthShell() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
