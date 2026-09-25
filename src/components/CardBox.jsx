import { useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import CustomButton from "./CustomButton";
import useClickOutside from "../hooks/useClickOutside";

/**
 * CardBox — Tailwind version of Bootstrap CardBox.
 *
 * Props:
 *  title, subTitle, icon, headerBgColor
 *  children                      → body
 *  footer                        → string or JSX (left side of footer)
 *
 *  buttons = [                   → header action buttons
 *    { text, icon, color, onClick, disabled, loading }
 *  ]
 *
 *  showDropdown, dropdownButtonText, dropdownButtonIcon,
 *  dropdownButtonColor, dropdownItems = [{ text, icon, onClick, disabled, loading }],
 *  onDropdownItemClick, dropdownMenuClassName
 *
 *  footerButtons = [             → footer right-side buttons
 *    { text, icon, color, size, onClick, disabled, loading }
 *  ]
 *  footerClassName, showFooterDivider
 */
export default function CardBox({
  title,
  subTitle,
  icon: Icon,
  headerBgColor = "white",
  children,
  footer,
  buttons = [],

  // footer
  footerButtons = [],
  footerClassName = "",
  showFooterDivider = true,

  // dropdown
  showDropdown = false,
  dropdownButtonText = "Actions",
  dropdownButtonIcon,
  dropdownButtonColor = "primary",
  dropdownItems = [],
  onDropdownItemClick,
  dropdownMenuClassName = "",
  dropdownButtonClassName = "",
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ddRef = useRef(null);
  useClickOutside(ddRef, () => setDropdownOpen(false));

  // header background classes
  const headerBg = {
    white:   "bg-white dark:bg-gray-800",
    primary: "bg-blue-50 dark:bg-blue-900/20",
    light:   "bg-gray-50 dark:bg-gray-800/60",
    success: "bg-green-50 dark:bg-green-900/20",
    warning: "bg-yellow-50 dark:bg-yellow-900/20",
    danger:  "bg-red-50 dark:bg-red-900/20",
  }[headerBgColor] || "bg-white dark:bg-gray-800";

  const hasHeader = title || buttons.length > 0 || (showDropdown && dropdownItems.length > 0);
  const hasFooter = footer || footerButtons.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* ---------------- Header ---------------- */}
      {hasHeader && (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${headerBg}`}>
          {/* Title */}
          <div className="flex items-center gap-2 min-w-0">
            {Icon && (
              typeof Icon === "string"
                ? <i className={`${Icon} text-gray-500 dark:text-gray-400`} />
                : <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            )}
            {title && (
              <h3 className="text-base font-semibold text-gray-800 dark:text-white truncate">
                {title}
              </h3>
            )}
            {subTitle && (
              <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {subTitle}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Header buttons */}
            {buttons.map((b, i) => (
              <CustomButton
                key={i}
                title={b.text}
                icon={b.icon}
                color={b.color || "primary"}
                size="sm"
                disabled={b.disabled}
                loading={b.loading}
                onClick={b.onClick}
              />
            ))}

            {/* Dropdown */}
            {showDropdown && dropdownItems.length > 0 && (
              <div className="relative" ref={ddRef}>
                <CustomButton
                  title={dropdownButtonText}
                  icon={dropdownButtonIcon}
                  color={dropdownButtonColor}
                  size="sm"
                  onClick={() => setDropdownOpen((v) => !v)}
                  extraClass={dropdownButtonClassName}
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </CustomButton>

                {dropdownOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50 py-1 overflow-hidden ${dropdownMenuClassName}`}
                  >
                    {dropdownItems.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setDropdownOpen(false);
                          if (item.onClick) item.onClick();
                          else onDropdownItemClick?.(item);
                        }}
                        disabled={item.disabled || item.loading}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                      >
                        {item.loading ? (
                          <i className="fas fa-spinner fa-spin" />
                        ) : item.icon ? (
                          typeof item.icon === "string" ? (
                            <i className={`${item.icon} w-4`} />
                          ) : (
                            <item.icon className="w-4 h-4" />
                          )
                        ) : null}
                        <span>{item.text || item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- Body ---------------- */}
      <div className="px-4 py-4">{children}</div>

      {/* ---------------- Footer ---------------- */}
      {hasFooter && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 ${
            showFooterDivider ? "border-t border-gray-200 dark:border-gray-700" : ""
          } ${footerClassName}`}
        >
          <div className="min-w-0 flex-1">
            {typeof footer === "string" ? (
              <span className="text-sm text-gray-500 dark:text-gray-400">{footer}</span>
            ) : (
              footer
            )}
          </div>

          {footerButtons.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}