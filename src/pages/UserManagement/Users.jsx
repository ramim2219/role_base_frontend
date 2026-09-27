// src/pages/Users.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Users as UsersIcon,
  Plus,
  Pencil,
  Trash2,
  Save,
  AlertTriangle,
  RefreshCw,
  Mail,
  User as UserIcon,
  Lock,
} from "lucide-react";

import PageHeader from "../../components/PageHeader";
import CardBox from "../../components/CardBox";
import AppModal from "../../components/AppModal";
import AlertMessage from "../../components/AlertMessage";
import TextInput from "../../components/TextInput";
import SelectInput from "../../components/SelectInput";
import LoadingButton from "../../components/LoadingButton";
import DataTable from "../../components/DataTable";

import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from "../../Helper/TosterHelper";

import {
  fetchMyUsers,
  updateUser,
  deleteUser,
} from "../../services/userServices";

export default function Users() {
  // =====================================================
  // STATE
  // =====================================================
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit modal
  const [modalMode, setModalMode] = useState(null); // "edit" | null
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState({});

  // Confirm-delete modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmRow, setConfirmRow] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Form state
  const [form, setForm] = useState({
    id: 0,
    name: "",
    email: "",
    username: "",
    password: "",
    status: 1,
  });

  // =====================================================
  // LOAD USERS
  // =====================================================
  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchMyUsers();
      setUsers(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // =====================================================
  // TABLE COLUMNS
  // =====================================================
  const columns = [
    { key: "sl",       header: "SL",     width: 60 },
    { key: "name",     header: "Name" },
    { key: "email",    header: "Email" },
    { key: "username", header: "Username" },
    { key: "status",   header: "Status" },
    { key: "actions",  header: "Actions" },
  ];

  // =====================================================
  // ROW DATA (with status badge + action buttons)
  // =====================================================
  const tableData = useMemo(() => {
    const statusBadge = (s) => {
      const active = Number(s) === 1;
      return (
        <span
          style={{
            display: "inline-block",
            minWidth: 78,
            textAlign: "center",
            padding: "4px 10px",
            borderRadius: 999,
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: active ? "#28a745" : "#dc3545",
          }}
        >
          {active ? "Active" : "Inactive"}
        </span>
      );
    };

    return users.map((u, idx) => {
      const rowSnapshot = {
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        status: u.status,
      };

      return {
        ...u,
        sl: idx + 1,
        name: u.name || "-",
        email: u.email || "-",
        username: u.username || "-",
        status: statusBadge(u.status),

        actions: (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openEditModal(rowSnapshot)}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-amber-500 text-amber-600 hover:bg-amber-50 disabled:opacity-50"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => askDelete(rowSnapshot)}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        ),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, loading]);

  // =====================================================
  // FORM HELPERS
  // =====================================================
  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
    if (formError) setFormError("");
  };

  const resetForm = () => {
    setForm({
      id: 0,
      name: "",
      email: "",
      username: "",
      password: "",
      status: 1,
    });
    setErrors({});
    setFormError("");
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Invalid email";
    if (!form.username.trim()) errs.username = "Username is required";
    if (form.password && form.password.length < 6)
      errs.password = "Password must be at least 6 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // =====================================================
  // OPEN MODALS
  // =====================================================
  const openEditModal = (row) => {
    setModalMode("edit");
    setEditRow(row);
    setForm({
      id: row.id,
      name: row.name || "",
      email: row.email || "",
      username: row.username || "",
      password: "",
      status: Number(row.status) === 1 ? 1 : 0,
    });
    setErrors({});
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalMode(null);
    setEditRow(null);
    resetForm();
  };

  // =====================================================
  // SAVE (update only)
  // =====================================================
  const handleSave = async () => {
    if (!validateForm()) {
      showErrorToast("Please fix the highlighted fields");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const payload = {
        id: form.id,
        name: form.name.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        status: Number(form.status),
      };

      // Only send password if the user typed one
      if (form.password.trim()) {
        payload.password = form.password;
      }

      await updateUser(payload);
      showSuccessToast("User updated successfully");

      closeModal();
      await loadUsers();
    } catch (err) {
      const msg = err.message || "Failed to update user";
      setFormError(msg);
      showErrorToast(msg);
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================
  const askDelete = (row) => {
    setConfirmRow(row);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!confirmRow?.id) return;
    setConfirmBusy(true);
    try {
      await deleteUser(confirmRow.id);
      showSuccessToast(`"${confirmRow.name}" deleted`);
      setConfirmOpen(false);
      setConfirmRow(null);
      await loadUsers();
    } catch (err) {
      showErrorToast(err.message || "Failed to delete user");
    } finally {
      setConfirmBusy(false);
    }
  };

  // =====================================================
  // OPTIONS
  // =====================================================
  const statusOptions = [
    { value: 1, label: "Active" },
    { value: 0, label: "Inactive" },
  ];

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div>
      <PageHeader
        title="Users"
        icon={UsersIcon}
        breadcrumb
        onClickGuide={() => showInfoToast("Opening guide...")}
      />

      <CardBox
        title="My Users"
        subTitle={`${users.length} user(s)`}
        icon={UsersIcon}
        headerBgColor="light"
        buttons={[
          {
            text: "Refresh",
            icon: RefreshCw,
            color: "secondary",
            onClick: () => {
              showInfoToast("Refreshing...");
              loadUsers();
            },
          },
        ]}
      >
        <DataTable
          data={tableData}
          columns={columns}
          loading={loading}
          searchable
          searchPlaceholder="Search users..."
          sortable
          paginated
          initialPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          striped
          stickyHeader
          emptyMessage="No users yet"
          emptyHint="Users you create will appear here."
        />
      </CardBox>

      {/* ─── Edit User Modal ─── */}
      <AppModal
        show={modalOpen}
        onHide={closeModal}
        title="Edit User"
        subtitle={editRow?.name}
        icon={Pencil}
        size="lg"
        footer={
          <LoadingButton
            isLoading={saving}
            text="Save Changes"
            icon={Save}
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold uppercase transition-colors disabled:opacity-60"
          />
        }
      >
        <div className="space-y-4">
          {formError && <AlertMessage type="danger" message={formError} />}

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <TextInput
              label="Username"
              name="username"
              value={form.username}
              onChange={(e) => setField("username", e.target.value)}
              placeholder="john_doe"
              required
              error={errors.username}
            />
          </div>

          <TextInput
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={(e) => setField("password", e.target.value)}
            placeholder="Leave blank to keep current"
            icon={Lock}
            error={errors.password}
          />

          <SelectInput
            label="Status"
            name="status"
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
            options={statusOptions}
          />

          <AlertMessage
            type="info"
            message="Leave password blank to keep the current one."
          />
        </div>
      </AppModal>

      {/* ─── Confirm Delete ─── */}
      <AppModal
        show={confirmOpen}
        onHide={() => setConfirmOpen(false)}
        title="Confirm Delete"
        subtitle={confirmRow ? `Delete "${confirmRow.name}"?` : ""}
        icon={AlertTriangle}
        size="sm"
        footer={
          <LoadingButton
            isLoading={confirmBusy}
            text="Delete"
            icon={Trash2}
            onClick={confirmDelete}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold uppercase transition-colors disabled:opacity-60"
          />
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          This action cannot be undone. The user will lose access immediately.
        </p>
      </AppModal>
    </div>
  );
}