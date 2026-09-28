// src/pages/Forbidden.jsx
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] p-6">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Access denied
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          You don't have permission to view this page. Contact your
          administrator if you think this is a mistake.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}