"use client";

import { useTheme } from "@/context/theme-context";

export function useThemeClass() {
  const { isDark } = useTheme();
  return isDark ? "bg-black text-white" : "bg-white text-black";
}

export function useThemeButton() {
  const { isDark } = useTheme();
  return isDark ? "bg-white text-black" : "bg-black text-white";
}
