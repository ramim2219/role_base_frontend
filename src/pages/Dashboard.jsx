// src/pages/Dashboard.jsx
import { LayoutDashboard, User as UserIcon, ShieldCheck } from "lucide-react";

import PageHeader from "../components/PageHeader";
import CardBox from "../components/CardBox";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  const isSuperAdmin =
    Array.isArray(user?.roles) && user.roles.includes("super_admin");

  const displayName = user?.name || user?.username || "there";

  return (
    <div>
      <PageHeader
        title="Dashboard"
        icon={LayoutDashboard}
        breadcrumb
      />

      <CardBox
        title={`Welcome back, ${displayName}`}
        subTitle="We're glad to see you again."
        icon={ShieldCheck}
        headerBgColor="light"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            You're signed in as{" "}
            <span className="font-semibold text-gray-800 dark:text-white">
              {user?.name || "a user"}
            </span>
            {user?.email ? ` (${user.email})` : ""}.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            <UserIcon className="w-3.5 h-3.5" />
            {isSuperAdmin ? "Super Admin" : "User"}
          </div>
        </div>
      </CardBox>
    </div>
  );
}