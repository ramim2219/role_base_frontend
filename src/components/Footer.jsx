/**
 * Footer — simple copyright footer with version.
 */
export default function Footer({ version = "1.0.0" }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 sm:px-6 py-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
        <p className="text-center sm:text-left">
          Copyright © 2021–{year}{" "}
          <a
            href="https://puc.ac.bd"
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Premier University Software Section
          </a>
          . All rights reserved.
        </p>

        <p className="text-xs">
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Version
          </span>{" "}
          {version}
        </p>
      </div>
    </footer>
  );
}