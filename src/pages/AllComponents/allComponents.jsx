// src/pages/AllComponents.jsx
import { useState } from "react";
import DataTable from "../components/DataTable";
import CardBox from "../components/CardBox";
import CustomButton from "../components/CustomButton";
import AppModal from "../components/AppModal";
import AlertMessage from "../components/AlertMessage";
import Checkbox from "../components/Checkbox";
import TextInput from "../components/TextInput";
import TextArea from "../components/TextArea";
import SelectInput from "../components/SelectInput";
import Select2 from "../components/Select2";
import RadioButton from "../components/RadioButton";
import LoadingButton from "../components/LoadingButton";
import PageHeader from "../components/PageHeader";

import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  showWarningToast,
} from "../Helper/TosterHelper";

import {
  Users as UsersIcon,
  ShoppingBag,
  DollarSign,
  RotateCcw,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Heart,
  Share2,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  Save,
  FileText,
  RefreshCw,
  Bell,
  Mail,
  User as UserIcon,
  Lock,
  Briefcase,
  AlertTriangle,
  Component,
} from "lucide-react";

// ============================================================
// SAMPLE DATA
// ============================================================
const users = [
  { id: 1,  name: "John Doe",      email: "john@example.com",    role: "Admin",  status: "Active",   joined: "2024-01-12" },
  { id: 2,  name: "Sarah Johnson", email: "sarah@example.com",   role: "Editor", status: "Active",   joined: "2024-02-03" },
  { id: 3,  name: "Michael Chen",  email: "michael@example.com", role: "Viewer", status: "Inactive", joined: "2024-02-20" },
  { id: 4,  name: "Priya Patel",   email: "priya@example.com",   role: "Editor", status: "Active",   joined: "2024-03-05" },
  { id: 5,  name: "David Kim",     email: "david@example.com",   role: "Admin",  status: "Active",   joined: "2024-03-18" },
  { id: 6,  name: "Emma Wilson",   email: "emma@example.com",    role: "Viewer", status: "Inactive", joined: "2024-04-01" },
  { id: 7,  name: "Liam Brown",    email: "liam@example.com",    role: "Editor", status: "Active",   joined: "2024-04-15" },
  { id: 8,  name: "Olivia Davis",  email: "olivia@example.com",  role: "Viewer", status: "Active",   joined: "2024-05-02" },
  { id: 9,  name: "Noah Garcia",   email: "noah@example.com",    role: "Editor", status: "Inactive", joined: "2024-05-20" },
  { id: 10, name: "Ava Martinez",  email: "ava@example.com",     role: "Admin",  status: "Active",   joined: "2024-06-11" },
];

const projects = [
  {
    id: 1,
    name: "Project Alpha",
    updated: "Updated 2h ago",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
    tasks: 12,
    members: 5,
  },
  {
    id: 2,
    name: "Project Beta",
    updated: "Updated 5h ago",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
    tasks: 8,
    members: 3,
  },
  {
    id: 3,
    name: "Project Gamma",
    updated: "Yesterday",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
    tasks: 21,
    members: 7,
  },
];

