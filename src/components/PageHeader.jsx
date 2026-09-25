import Breadcrumb from "./Breadcrumb";
import { HelpCircle } from "lucide-react";

/**
 * PageHeader — page title + optional breadcrumb + optional Guide button.
 *
 * Props:
 *   title       → string
 *   icon        → lucide component OR string (font-awesome class)
 *   breadcrumb  → boolean (show breadcrumb)
 *   onClickGuide → fn (shows Guide button if provided)
 *   rightSlot   → JSX (custom right-side content)
 */
export default function PageHeader({
  title,
  icon: Icon,
  breadcrumb = false,
  onClickGuide,
  rightSlot,
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: Title */}
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            typeof Icon === "string" ? (
              <i className={`${Icon} text-gray-600 dark:text-gray-400`} />
            ) : (
              <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white uppercase truncate">
            {title}
          </h1>
        </div>

        {/* Right: Breadcrumb + Guide */}
        <div className="flex items-center gap-3">
          {breadcrumb && <Breadcrumb />}

          {onClickGuide && (
            <button
              onClick={onClickGuide}
              title="Page Guide"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Guide
            </button>
          )}

          {rightSlot}
        </div>
      </div>
    </div>
  );
}