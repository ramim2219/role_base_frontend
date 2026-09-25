import { Check } from "lucide-react";

/**
 * Checkbox — accessible checkbox with label/description/error.
 *
 * Props:
 *  label, name, value, checked, onChange
 *  inline, required, disabled, className, error, description
 */
export default function Checkbox({
  label,
  name,
  value,
  checked = false,
  onChange,
  inline = false,
  required = false,
  disabled = false,
  className = "",
  error = "",
  description = "",
}) {
  const id = `checkbox-${name}-${value ?? "default"}`;

  return (
    <div
      className={`${inline ? "inline-flex mr-4" : "block"} ${
        disabled ? "opacity-60" : ""
      } ${className}`}
    >
      <label
        htmlFor={id}
        className="inline-flex items-start gap-2 cursor-pointer select-none"
      >
        <span className="relative flex items-center justify-center mt-0.5">
          <input
            id={id}
            type="checkbox"
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className="peer sr-only"
          />
          <span
            className="
              w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600
              peer-checked:bg-blue-600 peer-checked:border-blue-600
              peer-focus:ring-2 peer-focus:ring-blue-500/40
              transition-colors flex items-center justify-center
            "
          >
            <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
          </span>
        </span>

        <span className="min-w-0">
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </span>
          {description && (
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {description}
            </span>
          )}
        </span>
      </label>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1 ml-6">
          {error}
        </p>
      )}
    </div>
  );
}