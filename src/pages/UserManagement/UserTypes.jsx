// src/pages/UserType.jsx
import { useEffect, useMemo, useState } from "react";
import {
  UserCog,
  Plus,
  Pencil,
  Trash2,
  Save,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import PageHeader from "../../components/PageHeader";
import CardBox from "../../components/CardBox";
import AppModal from "../../components/AppModal";
import AlertMessage from "../../components/AlertMessage";
import TextInput from "../../components/TextInput";
import LoadingButton from "../../components/LoadingButton";
import DataTable from "../../components/DataTable";

import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from "../../Helper/TosterHelper";

import {
  saveUserType,
  updateUserType,
  deleteUserType,
} from "../../services/userTypeServices";

import { fetchUserTypesByCreator } from "../../services/userServices";
import { useAuth } from "../../context/AuthContext";

export default function UserType() {
  // =====================================================
  // AUTH
  // =====================================================
  const { user } = useAuth();
  const myCompanyId = user?.company_id ?? null;

  const isSuperAdmin =
    Array.isArray(user?.roles) && user.roles.includes("super_admin");

  // =====================================================
  // STATE
  // =====================================================
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [modalMode, setModalMode] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmRow, setConfirmRow] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const [form, setForm] = useState({ id: 0, name: "" });

  // =====================================================
  // LOAD — only types created by the current user
  // =====================================================
  const loadTypes = async () => {
    setLoading(true);
    try {
      // No arg → backend defaults to the current user's id
      const res = await fetchUserTypesByCreator();
      setTypes(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load user types.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================================
  // TABLE COLUMNS
  // =====================================================
  const columns = [
    { key: "sl",        header: "SL",       width: 60 },
    { key: "name",      header: "Name" },
    { key: "company",   header: "Company" },
    { key: "createdAt", header: "Created" },
    { key: "actions",   header: "Actions" },
  ];

  // =====================================================
  // ROW DATA
  // =====================================================
  const tableData = useMemo(() => {
    const formatDate = (v) => {
      if (!v) return "-";
      const d = new Date(v);
      return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
    };

    return types.map((t, idx) => {
      const rowSnapshot = {
        id: t.id,
        name: t.name,
        company_id: t.company_id,
      };

      return {
        ...t,
        sl: idx + 1,
        name: t.name || "-",
        company: t.company?.name || (isSuperAdmin ? "Global" : "—"),
        createdAt: formatDate(t.created_at),

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
  }, [types, loading, isSuperAdmin]);

  // =====================================================
  // FORM HELPERS
  // =====================================================
  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
    if (formError) setFormError("");
  };

  const resetForm = () => {
    setForm({ id: 0, name: "" });
    setErrors({});
    setFormError("");
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    else if (form.name.trim().length > 100)
      errs.name = "Name must be 100 characters or less";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // =====================================================
  // OPEN MODALS
  // =====================================================
  const openCreateModal = () => {
    setModalMode("create");
    setEditRow(null);
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setModalMode("edit");
    setEditRow(row);
    setForm({
      id: row.id,
      name: row.name || "",
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
  // SAVE
  // — super admin: company_id = null (global types)
  // — regular user: company_id = their own company
  // =====================================================
  const handleSave = async () => {
    if (!validateForm()) {
      showErrorToast("Please fix the highlighted fields");
      return;
    }

    if (!isSuperAdmin && !myCompanyId) {
      const msg =
        "Your account is not linked to a company. Contact your administrator.";
      setFormError(msg);
      showErrorToast(msg);
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const payload = {
        name: form.name.trim(),
        company_id: isSuperAdmin ? null : Number(myCompanyId),
      };

      if (modalMode === "edit" && form.id) {
        await updateUserType({ id: form.id, ...payload });
        showSuccessToast("User type updated successfully");
      } else {
        await saveUserType(payload);
        showSuccessToast("User type created successfully");
      }

      closeModal();
      await loadTypes();
    } catch (err) {
      const msg = err.message || "Failed to save";
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
      await deleteUserType(confirmRow.id);
      showSuccessToast(`"${confirmRow.name}" deleted`);
      setConfirmOpen(false);
      setConfirmRow(null);
      await loadTypes();
    } catch (err) {
      showErrorToast(err.message || "Failed to delete");
    } finally {
      setConfirmBusy(false);
    }
  };

  // =====================================================
  // MODAL DERIVED VALUES
  // =====================================================
  const modalTitle =
    modalMode === "edit" ? "Edit User Type" : "Add User Type";

  const modalSubtitle =
    modalMode === "edit"
      ? editRow?.name || ""
      : isSuperAdmin
      ? "Create a global user type"
      : "Create a user type for your company";

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div>
      <PageHeader
        title="User Types"
        icon={UserCog}
        breadcrumb
        onClickGuide={() => showInfoToast("Opening guide...")}
      />

      <CardBox
        title="My User Types"
        subTitle={`${types.length} item(s)`}
        icon={UserCog}
        headerBgColor="light"
        buttons={[
          {
            text: "Add User Type",
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
              loadTypes();
            },
          },
        ]}
      >
        <DataTable
          data={tableData}
          columns={columns}
          loading={loading}
          searchable
          searchPlaceholder="Search user types..."
          sortable
          paginated
          initialPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          striped
          stickyHeader
          emptyMessage="No user types yet"
          emptyHint="Click 'Add User Type' to create your first one."
        />
      </CardBox>

      {/* ─── Add / Edit Modal ─── */}
      <AppModal
        show={modalOpen}
        onHide={closeModal}
        title={modalTitle}
        subtitle={modalSubtitle}
        icon={modalMode === "edit" ? Pencil : Plus}
        size="md"
        footer={
          <LoadingButton
            isLoading={saving}
            text={modalMode === "edit" ? "Save Changes" : "Create"}
            icon={Save}
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold uppercase transition-colors disabled:opacity-60"
          />
        }
      >
        <div className="space-y-4">
          {formError && <AlertMessage type="danger" message={formError} />}

          <TextInput
            label="Name"
            name="name"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="e.g. Manager"
            required
            error={errors.name}
          />

          <AlertMessage
            type="info"
            message={
              isSuperAdmin
                ? "As a super admin, this type will be created as a global type (not tied to any company)."
                : "This user type will be created under your company automatically."
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
          This action cannot be undone. It will fail if any user is still
          assigned to this user type.
        </p>
      </AppModal>
    </div>
  );
}