import { useEffect, useRef, useState, useMemo } from "react";
import { ChevronDown, X, Check, Search } from "lucide-react";
import useClickOutside from "../hooks/useClickOutside";

/**
 * Select2 — pure React multi/single select with search.
 *
 * Props:
 *  options = [{ value, label, description?, disabled? }]
 *  label, value, onChange, placeholder
 *  allowClear, disabled, multiple, isSearchable
 *  width, className, name, id
 *  closeOnSelect, maxSelectionLength, required, error
 */
export default function Select2({
  options = [],
  label = "",
  value = "",
  onChange,
  placeholder = "Select an option",
  allowClear = false,
  disabled = false,
  multiple = false,
  isSearchable = false,
  width = "100%",
  className = "",
  name,
  id,
  closeOnSelect = false,
  maxSelectionLength,
  required = false,
  error,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useClickOutside(ref, () => setOpen(false));

  // Normalize value → always array internally for multiple
  const selectedValues = useMemo(
    () => (multiple ? (Array.isArray(value) ? value : []) : value ? [value] : []),
    [value, multiple]
  );

  const filtered = useMemo(() => {
    if (!isSearchable || !query) return options;
    const q = query.toLowerCase();
    return options.filter((o) =>
      (o.label || o.name || "").toLowerCase().includes(q)
    );
  }, [options, query, isSearchable]);

  const emit = (nextValues) => {
    if (multiple) onChange?.(nextValues);
    else onChange?.(nextValues[0] ?? "");
  };

  const toggleOption = (optVal) => {
    const isSelected = selectedValues.includes(optVal);

    if (multiple) {
      let next;
      if (isSelected) {
        next = selectedValues.filter((v) => v !== optVal);
      } else {
        if (maxSelectionLength && selectedValues.length >= maxSelectionLength) return;
        next = [...selectedValues, optVal];
      }
      emit(next);
      if (closeOnSelect && !isSelected) setOpen(false);
    } else {
      emit(isSelected ? [] : [optVal]);
      setOpen(false);
    }
  };

  const clearAll = (e) => {
    e.stopPropagation();
    emit([]);
    setQuery("");
  };

  const selectedOptions = options.filter((o) =>
    selectedValues.includes(o.value ?? o.id)
  );

  return (
    <div className={`mb-3 ${className}`} style={{ width }}>
      {label && (
        <label
          htmlFor={id || name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div ref={ref} className="relative">
        {/* Trigger */}
        <button
          type="button"
          id={id || name}
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          className={`
            w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left
            bg-white dark:bg-gray-800
            text-gray-700 dark:text-gray-200
            border focus:outline-none focus:ring-2 transition
            ${disabled ? "opacity-60 cursor-not-allowed" : ""}
            ${
              error
                ? "border-red-400 focus:ring-red-500/40"
                : "border-gray-300 dark:border-gray-600 focus:ring-blue-500/40 focus:border-blue-500"
            }
          `}
        >
          <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1">
            {selectedOptions.length === 0 ? (
              <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>
            ) : multiple ? (
              selectedOptions.map((o) => (
                <span
                  key={o.value ?? o.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs"
                >
                  {o.label || o.name}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(o.value ?? o.id);
                    }}
                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="truncate">
                {selectedOptions[0]?.label || selectedOptions[0]?.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {allowClear && selectedValues.length > 0 && (
              <span
                role="button"
                onClick={clearAll}
                className="p-0.5 rounded text-gray-400 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Dropdown */}
        {open && !disabled && (
          <div className="absolute z-50 mt-1 w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg max-h-72 overflow-hidden flex flex-col">
            {/* Instructions when multi */}
            {multiple && (
              <div className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                {maxSelectionLength
                  ? `Select up to ${maxSelectionLength} option(s)`
                  : "Select one or more options"}
              </div>
            )}

            {/* Search */}
            {isSearchable && (
              <div className="relative border-b border-gray-200 dark:border-gray-700">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
                />
              </div>
            )}

            {/* Options */}
            <div className="overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No options
                </p>
              ) : (
                filtered.map((opt) => {
                  const optVal = opt.value ?? opt.id;
                  const isSel = selectedValues.includes(optVal);
                  const isDisabled = opt.disabled;
                  const isMax =
                    multiple &&
                    maxSelectionLength &&
                    !isSel &&
                    selectedValues.length >= maxSelectionLength;

                  return (
                    <button
                      key={optVal}
                      type="button"
                      disabled={isDisabled || isMax}
                      onClick={() => toggleOption(optVal)}
                      className={`
                        w-full flex items-start gap-2 px-3 py-2 text-left text-sm transition-colors
                        ${
                          isSel
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60"
                        }
                        ${isDisabled || isMax ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      <span className="w-4 h-4 shrink-0 mt-0.5 flex items-center justify-center">
                        {isSel && <Check className="w-4 h-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{opt.label || opt.name}</span>
                        {opt.description && (
                          <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {opt.description}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}