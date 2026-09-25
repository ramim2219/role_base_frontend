import { Loader2 } from "lucide-react";

const COLORS = {
  primary:   "bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200",
  success:   "bg-green-600 hover:bg-green-700 text-white",
  danger:    "bg-red-600 hover:bg-red-700 text-white",
  warning:   "bg-yellow-500 hover:bg-yellow-600 text-white",
  info:      "bg-cyan-600 hover:bg-cyan-700 text-white",
  light:     "bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-600",
  dark:      "bg-gray-800 hover:bg-gray-900 text-white",
  link:      "bg-transparent text-blue-600 hover:underline dark:text-blue-400",
};

/**
 * CustomButton — Bootstrap-CustomButton API, Tailwind styling.
 *
 * Props: logo, title, color, disabled, loading, onClick, type, extraClass
 */
export default function CustomButton({
  logo: Logo,
  title,
  color = "primary",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  extraClass = "",
}) {
  const colorClass = COLORS[color] || COLORS.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide
        transition-colors disabled:opacity-60 disabled:cursor-not-allowed
        ${colorClass} ${extraClass}
      `}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          {Logo && (
            typeof Logo === "string" ? (
              <i className={Logo} />
            ) : (
              <Logo className="w-4 h-4" />
            )
          )}
          {title?.toUpperCase?.() || title}
        </>
      )}
    </button>
  );
}