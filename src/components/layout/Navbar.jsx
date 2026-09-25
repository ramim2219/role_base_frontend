import { Menu, PanelLeftClose, PanelLeft, Search } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import ProfileDropdown from "./ProfileDropdown";
import NotificationsDropdown from "./NotificationsDropdown";

export default function Navbar({ onToggleSidebar, onToggleMobile, sidebarCollapsed }) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 gap-4">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        <button
          onClick={onToggleSidebar}
          className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? (
            <PanelLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>

        <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 w-64">
          <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 w-full"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationsDropdown />
        <ProfileDropdown />
      </div>
    </header>
  );
}