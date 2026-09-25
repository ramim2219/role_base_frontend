/**
 * TextArea — styled textarea with optional icon + char counter.
 *
 * Props: label, name, value, onChange, placeholder,
 *        rows, cols, required, error,
 *        icon (string or component), iconPosition ("left"|"right"),
 *        maxLength, showCount, ...rest
 */
export default function TextArea({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  cols,
  required = false,
  error,
  icon: Icon,
  iconPosition = "left",
  maxLength,
  showCount = false,
  className = "",
  ...props
}) {
  const hasLeftIcon = Icon && iconPosition === "left";
  const hasRightIcon = Icon && iconPosition === "right";

  const renderIcon = () =>
    Icon ? (
      typeof Icon === "string" ? (
        <i className={Icon} />
      ) : (
        <Icon className="w-4 h-4" />
      )
    ) : null;

  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {hasLeftIcon && (
          <span className="absolute left-3 top-3 text-gray-400">
            {renderIcon()}
          </span>
        )}

        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          cols={cols}
          maxLength={maxLength}
          required={required}
          className={`
            w-full px-3 py-2 rounded-lg text-sm resize-y
            bg-white dark:bg-gray-800
            text-gray-700 dark:text-gray-200
            placeholder-gray-400 dark:placeholder-gray-500
            border focus:outline-none focus:ring-2 transition
            ${hasLeftIcon ? "pl-9" : ""}
            ${hasRightIcon ? "pr-9" : ""}
            ${
              error
                ? "border-red-400 focus:ring-red-500/40"
                : "border-gray-300 dark:border-gray-600 focus:ring-blue-500/40 focus:border-blue-500"
            }
          `}
          {...props}
        />

        {hasRightIcon && (
          <span className="absolute right-3 top-3 text-gray-400">
            {renderIcon()}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-1">
        {error ? (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : (
          <span />
        )}
        {showCount && maxLength && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {value?.length || 0}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}