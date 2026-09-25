import { useEffect } from "react";
import { X, Loader2, Info } from "lucide-react";
import CustomButton from "./CustomButton";

/**
 * AppModal — Tailwind modal with header/body/footer.
 *
 * Props:
 *  show, onHide, title, subtitle, icon
 *  children, loading, empty, emptyMessage
 *  footer = true (boolean) | JSX
 *  size: "sm" | "md" | "lg" | "xl" | "full"
 *  backdrop = true, scrollable = true, className
 *  print, printFunction, printDocumentTitle
 *  customButtonTitle, customButtonOnClick, customButtonLoading,
 *  customButtonDisable, customButtonColor, customButtonIcon
 *  footerButtons = [{ text, icon, color, onClick, disabled, loading }]
 *  nested = false, zIndex = 1050
 */
export default function AppModal({
  show,
  onHide,
  title,
  subtitle,
  icon: Icon,
  children,
  loading = false,
  empty = false,
  emptyMessage = "No data available",
  footer = true,
  size = "lg",
  backdrop = true,
  scrollable = true,
  className = "",
  print = false,
  printFunction,
  printDocumentTitle = "Document",
  customButtonTitle = "",
  customButtonOnClick,
  customButtonLoading = false,
  customButtonDisable = false,
  customButtonColor = "primary",
  customButtonIcon,
  footerButtons = [],
  zIndex = 1050,
  nested = false,
}) {
  // Lock body scroll when open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  // Esc to close
  useEffect(() => {
    if (!show) return;
    const onKey = (e) => e.key === "Escape" && onHide?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [show, onHide]);

  if (!show) return null;

  const sizes = {
    sm:   "max-w-sm",
    md:   "max-w-md",
    lg:   "max-w-2xl",
    xl:   "max-w-4xl",
    full: "max-w-[95vw]",
  };

  const handlePrint = () => {
    printFunction?.();
    window.print();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex }}
    >
      {/* Backdrop */}
      {backdrop && (
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={nested ? (e) => e.stopPropagation() : onHide}
        />
      )}

      {/* Content */}
      <div
        className={`relative w-full ${sizes[size] || sizes.lg} max-h-[90vh] flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---------- Header ---------- */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              typeof Icon === "string"
                ? <i className={`${Icon} text-blue-600`} />
                : <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onHide}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ---------- Body ---------- */}
        <div
          className={`flex-1 px-5 py-4 ${scrollable ? "overflow-y-auto" : ""}`}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Loading...
              </p>
            </div>
          ) : empty ? (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{emptyMessage}</p>
            </div>
          ) : (
            children
          )}
        </div>

        {/* ---------- Footer ---------- */}
        {footer !== false && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
            {/* If footer is a custom node */}
            {typeof footer !== "boolean" ? (
              footer
            ) : (
              <>
                <CustomButton
                  title="Close"
                  color="secondary"
                  icon={X}
                  size="sm"
                  onClick={onHide}
                />

                {print && (
                  <CustomButton
                    title="Print"
                    color="primary"
                    size="sm"
                    onClick={handlePrint}
                  />
                )}

                {customButtonTitle && (
                  <CustomButton
                    title={customButtonTitle}
                    icon={customButtonIcon}
                    color={customButtonColor}
                    size="sm"
                    disabled={customButtonDisable}
                    loading={customButtonLoading}
                    onClick={customButtonOnClick}
                  />
                )}

                {footerButtons.map((b, i) => (
                  <CustomButton
                    key={i}
                    title={b.text}
                    icon={b.icon}
                    color={b.color || "primary"}
                    size={b.size || "sm"}
                    disabled={b.disabled}
                    loading={b.loading}
                    onClick={b.onClick}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}