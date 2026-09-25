import { Loader2 } from "lucide-react";

/**
 * LoadingButton — button with built-in loading state.
 *
 * Props: isLoading, text, icon, className, ...rest
 */
export default function LoadingButton({
  isLoading,
  text,
  icon: Icon,
  className = "px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
  ...props
}) {
  return (
    <button className={className} disabled={isLoading} {...props}>
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin inline-block mr-2 -mt-0.5" />
          Loading...
        </>
      ) : (
        <>
          {Icon && (
            typeof Icon === "string"
              ? <i className={`mr-2 ${Icon}`} />
              : <Icon className="w-4 h-4 inline-block mr-2 -mt-0.5" />
          )}
          {text}
        </>
      )}
    </button>
  );
}