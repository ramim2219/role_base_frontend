import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

/**
 * Breadcrumb — auto-built from current URL.
 *
 * Props:
 *   homeLabel = "Home"     → text for the Home link
 *   showHomeIcon = true    → render a house icon
 *   className              → extra wrapper classes
 *   capitalize = true      → capitalize each segment
 *   transformLabel = (segment, index) => string  → custom formatter
 */
export default function Breadcrumb({
  homeLabel = "Home",
  showHomeIcon = true,
  className = "",
  capitalize = true,
  transformLabel,
}) {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(Boolean);

  const labelFor = (seg, i) => {
    if (transformLabel) return transformLabel(seg, i);
    const text = seg.replace(/[-_]/g, " ");
    return capitalize ? text.charAt(0).toUpperCase() + text.slice(1) : text;
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 ${className}`}
    >
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        {showHomeIcon && <Home className="w-3.5 h-3.5" />}
        <span>{homeLabel}</span>
      </Link>

      {pathnames.map((value, index) => {
        const to = "/" + pathnames.slice(0, index + 1).join("/");
        const isLast = index === pathnames.length - 1;
        const label = labelFor(value, index);

        return (
          <span key={to} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            {isLast ? (
              <span className="text-gray-800 dark:text-gray-200 font-medium">
                {label}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}