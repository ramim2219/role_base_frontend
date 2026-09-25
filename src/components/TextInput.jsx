/**
 * TextInput — styled text/email/password/etc. input.
 *
 * Props: label, name, value, onChange, type,
 *        placeholder, required, error,
 *        icon (string or component), iconPosition ("left"|"right"), ...rest
 */
export default function TextInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  error,
  icon: Icon,
  iconPosition = "left",
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {renderIcon()}
          </span>
        )}

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`
            w-full px-3 py-2 rounded-lg text-sm
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
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {renderIcon()}
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}