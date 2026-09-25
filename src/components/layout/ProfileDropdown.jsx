import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Settings,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronDown,
} from "lucide-react";
import useClickOutside from "../../hooks/useClickOutside";
import { useAuth } from "../../context/AuthContext";
import { showSuccessToast } from "../../Helper/TosterHelper";

const menuItems = [
  { to: "/profile", label: "My Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/help", label: "Help & Support", icon: HelpCircle },
];

export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useClickOutside(ref, () => setOpen(false));

  // Fallbacks in case user data isn't ready
  const name = user?.name || "Guest User";
  const email = user?.email || "guest@example.com";
  const avatar = user?.avatar || "https://i.pravatar.cc/40?img=12";

  const handleLogout = () => {
    setOpen(false);
    logout();
    showSuccessToast("Logged out successfully");
    navigate("/login", { replace: true });
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <img
          src={avatar}
          alt={name}
          className="w-8 h-8 rounded-full object-cover"
        />
        <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[120px] truncate">
          {name}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden z-50 animate-[fadeIn_0.12s_ease-out]"
        >
          {/* User header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <img
                src={avatar}
                alt={name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                  {name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                role="menuitem"
              >
                <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 dark:border-gray-700 py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              role="menuitem"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}