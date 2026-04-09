import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthUser {
  id: string;
  username: string;
  avatar?: string | null;
  guildId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  forbidden: 'Seu usuário não possui permissão para acessar este dashboard.',
  invalid_state: 'A autenticação expirou. Tente novamente.',
  error: 'Não foi possível concluir o login com Discord.',
};

type AuthMeResponse = {
  authenticated?: boolean;
  user?: AuthUser;
  error?: string;
};

async function fetchAuthSession(): Promise<AuthMeResponse> {
  const response = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  let payload: AuthMeResponse | null = null;
  try {
    payload = (await response.json()) as AuthMeResponse;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    return {
      authenticated: false,
      error: payload?.error || 'Não autenticado',
    };
  }

  return payload || { authenticated: false };
}

function handleAuthQueryFeedback(search: string) {
  const searchParams = new URLSearchParams(search);
  const authError = searchParams.get('auth');

  if (!authError) {
    return;
  }

  const message = AUTH_ERROR_MESSAGES[authError] || 'Não foi possível autenticar sua conta.';
  toast.error(message);

  searchParams.delete('auth');
  const query = searchParams.toString();
  const nextPath = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', nextPath);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [user, setUser] = useState<AuthUser | null>(null);

  const refreshAuth = useCallback(async () => {
    setStatus('loading');

    const payload = await fetchAuthSession();
    if (payload.authenticated && payload.user) {
      setUser(payload.user);
      setStatus('authenticated');
      return true;
    }

    setUser(null);
    setStatus('unauthenticated');
    return false;
  }, []);

  const login = useCallback(() => {
    window.location.assign('/api/auth/discord/login');
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });
    } finally {
      setUser(null);
      setStatus('unauthenticated');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    handleAuthQueryFeedback(location.search);

    void refreshAuth();
  }, [location.search, refreshAuth]);

  useEffect(() => {
    if (status === 'loading' || status === 'idle') {
      return;
    }

    if (status === 'authenticated' && location.pathname === '/login') {
      navigate('/', { replace: true });
      return;
    }

    if (status === 'unauthenticated' && location.pathname !== '/login') {
      navigate('/login', { replace: true, state: { from: location.pathname } });
    }
  }, [location.pathname, navigate, status]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading' || status === 'idle',
      login,
      logout,
      refreshAuth,
    }),
    [login, logout, refreshAuth, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }

  return context;
}
