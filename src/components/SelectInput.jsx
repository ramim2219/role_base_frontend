import { ChevronDown } from "lucide-react";

/**
 * SelectInput — native select, Tailwind-styled.
 *
 * Props: label, name, placeHolder, value, onChange, options=[{value,label}],
 *        error, required, ...rest
 */
export default function SelectInput({
  label,
  name,
  placeHolder,
  value,
  onChange,
  options = [],
  error,
  required,
  className = "",
  ...props
}) {
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
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={`
            w-full appearance-none px-3 pr-9 py-2 rounded-lg text-sm
            bg-white dark:bg-gray-800
            text-gray-700 dark:text-gray-200
            border focus:outline-none focus:ring-2 transition
            ${
              error
                ? "border-red-400 focus:ring-red-500/40"
                : "border-gray-300 dark:border-gray-600 focus:ring-blue-500/40 focus:border-blue-500"
            }
          `}
          {...props}
        >
          <option value="">{placeHolder}</option>
          {options.map((opt, i) => (
            <option key={opt.value ?? i} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}