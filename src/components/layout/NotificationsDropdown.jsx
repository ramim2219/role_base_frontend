import { useRef, useState } from "react";
import {
  Bell,
  Check,
  UserPlus,
  ShoppingBag,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import useClickOutside from "../../hooks/useClickOutside";

const initialNotifications = [
  {
    id: 1,
    icon: UserPlus,
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    title: "New user registered",
    description: "Sarah Johnson just signed up",
    time: "2 min ago",
    unread: true,
  },
  {
    id: 2,
    icon: ShoppingBag,
    iconBg: "bg-green-100 dark:bg-green-900/40",
    iconColor: "text-green-600 dark:text-green-400",
    title: "New order received",
    description: "Order #10245 — $124.00",
    time: "15 min ago",
    unread: true,
  },
  {
    id: 3,
    icon: AlertTriangle,
    iconBg: "bg-yellow-100 dark:bg-yellow-900/40",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    title: "Low stock warning",
    description: "Only 3 items left in 'Wireless Mouse'",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: 4,
    icon: MessageSquare,
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    iconColor: "text-purple-600 dark:text-purple-400",
    title: "New message",
    description: "Michael: Can you review the PR?",
    time: "3 hours ago",
    unread: false,
  },
];

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const ref = useRef(null);

  useClickOutside(ref, () => setOpen(false));

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden z-50
          animate-[fadeIn_0.12s_ease-out]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                No notifications
              </p>
            ) : (
              notifications.map((n) => {
                const Icon = n.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() =>
                      setNotifications((prev) =>
                        prev.map((x) =>
                          x.id === n.id ? { ...x, unread: false } : x
                        )
                      )
                    }
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-b-0
                      ${n.unread ? "bg-blue-50/40 dark:bg-blue-900/10" : ""}`}
                  >
                    <div
                      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${n.iconBg}`}
                    >
                      <Icon className={`w-4 h-4 ${n.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                          {n.title}
                        </p>
                        {n.unread && (
                          <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {n.description}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                        {n.time}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <button className="w-full text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 py-3 transition-colors">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}