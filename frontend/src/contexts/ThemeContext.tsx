import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeMode = "light" | "dark" | "auto";

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("themeMode");
    return (saved as ThemeMode) || "auto";
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (themeMode === "dark") return true;
    if (themeMode === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [primaryColor, setPrimaryColor] = useState(() => {
    return localStorage.getItem("primaryColor") || "#1677ff";
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (themeMode === "auto") {
        setIsDarkMode(mediaQuery.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem("themeMode", themeMode);

    if (themeMode === "dark") {
      setIsDarkMode(true);
    } else if (themeMode === "light") {
      setIsDarkMode(false);
    } else {
      setIsDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem("primaryColor", primaryColor);
    document.documentElement.style.setProperty("--primary-color", primaryColor);
  }, [primaryColor]);

  // Apply theme to HTML document
  useEffect(() => {
    // Set data-theme attribute on HTML element
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light",
    );

    // Set Ant Design theme
    document.documentElement.setAttribute(
      "data-antd-theme",
      isDarkMode ? "dark" : "light",
    );
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        isDarkMode,
        primaryColor,
        setPrimaryColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
