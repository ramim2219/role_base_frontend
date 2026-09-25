import { Circle } from "lucide-react";

/**
 * RadioButton — radio group with label, options, description, error.
 *
 * Props:
 *  label, name, options=[{ value, label, description, disabled }]
 *  value, onChange, inline, required, disabled, className, error
 */
export default function RadioButton({
  label,
  name,
  options = [],
  value,
  onChange,
  inline = false,
  required = false,
  disabled = false,
  className = "",
  error = "",
}) {
  // Emit synthetic event identical to a native input
  const handleChange = (optionValue) => {
    onChange?.({
      target: { name, value: optionValue, type: "radio" },
    });
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className={inline ? "flex flex-wrap items-center gap-4" : "space-y-2"}>
        {options.map((opt) => {
          const id = `${name}-${opt.value}`;
          const isChecked = value === opt.value;
          const isDisabled = disabled || opt.disabled;

          return (
            <label
              key={opt.value}
              htmlFor={id}
              className={`inline-flex items-start gap-2 cursor-pointer select-none ${
                isDisabled ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <span className="relative flex items-center justify-center mt-0.5">
                <input
                  id={id}
                  type="radio"
                  name={name}
                  value={opt.value}
                  checked={isChecked}
                  onChange={() => handleChange(opt.value)}
                  required={required}
                  disabled={isDisabled}
                  className="peer sr-only"
                />
                <span
                  className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600
                    peer-checked:border-blue-600
                    peer-focus:ring-2 peer-focus:ring-blue-500/40
                    transition-colors flex items-center justify-center"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-600 opacity-0 peer-checked:opacity-100 transition-opacity" />
                </span>
              </span>

              <span className="min-w-0">
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  {opt.label}
                </span>
                {opt.description && (
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {opt.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}