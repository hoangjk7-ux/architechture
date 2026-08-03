import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SimpleAuthUser = {
  username: string;
  role: "admin" | "cto" | "it_manager" | "business_owner" | "viewer";
};

type SimpleAuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: SimpleAuthUser | null;
  error: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  login: (user: SimpleAuthUser) => void;
  signOut: () => void;
};

const AUTH_STORAGE_KEY = "techgov-simple-auth";
const SimpleAuthContext = createContext<SimpleAuthContextValue | undefined>(undefined);

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SimpleAuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    try {
      const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { user?: SimpleAuthUser };
        if (parsed.user) {
          setUser(parsed.user);
          setIsAuthenticated(true);
        }
      }
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    setError(null);

    if (username.trim() === "admin" && password === "123456789") {
      const nextUser: SimpleAuthUser = { username: "admin", role: "admin" };
      setUser(nextUser);
      setIsAuthenticated(true);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: nextUser }));
      }
      return;
    }

    const message = "Tên đăng nhập hoặc mật khẩu không đúng";
    setError(message);
    throw new Error(message);
  }, []);

  const login = useCallback((nextUser: SimpleAuthUser) => {
    setUser(nextUser);
    setIsAuthenticated(true);
    setError(null);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: nextUser }));
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const value = useMemo<SimpleAuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      error,
      signIn,
      login,
      signOut,
    }),
    [error, isAuthenticated, isLoading, signIn, signOut, user],
  );

  return <SimpleAuthContext.Provider value={value}>{children}</SimpleAuthContext.Provider>;
}

export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext);
  if (!context) {
    throw new Error("useSimpleAuth must be used within a SimpleAuthProvider");
  }
  return context;
}
