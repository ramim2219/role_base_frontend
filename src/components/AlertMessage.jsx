import { Info, CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";

const VARIANTS = {
  info:    { Icon: Info,         cls: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/40" },
  success: { Icon: CheckCircle2, cls: "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/40" },
  warning: { Icon: AlertTriangle,cls: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-900/40" },
  danger:  { Icon: XCircle,      cls: "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/40" },
  error:   { Icon: XCircle,      cls: "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/40" },
};

/**
 * AlertMessage — dismissible alert.
 * Props: type ("info"|"success"|"warning"|"danger"), message, onClose, className
 */
export default function AlertMessage({
  type = "info",
  message,
  onClose,
  className = "",
}) {
  if (!message) return null;
  const v = VARIANTS[type] || VARIANTS.info;
  const Icon = v.Icon;

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${v.cls} ${className}`}
      role="alert"
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}