// ============================================================
// ALL COMPONENTS
// ============================================================
export default function AllComponents() {
  const [rows, setRows] = useState(users);

  // Checkbox state (Preferences card)
  const [agreed, setAgreed] = useState(false);
  const [remember, setRemember] = useState(true);

  // ---- Edit/Create modal state ----
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalEmpty, setModalEmpty] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [saving, setSaving] = useState(false);

  // ---- Confirm-delete modal state ----
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmRow, setConfirmRow] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // ---------- Form state (edit modal) ----------
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    status: "Active",
    department: "",
    skills: [],
    bio: "",
    notify: true,
    plan: "free",
  });
  const [errors, setErrors] = useState({});

  // ---------- DataTable columns ----------
  const columns = [
    { key: "name",   header: "Name",   sortable: true },
    { key: "email",  header: "Email",  sortable: true },
    { key: "role",   header: "Role",   sortable: true },
    { key: "status", header: "Status", sortable: true },
    { key: "joined", header: "Joined", sortable: true, align: "right" },
  ];

  // ---------- Delete handlers ----------
  const askDelete = (row) => {
    setConfirmRow(row);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!confirmRow) return;
    setConfirmBusy(true);
    setTimeout(() => {
      setRows((prev) => prev.filter((r) => r.id !== confirmRow.id));
      showSuccessToast(`${confirmRow.name} deleted`);
      setConfirmBusy(false);
      setConfirmOpen(false);
      setConfirmRow(null);
    }, 600);
  };

  // ---------- Edit/Create modal helpers ----------
  const openEditModal = (row) => {
    setEditRow(row);
    setModalEmpty(false);
    setModalLoading(true);
    setModalOpen(true);
    setErrors({});

    setTimeout(() => {
      setForm({
        name: row.name || "",
        email: row.email || "",
        password: "",
        role: row.role || "",
        status: row.status || "Active",
        department: "Engineering",
        skills: ["React", "Node"],
        bio: "Product manager with 5 years of experience.",
        notify: true,
        plan: "pro",
      });
      setModalLoading(false);
    }, 700);
  };

  const openEmptyModal = () => {
    setEditRow(null);
    setModalLoading(false);
    setModalEmpty(true);
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditRow({ name: "New User", email: "" });
    setModalLoading(false);
    setModalEmpty(false);
    setModalOpen(true);
    setErrors({});
    setForm({
      name: "",
      email: "",
      password: "",
      role: "",
      status: "Active",
      department: "",
      skills: [],
      bio: "",
      notify: true,
      plan: "free",
    });
  };

  // ---------- Form helper ----------
  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  // ---------- Validation + save ----------
  const handleSaveModal = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Invalid email";
    if (!form.role) errs.role = "Role is required";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showErrorToast("Please fix the highlighted fields");
      return;
    }

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setModalOpen(false);
      showSuccessToast("Changes saved successfully");
    }, 1200);
  };

  // ---------- Static option lists ----------
  const roleOptions = [
    { value: "Admin",  label: "Admin" },
    { value: "Editor", label: "Editor" },
    { value: "Viewer", label: "Viewer" },
  ];

  const departmentOptions = [
    { value: "Engineering", label: "Engineering" },
    { value: "Design",      label: "Design" },
    { value: "Marketing",   label: "Marketing" },
    { value: "Sales",       label: "Sales" },
    { value: "Support",     label: "Support" },
  ];

  const skillOptions = [
    { value: "React",      label: "React" },
    { value: "Node",       label: "Node.js" },
    { value: "TypeScript", label: "TypeScript" },
    { value: "Python",     label: "Python" },
    { value: "Go",         label: "Go" },
    { value: "Docker",     label: "Docker" },
    { value: "AWS",        label: "AWS" },
  ];

  return (
    <div>
      {/* ============================================================
          PAGE HEADER
      ============================================================ */}
      <PageHeader
        title="All Components"
        icon={Component}
        breadcrumb
        onClickGuide={() => showInfoToast("Opening component showcase...")}
      />

      {/* ============================================================
          ALERT MESSAGES
      ============================================================ */}
      <div className="space-y-2 mb-8">
        <AlertMessage
          type="info"
          message="New update available. Refresh to see the latest features."
          onClose={() => showInfoToast("Dismissed")}
        />
        <AlertMessage
          type="success"
          message="Your profile has been updated successfully."
        />
        <AlertMessage
          type="warning"
          message="Your session will expire in 5 minutes."
        />
        <AlertMessage
          type="danger"
          message="Failed to connect to the server. Please try again."
        />
      </div>

      {/* ============================================================
          TOAST BUTTONS
      ============================================================ */}
      <div className="flex flex-wrap gap-3 mb-8">
        <CustomButton
          title="Success toast"
          color="success"
          logo={Bell}
          onClick={() => showSuccessToast("User created successfully!")}
        />
        <CustomButton
          title="Error toast"
          color="danger"
          logo={Bell}
          onClick={() => showErrorToast("Failed to save changes.")}
        />
        <CustomButton
          title="Info toast"
          color="primary"
          logo={Bell}
          onClick={() => showInfoToast("New update available.")}
        />
        <CustomButton
          title="Warning toast"
          color="warning"
          logo={Bell}
          onClick={() => showWarningToast("Your session expires soon.")}
        />
      </div>

      {/* ============================================================
          STAT CARDS
      ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <CardBox
          stat
          title="Users"
          icon={UsersIcon}
          tone="blue"
          value="1,204"
          delta="+8.2%"
          deltaTone="up"
          hoverable
          onClick={() => showInfoToast("Viewing Users")}
          topRightActions={
            <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
              <MoreVertical className="w-4 h-4" />
            </button>
          }
        />

        <CardBox
          stat
          title="Orders"
          icon={ShoppingBag}
          tone="purple"
          value="342"
          delta="+5.1%"
          deltaTone="up"
          hoverable
          onClick={() => showInfoToast("Viewing Orders")}
          topRightActions={
            <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
              <MoreVertical className="w-4 h-4" />
            </button>
          }
        />

        <CardBox
          stat
          title="Revenue"
          icon={DollarSign}
          tone="green"
          value="$24,890"
          delta="+12.4%"
          deltaTone="up"
          hoverable
          topRightActions={
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <TrendingUp className="w-3 h-3" /> Live
            </span>
          }
        />

        <CardBox
          stat
          title="Refunds"
          icon={RotateCcw}
          tone="red"
          value="7"
          delta="-2.3%"
          deltaTone="down"
          hoverable
          topRightActions={
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <TrendingDown className="w-3 h-3" /> Down
            </span>
          }
        />
      </div>

      {/* ============================================================
          TEAM ACTIVITY
      ============================================================ */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          Team Activity
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <CardBox
              title="Team Members"
              subTitle="4 active"
              icon={UsersIcon}
              headerBgColor="light"

              buttons={[
                {
                  text: "Add",
                  icon: Plus,
                  color: "primary",
                  onClick: openCreateModal,
                },
                {
                  text: "Export",
                  icon: Download,
                  color: "secondary",
                  onClick: () => showInfoToast("Exporting..."),
                },
              ]}

              showDropdown
              dropdownButtonText="More"
              dropdownButtonColor="secondary"
              dropdownItems={[
                {
                  text: "Refresh",
                  icon: RefreshCw,
                  onClick: () => showInfoToast("Refreshed"),
                },
                {
                  text: "Export CSV",
                  icon: Download,
                  onClick: () => showInfoToast("Exported"),
                },
                {
                  text: "Delete all",
                  icon: Trash2,
                  onClick: () => showErrorToast("Cannot delete all"),
                },
              ]}

              footer="Last updated 2 minutes ago"
              footerButtons={[
                {
                  text: "Save",
                  icon: Save,
                  color: "success",
                  onClick: () => showSuccessToast("Saved"),
                },
                {
                  text: "Cancel",
                  color: "secondary",
                  onClick: () => showInfoToast("Cancelled"),
                },
              ]}
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This card demonstrates header buttons, a dropdown menu, a
                footer with text, and footer buttons — all at once.
              </p>
            </CardBox>
          </div>

          <CardBox
            title="Preferences"
            icon={Save}
            headerBgColor="light"
            footer={
              <CustomButton
                title="Save Preferences"
                color="primary"
                onClick={() => showSuccessToast("Preferences saved")}
                extraClass="w-full"
              />
            }
          >
            <div className="space-y-3">
              <Checkbox
                label="Accept terms and conditions"
                name="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                description="You must accept to continue"
                required
              />
              <Checkbox
                label="Remember me on this device"
                name="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <Checkbox
                label="Email notifications"
                name="notif"
                value="email"
                disabled
                description="Coming soon"
              />
            </div>
          </CardBox>
        </div>
      </div>

      {/* ============================================================
          PROJECT CARDS
      ============================================================ */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          Recent Projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <CardBox
              key={p.id}
              cover={p.image}
              coverHeight="h-44"
              title={p.name}
              subtitle={p.updated}
              hoverable
              topLeftActions={
                <button
                  onClick={() => showSuccessToast(`Liked ${p.name}`)}
                  className="p-1.5 rounded-lg bg-white/90 backdrop-blur hover:bg-white text-gray-700 shadow"
                >
                  <Heart className="w-4 h-4" />
                </button>
              }
              topRightActions={
                <button className="p-1.5 rounded-lg bg-white/90 backdrop-blur hover:bg-white text-gray-700 shadow">
                  <MoreVertical className="w-4 h-4" />
                </button>
              }
              bottomLeftActions={
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-xs font-medium shadow">
                  Live
                </span>
              }
              bottomRightActions={
                <button
                  onClick={() => showInfoToast(`Shared ${p.name}`)}
                  className="p-1.5 rounded-lg bg-white/90 backdrop-blur hover:bg-white text-gray-700 shadow"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              }
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {p.tasks} tasks · {p.members} members
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => showInfoToast(`Viewing ${p.name}`)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => showSuccessToast(`Editing ${p.name}`)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => showErrorToast(`Deleted ${p.name}`)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              }
            >
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                A short description of {p.name} and its current progress.
              </p>
            </CardBox>
          ))}
        </div>
      </div>

      {/* ============================================================
          CARD STATE VARIANTS
      ============================================================ */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          Card States
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardBox title="Loading card" subtitle="Fetching data..." loading />

          <CardBox
            title="Error card"
            error="Failed to load data. Please try again later."
          />

          <CardBox
            empty
            emptyMessage="No projects yet"
            emptyHint="Create your first project to get started."
          />
        </div>
      </div>

      {/* ============================================================
          MODAL DEMO BUTTONS
      ============================================================ */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          Modal Demos
        </h2>
        <div className="flex flex-wrap gap-3">
          <CustomButton
            title="Create User"
            logo={Plus}
            color="success"
            onClick={openCreateModal}
          />
          <CustomButton
            title="Open Edit Modal"
            logo={Pencil}
            color="primary"
            onClick={() => openEditModal(rows[0])}
          />
          <CustomButton
            title="Open Empty Modal"
            logo={FileText}
            color="secondary"
            onClick={openEmptyModal}
          />
        </div>
      </div>

      {/* ============================================================
          DATA TABLE
      ============================================================ */}
      <DataTable
        data={rows}
        columns={columns}
        title="Users"
        description="Manage your team members."

        searchable
        searchPlaceholder="Search users..."
        sortable
        initialSort={{ key: "name", direction: "asc" }}
        paginated
        initialPageSize={5}
        pageSizeOptions={[5, 10, 25, 50]}

        selectable
        bulkActions={(selectedRows, clear) => (
          <button
            onClick={() => {
              const ids = selectedRows.map((r) => r.id);
              setRows((prev) => prev.filter((r) => !ids.includes(r.id)));
              showSuccessToast(`Deleted ${ids.length} user(s)`);
              clear();
            }}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700"
          >
            Delete Selected
          </button>
        )}

        actions={{
          onView:   (row) => showInfoToast(`Viewing ${row.name}`),
          onEdit:   (row) => openEditModal(row),
          onDelete: (row) => askDelete(row),
        }}

        showExport
        exportFilename="users"

        striped
        stickyHeader
        emptyMessage="No users yet"
        emptyHint="Add your first user to get started."
      />

      {/* ============================================================
          EDIT/CREATE MODAL
      ============================================================ */}
      <AppModal
        show={modalOpen}
        onHide={() => setModalOpen(false)}
        title={editRow?.id ? `Edit ${editRow.name}` : "Create User"}
        subtitle={editRow?.id ? editRow.email : "Add a new team member"}
        icon={editRow?.id ? Pencil : Plus}
        size="xl"
        loading={modalLoading}
        empty={modalEmpty}
        emptyMessage="No record selected."
        print
        printDocumentTitle="User Details"
        footer={
          <>
            <CustomButton
              title="Cancel"
              color="secondary"
              onClick={() => setModalOpen(false)}
            />
            <LoadingButton
              isLoading={saving}
              text={editRow?.id ? "Save Changes" : "Create User"}
              icon={Save}
              onClick={handleSaveModal}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold uppercase transition-colors disabled:opacity-60"
            />
          </>
        }
      >
        {!modalEmpty && (
          <div className="space-y-5">
            {/* --- Section: Basic Info --- */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
                Basic Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput
                  label="Full Name"
                  name="name"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="John Doe"
                  icon={UserIcon}
                  required
                  error={errors.name}
                />
                <TextInput
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="you@example.com"
                  icon={Mail}
                  required
                  error={errors.email}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <TextInput
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="••••••••"
                  icon={Lock}
                  error={errors.password}
                />
                <SelectInput
                  label="Role"
                  name="role"
                  value={form.role}
                  onChange={(e) => setField("role", e.target.value)}
                  placeHolder="Choose a role"
                  options={roleOptions}
                  required
                  error={errors.role}
                />
              </div>
            </div>

            {/* --- Section: Work Details --- */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Work Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select2
                  label="Department"
                  name="department"
                  value={form.department}
                  onChange={(v) => setField("department", v)}
                  options={departmentOptions}
                  placeholder="Select a department"
                  isSearchable
                  allowClear
                />
                <Select2
                  label="Skills"
                  name="skills"
                  value={form.skills}
                  onChange={(v) => setField("skills", v)}
                  options={skillOptions}
                  placeholder="Pick up to 3 skills"
                  multiple
                  isSearchable
                  allowClear
                  maxSelectionLength={3}
                />
              </div>

              <TextArea
                label="Bio"
                name="bio"
                value={form.bio}
                onChange={(e) => setField("bio", e.target.value)}
                placeholder="A short bio about this user..."
                rows={3}
                maxLength={200}
                showCount
              />
            </div>

            {/* --- Section: Status (Radio) --- */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
                Account Status
              </h4>
              <RadioButton
                name="status"
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                inline
                options={[
                  { value: "Active",   label: "Active",   description: "Can log in" },
                  { value: "Inactive", label: "Inactive", description: "Suspended" },
                  { value: "Pending",  label: "Pending",  description: "Awaiting approval" },
                ]}
              />
            </div>

            {/* --- Section: Preferences --- */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
                Preferences
              </h4>
              <div className="space-y-3">
                <Checkbox
                  label="Send email notifications"
                  name="notify"
                  checked={form.notify}
                  onChange={(e) => setField("notify", e.target.checked)}
                  description="Receive emails about account activity"
                />
              </div>
            </div>

            <AlertMessage
              type="info"
              message="Changes will be applied immediately after saving."
            />
          </div>
        )}
      </AppModal>

      {/* ============================================================
          CONFIRM-DELETE MODAL
      ============================================================ */}
      <AppModal
        show={confirmOpen}
        onHide={() => setConfirmOpen(false)}
        title="Confirm Delete"
        subtitle={confirmRow ? `Delete ${confirmRow.name}?` : ""}
        icon={AlertTriangle}
        size="sm"
        footer={
          <>
            <CustomButton
              title="Cancel"
              color="secondary"
              onClick={() => setConfirmOpen(false)}
            />
            <LoadingButton
              isLoading={confirmBusy}
              text="Delete"
              icon={Trash2}
              onClick={confirmDelete}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold uppercase transition-colors disabled:opacity-60"
            />
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          This action cannot be undone. Are you sure you want to permanently
          delete this user?
        </p>
      </AppModal>
    </div>
  );
}