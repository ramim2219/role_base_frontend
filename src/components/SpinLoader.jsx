import { Loader2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

/**
 * SpinLoader — full-screen loading overlay.
 * Uses ThemeContext to know if dark mode is active.
 */
export default function SpinLoader({ text = "Loading..." }) {
  const { theme } = useTheme();

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3
        backdrop-blur-sm transition-colors
        ${theme === "dark"
          ? "bg-gray-900/70 text-gray-100"
          : "bg-white/70 text-gray-800"}
      `}
    >
      <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" />
      <p className="text-sm font-semibold">{text}</p>
    </div>
  );
}