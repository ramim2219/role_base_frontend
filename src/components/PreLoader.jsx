import SpinLoader from "./SpinLoader";

/**
 * PreLoader — initial app loading screen.
 * Optionally shows your logo.
 */
export default function PreLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-[9999]">
      <div className="flex flex-col items-center gap-4">
        <img
          src="/assets/images/puc_logo.png"
          alt="Logo"
          height={60}
          width={60}
          className="animate-[spin_2s_linear_infinite]"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Loading...
        </p>
      </div>
    </div>
  );
}

// Alternative: wrap SpinLoader
export function PreLoaderSimple() {
  return <SpinLoader text="Preparing your workspace..." />;
}