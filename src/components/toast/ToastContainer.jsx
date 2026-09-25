import {
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { useToastContext } from "../../context/ToastContext";

const variants = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-green-500",
    barClass: "bg-green-500",
  },
  error: {
    icon: XCircle,
    iconClass: "text-red-500",
    barClass: "bg-red-500",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-yellow-500",
    barClass: "bg-yellow-500",
  },
  info: {
    icon: Info,
    iconClass: "text-blue-500",
    barClass: "bg-blue-500",
  },
  loading: {
    icon: Loader2,
    iconClass: "text-gray-500 animate-spin",
    barClass: "bg-gray-400",
  },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastContext();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-[calc(100vw-2rem)] sm:w-96 pointer-events-none">
      {toasts.map((toast) => {
        const variant = variants[toast.type] || variants.info;
        const Icon = variant.icon;

        return (
          <div
            key={toast.id}
            className="pointer-events-auto relative flex items-start gap-3 p-4 pr-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg shadow-black/5 dark:shadow-black/30 overflow-hidden animate-[toastIn_0.2s_ease-out]"
          >
            <span
              className={`absolute left-0 top-0 bottom-0 w-1 ${variant.barClass}`}
            />

            <Icon className={`shrink-0 w-5 h-5 mt-0.5 ${variant.iconClass}`} />

            <div className="flex-1 min-w-0">
              {toast.title && (
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  {toast.title}
                </p>
              )}
              {toast.message && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 break-words">
                  {toast.message}
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="absolute top-3 right-3 p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}