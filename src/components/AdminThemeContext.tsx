"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AdminTheme = "dark" | "light";

type Ctx = {
  theme: AdminTheme;
  setTheme: (t: AdminTheme) => void;
  toggleTheme: () => void;
};

const AdminThemeContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "admin-theme";

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>("dark");

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "light" || v === "dark") {
        // Hydrate saved preference after SSR (default is dark).
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client-only theme restore
        setThemeState(v);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setTheme = useCallback((t: AdminTheme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <AdminThemeContext.Provider value={value}>
      <div className={theme === "dark" ? "dark min-h-screen" : "min-h-screen"}>{children}</div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme(): Ctx {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) {
    throw new Error("useAdminTheme must be used within AdminThemeProvider");
  }
  return ctx;
}
