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
  saveUser,
  updateUser,
  deleteUser,
} from "../../services/userServices";

import { fetchUserTypes } from "../../services/MenuServices";
import {
  fetchCompanies,
  fetchCompanyById,
} from "../../services/companyServices";
import { useAuth } from "../../context/AuthContext";

export default function Users() {
  // =====================================================
  // AUTH
  // =====================================================
  const { user } = useAuth();
  const isSuperAdmin =
    Array.isArray(user?.roles) && user.roles.includes("super_admin");

  // =====================================================
  // STATE
  // =====================================================
  const [users, setUsers] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [companies, setCompanies] = useState([]);       // companies the user created
  const [ownCompany, setOwnCompany] = useState(null);   // the user's own company (via user.company_id)
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal mode: "create" | "edit" | null
  const [modalMode, setModalMode] = useState(null);
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
    company_id: "",
    user_type_id: "",
    status: 1,
  });

  // =====================================================
  // DERIVED — which mode does the company field use?
  // =====================================================
  // Case A: user created at least one company → normal dropdown
  // Case B: user created none, but has an own company → locked to own company
  // Case C: user created none and has no own company → optional, empty
  const hasOwnCompanies = companies.length > 0;
  const companyLocked = !hasOwnCompanies && !!ownCompany;

  // =====================================================
  // LOAD
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

  const loadUserTypes = async () => {
    try {
      const res = await fetchUserTypes(
        isSuperAdmin ? {} : { onlyMine: true }
      );
      setUserTypes(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load user types.");
    }
  };

  const loadCompanies = async () => {
    try {
      const res = await fetchCompanies(!isSuperAdmin);
      setCompanies(res.data || []);

      // Also fetch the user's own company (from user.company_id)
      if (user?.company_id) {
        try {
          const own = await fetchCompanyById(user.company_id);
          setOwnCompany(own?.data || null);
        } catch {
          setOwnCompany(null);
        }
      } else {
        setOwnCompany(null);
      }
    } catch (err) {
      showErrorToast(err.message || "Failed to load companies.");
    }
  };

  useEffect(() => {
    loadUsers();
    loadUserTypes();
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================================
  // TABLE COLUMNS
  // =====================================================
  const columns = [
    { key: "sl",        header: "SL",        width: 60 },
    { key: "name",      header: "Name" },
    { key: "email",     header: "Email" },
    { key: "username",  header: "Username" },
    { key: "company",   header: "Company" },
    { key: "user_type", header: "User Type" },
    { key: "status",    header: "Status" },
    { key: "actions",   header: "Actions" },
  ];

  // =====================================================
  // ROW DATA
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
        company_id: u.company_id,
        user_type_id: u.user_type_id,
        status: u.status,
      };

      return {
        ...u,
        sl: idx + 1,
        name: u.name || "-",
        email: u.email || "-",
        username: u.username || "-",
        company: u.company?.name || "—",
        user_type: u.user_type?.name || "—",
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
      company_id: "",
      user_type_id: "",
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

    if (modalMode === "create") {
      if (!form.password) errs.password = "Password is required";
      else if (form.password.length < 6)
        errs.password = "Password must be at least 6 characters";
      if (!form.user_type_id) errs.user_type_id = "User type is required";
      // company_id is NOT required — user can create without a company
    } else {
      if (form.password && form.password.length < 6)
        errs.password = "Password must be at least 6 characters";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // =====================================================
  // OPEN MODALS
  // =====================================================
  const openCreateModal = async () => {
    setModalMode("create");
    setEditRow(null);
    resetForm();

    // If the user created no companies but has their own,
    // resolve it (using cache first, then fetching) so the locked
    // field has a valid company_id to send.
    if (!hasOwnCompanies && user?.company_id) {
      let company = ownCompany;
      if (!company) {
        try {
          const res = await fetchCompanyById(user.company_id);
          company = res?.data || null;
          setOwnCompany(company);
        } catch {
          company = null;
        }
      }
      if (company) {
        setForm((prev) => ({
          ...prev,
          company_id: String(company.id),
        }));
      }
    }

    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setModalMode("edit");
    setEditRow(row);
    setForm({
      id: row.id,
      name: row.name || "",
      email: row.email || "",
      username: row.username || "",
      password: "",
      company_id: row.company_id ?? "",
      user_type_id: row.user_type_id ?? "",
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
  // SAVE (create or update)
  // =====================================================
  const handleSave = async () => {
    if (!validateForm()) {
      showErrorToast("Please fix the highlighted fields");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (modalMode === "create") {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          username: form.username.trim(),
          password: form.password,
          user_type_id: Number(form.user_type_id),
          status: Number(form.status),
        };

        // Only send company_id if we actually have one (dropdown pick
        // OR locked auto-fill). Empty string → omit → user has no company.
        if (form.company_id) {
          payload.company_id = Number(form.company_id);
        }

        await saveUser(payload);
        showSuccessToast("User created successfully");
      } else {
        const payload = {
          id: form.id,
          name: form.name.trim(),
          email: form.email.trim(),
          username: form.username.trim(),
          status: Number(form.status),
        };

        if (form.company_id) {
          payload.company_id = Number(form.company_id);
        }
        if (form.user_type_id) {
          payload.user_type_id = Number(form.user_type_id);
        }
        if (form.password.trim()) {
          payload.password = form.password;
        }

        await updateUser(payload);
        showSuccessToast("User updated successfully");
      }

      closeModal();
      await loadUsers();
    } catch (err) {
      const msg =
        err.message ||
        (modalMode === "create"
          ? "Failed to create user"
          : "Failed to update user");
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

  // "No company" is a valid choice
  const companyOptions = useMemo(
    () => [
      { value: "", label: "— No company —" },
      ...companies.map((c) => ({ value: String(c.id), label: c.name })),
    ],
    [companies]
  );

  const typeOptions = useMemo(
    () => [
      { value: "", label: "— Select a user type —" },
      ...userTypes.map((t) => ({
        value: String(t.id),
        label: t.company?.name ? `${t.name} (${t.company.name})` : t.name,
      })),
    ],
    [userTypes]
  );

  const modalTitle = modalMode === "create" ? "Add User" : "Edit User";

  const modalSubtitle =
    modalMode === "create"
      ? "Create a new user"
      : editRow?.name;

  const modalIcon = modalMode === "create" ? Plus : Pencil;

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
            text: "Add User",
            icon: Plus,
            color: "primary",
            onClick: openCreateModal,
          },
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
          emptyHint="Click 'Add User' to create your first user."
        />
      </CardBox>

      {/* ─── Add / Edit User Modal ─── */}
      <AppModal
        show={modalOpen}
        onHide={closeModal}
        title={modalTitle}
        subtitle={modalSubtitle}
        icon={modalIcon}
        size="lg"
        footer={
          <LoadingButton
            isLoading={saving}
            text={modalMode === "create" ? "Create User" : "Save Changes"}
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
            placeholder={
              modalMode === "create"
                ? "Min 6 characters"
                : "Leave blank to keep current"
            }
            icon={Lock}
            required={modalMode === "create"}
            error={errors.password}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Company field — three states:
                - locked  : user created no companies, but has an own company
                - dropdown: user created companies → optional, can also pick "No company"
            */}
            {companyLocked ? (
              <div className="form-group">
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company
                </label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                  <span className="truncate">
                    {ownCompany?.name || "—"}
                  </span>
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <small className="block mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Auto-selected from your account.
                </small>
              </div>
            ) : (
              <SelectInput
                label="Company"
                name="company_id"
                value={form.company_id}
                onChange={(e) => setField("company_id", e.target.value)}
                options={companyOptions}
                error={errors.company_id}
              />
            )}

            <SelectInput
              label="User Type"
              name="user_type_id"
              value={form.user_type_id}
              onChange={(e) => setField("user_type_id", e.target.value)}
              options={typeOptions}
              required={modalMode === "create"}
              error={errors.user_type_id}
            />
          </div>

          <SelectInput
            label="Status"
            name="status"
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
            options={statusOptions}
          />

          <AlertMessage
            type="info"
            message={
              modalMode === "create"
                ? companyLocked
                  ? "This user will be attached to your company."
                  : "You can create a user with no company by leaving the Company field empty."
                : "Leave password blank to keep the current one."
            }
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