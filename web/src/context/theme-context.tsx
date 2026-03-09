"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface IThemeContext {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<IThemeContext | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // avoid cascading render
    Promise.resolve().then(() => setMounted(true));

    const saved = localStorage.getItem("portfolio-theme");
    if (saved !== null) {
      // avoid cascading render
      Promise.resolve().then(() => setIsDark(saved === "true"));
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("portfolio-theme", String(isDark));
    }
  }, [isDark, mounted]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  if (!mounted) {
    return <div className="min-h-screen" />;
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div
        className={`min-h-screen transition-colors duration-500 ${
          isDark ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context)
    throw new Error("useTheme harus dipakai di dalam ThemeProvider!");
  return context;
}
