import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getOrCreateDeviceId } from '../lib/deviceId';

export interface CurrentUser {
  id: string;
  phoneNumber: string;
  name: string | null;
  createdAt: string;
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  token: string | null;
  deviceId: string;
  loading: boolean;
  setAuth: (token: string, user: CurrentUser) => void;
  logout: () => void;
}

const deviceId = getOrCreateDeviceId();

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  token: null,
  deviceId,
  loading: true,
  setAuth: () => {},
  logout: () => {},
});

const SESSION_COOKIE = 'wa_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

function setSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${SESSION_MAX_AGE}; SameSite=Strict`;
}

function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    api.me()
      .then((res) => {
        const user = res.data ?? res;
        setCurrentUser(user);
        setToken(storedToken);
        setSessionCookie();
      })
      .catch((err: any) => {
        if (err?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          clearSessionCookie();
          navigate('/login', { replace: true });
        } else {
          // Network error or server issue — keep the session, use cached user if available
          const cached = localStorage.getItem('user');
          if (cached) {
            try { setCurrentUser(JSON.parse(cached)); } catch {}
          }
          setToken(storedToken);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function setAuth(newToken: string, user: CurrentUser) {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(newToken);
    setCurrentUser(user);
    setSessionCookie();
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearSessionCookie();
    setCurrentUser(null);
    setToken(null);
    navigate('/login');
  }

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ currentUser, token, deviceId, loading, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
