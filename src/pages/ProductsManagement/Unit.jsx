// src/pages/UnitManagement/Unit.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Scale,
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
import SelectInput from "../../components/SelectInput";
import LoadingButton from "../../components/LoadingButton";
import DataTable from "../../components/DataTable";

import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from "../../Helper/TosterHelper";

import {
  fetchUnits,
  saveUnit,
  updateUnit,
  deleteUnit,
} from "../../services/unitServices";

import { useAuth } from "../../context/AuthContext";

// ─── Unit types (mirror backend Unit::TYPES) ──────────────
const UNIT_TYPE_OPTIONS = [
  { value: "count",  label: "Count (pcs, box, dozen)" },
  { value: "weight", label: "Weight (kg, g, ton)" },
  { value: "volume", label: "Volume (L, ml)" },
  { value: "length", label: "Length (m, cm, ft)" },
  { value: "area",   label: "Area (sqm, sqft)" },
  { value: "other",  label: "Other" },
];

const STATUS_OPTIONS = [
  { value: 1, label: "Active" },
  { value: 0, label: "Inactive" },
];

export default function Unit() {
  const { user } = useAuth();
  const myCompanyId = user?.company_id ?? null;

  const [units, setUnits] = useState([]);
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

  // Form — company_id comes from auth
  const [form, setForm] = useState({
    id: 0,
    name: "",
    short_name: "",
    unit_type: "count",
    allow_decimal: false,
    status: 1,
  });

  // ─── LOAD ────────────────────────────────────────────
  const loadUnits = async () => {
    setLoading(true);
    try {
      const res = await fetchUnits();
      setUnits(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load units.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── TABLE COLUMNS ───────────────────────────────────
  const columns = [
    { key: "sl",            header: "SL",          width: 60 },
    { key: "name",          header: "Name" },
    { key: "short_name",    header: "Short" },
    { key: "unit_type",     header: "Type" },
    { key: "allow_decimal", header: "Decimals" },
    { key: "status",        header: "Status" },
    { key: "actions",       header: "Actions" },
  ];

  // ─── ROW DATA ────────────────────────────────────────
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

    const decimalBadge = (v) =>
      v ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          Yes
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          No
        </span>
      );

    const typeLabel = (t) =>
      UNIT_TYPE_OPTIONS.find((o) => o.value === t)?.label || t || "—";

    return units.map((u, idx) => {
      const rowSnapshot = {
        id: u.id,
        name: u.name,
        short_name: u.short_name,
        unit_type: u.unit_type,
        allow_decimal: u.allow_decimal,
        status: u.status,
      };

      return {
        ...u,
        sl: idx + 1,
        name: u.name || "—",
        short_name: (
          <code className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
            {u.short_name || "—"}
          </code>
        ),
        unit_type: typeLabel(u.unit_type),
        allow_decimal: decimalBadge(u.allow_decimal),
        status: statusBadge(u.status),

        actions: (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openEditModal(rowSnapshot)}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => askDelete(rowSnapshot)}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        ),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, loading]);

  // ─── FORM HELPERS ────────────────────────────────────
  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
    if (formError) setFormError("");
  };

  const resetForm = () => {
    setForm({
      id: 0,
      name: "",
      short_name: "",
      unit_type: "count",
      allow_decimal: false,
      status: 1,
    });
    setErrors({});
    setFormError("");
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    else if (form.name.trim().length > 100)
      errs.name = "Name must be 100 characters or less";

    if (!form.short_name.trim()) errs.short_name = "Short name is required";
    else if (form.short_name.trim().length > 20)
      errs.short_name = "Short name must be 20 characters or less";

    if (!form.unit_type) errs.unit_type = "Type is required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── OPEN MODALS ─────────────────────────────────────
  const openCreateModal = () => {
    if (!myCompanyId) {
      showErrorToast("Your account is not linked to a company.");
      return;
    }
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
      short_name: row.short_name || "",
      unit_type: row.unit_type || "count",
      allow_decimal: !!row.allow_decimal,
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

  // ─── SAVE ────────────────────────────────────────────
  const handleSave = async () => {
    if (!validateForm()) {
      showErrorToast("Please fix the highlighted fields");
      return;
    }
    if (!myCompanyId) {
      const msg = "Your account is not linked to a company.";
      setFormError(msg);
      showErrorToast(msg);
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const payload = {
        company_id: Number(myCompanyId),
        name: form.name.trim(),
        short_name: form.short_name.trim(),
        unit_type: form.unit_type,
        allow_decimal: form.allow_decimal ? 1 : 0,
        status: Number(form.status),
      };

      if (modalMode === "edit" && form.id) {
        await updateUnit({ id: form.id, ...payload });
        showSuccessToast("Unit updated successfully");
      } else {
        await saveUnit(payload);
        showSuccessToast("Unit created successfully");
      }

      closeModal();
      await loadUnits();
    } catch (err) {
      const msg = err.message || "Failed to save";
      setFormError(msg);
      showErrorToast(msg);
    } finally {
      setSaving(false);
    }
  };

  // ─── DELETE ──────────────────────────────────────────
  const askDelete = (row) => {
    setConfirmRow(row);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!confirmRow?.id) return;
    setConfirmBusy(true);
    try {
      await deleteUnit(confirmRow.id);
      showSuccessToast(`"${confirmRow.name}" deleted`);
      setConfirmOpen(false);
      setConfirmRow(null);
      await loadUnits();
    } catch (err) {
      showErrorToast(err.message || "Failed to delete");
    } finally {
      setConfirmBusy(false);
    }
  };

  // ─── MODAL DERIVED ───────────────────────────────────
  const modalTitle = modalMode === "edit" ? "Edit Unit" : "Add Unit";
  const modalSubtitle =
    modalMode === "edit" ? editRow?.name || "" : "Create a new unit";

  // ─── RENDER ──────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Units"
        icon={Scale}
        breadcrumb
        onClickGuide={() => showInfoToast("Opening guide...")}
      />

      <CardBox
        title="My Units"
        subTitle={`${units.length} item(s)`}
        icon={Scale}
        headerBgColor="light"
        buttons={[
          {
            text: "Add Unit",
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
              loadUnits();
            },
          },
        ]}
      >
        <DataTable
          data={tableData}
          columns={columns}
          loading={loading}
          searchable
          searchPlaceholder="Search units..."
          sortable
          paginated
          initialPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          striped
          stickyHeader
          emptyMessage="No units yet"
          emptyHint="Click 'Add Unit' to create your first one."
        />
      </CardBox>

      {/* ─── Add / Edit Modal ─── */}
      <AppModal
        show={modalOpen}
        onHide={closeModal}
        title={modalTitle}
        subtitle={modalSubtitle}
        icon={modalMode === "edit" ? Pencil : Plus}
        size="lg"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="Unit Name"
              name="name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Kilogram"
              required
              error={errors.name}
            />

            <TextInput
              label="Short Name"
              name="short_name"
              value={form.short_name}
              onChange={(e) => setField("short_name", e.target.value)}
              placeholder="e.g. kg"
              required
              error={errors.short_name}
            />
          </div>

          <SelectInput
            label="Unit Type"
            name="unit_type"
            value={form.unit_type}
            onChange={(e) => setField("unit_type", e.target.value)}
            options={UNIT_TYPE_OPTIONS}
            required
            error={errors.unit_type}
          />

          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <input
              id="allow_decimal"
              type="checkbox"
              checked={form.allow_decimal}
              onChange={(e) => setField("allow_decimal", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="allow_decimal" className="text-sm text-gray-700 dark:text-gray-200">
              <span className="font-medium">Allow decimal quantities</span>
              <br />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Turn on for weight/volume/length (e.g. 1.5 kg). Leave off for count units like pieces.
              </span>
            </label>
          </div>

          <SelectInput
            label="Status"
            name="status"
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
            options={STATUS_OPTIONS}
          />

          <AlertMessage
            type="info"
            message="Units are scoped to your company. Short names must be unique within the company."
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
          This action cannot be undone.
        </p>
      </AppModal>
    </div>
  );
}