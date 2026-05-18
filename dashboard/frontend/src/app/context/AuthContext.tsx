import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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

const SESSION_ERROR_MESSAGES: Record<string, string> = {
  expired: 'Sua sessão expirou. Faça login novamente.',
  invalid_session: 'Sua sessão expirou. Faça login novamente.',
  no_access: 'Seu acesso ao dashboard foi revogado.',
};

type AuthMeResponse = {
  authenticated?: boolean;
  user?: AuthUser;
  error?: string;
  reason?: string;
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
      reason: payload?.reason,
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

function resolveSessionErrorMessage(payload: AuthMeResponse, wasAuthenticated: boolean) {
  if (payload?.reason && SESSION_ERROR_MESSAGES[payload.reason]) {
    return SESSION_ERROR_MESSAGES[payload.reason];
  }

  if (wasAuthenticated) {
    return 'Sua sessão expirou. Faça login novamente.';
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [user, setUser] = useState<AuthUser | null>(null);
  const wasAuthenticatedRef = useRef(false);

  const refreshAuth = useCallback(async () => {
    setStatus('loading');

    try {
      const payload = await fetchAuthSession();
      if (payload.authenticated && payload.user) {
        setUser(payload.user);
        setStatus('authenticated');
        wasAuthenticatedRef.current = true;
        return true;
      }

      const sessionMessage = resolveSessionErrorMessage(payload, wasAuthenticatedRef.current);
      if (sessionMessage) {
        toast.error(sessionMessage);
      }
    } catch {
      if (wasAuthenticatedRef.current) {
        toast.error('Não foi possível validar sua sessão. Tente novamente.');
      }
    }

    setUser(null);
    setStatus('unauthenticated');
    wasAuthenticatedRef.current = false;
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
      wasAuthenticatedRef.current = false;
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
