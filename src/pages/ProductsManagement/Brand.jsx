// src/pages/BrandManagement/Brand.jsx
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
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
  fetchBrands,
  saveBrand,
  updateBrand,
  deleteBrand,
} from "../../services/brandServices";

import { fetchCategories } from "../../services/categoryServices";
import { useAuth } from "../../context/AuthContext";

// ─── Logo constraints ─────────────────────────────────────
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_MIME = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
];

const logoUrlFromPath = (p) => {
  if (!p) return "";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api")
    .replace(/\/api\/?$/, "");
  return `${API_ORIGIN}/storage/${p}`;
};

export default function Brand() {
  const { user } = useAuth();
  const myCompanyId = user?.company_id ?? null;

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
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

  // Logo state
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  // Form — company_id + created_by come from auth
  const [form, setForm] = useState({
    id: 0,
    name: "",
    category_id: "",
    status: 1,
  });

  // ─── LOAD ────────────────────────────────────────────
  const loadBrands = async () => {
    setLoading(true);
    try {
      const res = await fetchBrands();
      setBrands(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load brands.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetchCategories({ tree: true });
      setCategories(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load categories.");
    }
  };

  useEffect(() => {
    loadBrands();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── TABLE COLUMNS ───────────────────────────────────
  const columns = [
    { key: "sl",       header: "SL",       width: 60 },
    { key: "logo",     header: "Logo",     width: 70 },
    { key: "name",     header: "Name" },
    { key: "category", header: "Category" },
    { key: "company",  header: "Company" },
    { key: "status",   header: "Status" },
    { key: "actions",  header: "Actions" },
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

    return brands.map((b, idx) => {
      const rowSnapshot = {
        id: b.id,
        name: b.name,
        category_id: b.category_id,
        company_id: b.company_id,
        logo: b.logo,
        status: b.status,
      };

      return {
        ...b,
        sl: idx + 1,
        logo: b.logo ? (
          <img
            src={logoUrlFromPath(b.logo)}
            alt=""
            className="h-8 w-8 object-contain rounded"
            onError={(e) => { e.target.style.visibility = "hidden"; }}
          />
        ) : (
          <span className="text-gray-400">—</span>
        ),
        name: b.name || "—",
        category: b.category?.name || "—",
        company: b.company?.name || "—",
        status: statusBadge(b.status),

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
  }, [brands, loading]);

  // ─── FORM HELPERS ────────────────────────────────────
  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
    if (formError) setFormError("");
  };

  const resetForm = () => {
    setForm({ id: 0, name: "", category_id: "", status: 1 });
    setLogoFile(null);
    setLogoPreview("");
    setErrors({});
    setFormError("");
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    else if (form.name.trim().length > 150)
      errs.name = "Name must be 150 characters or less";
    if (!form.category_id) errs.category_id = "Category is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── LOGO HANDLER ────────────────────────────────────
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      setLogoFile(null);
      setLogoPreview(editRow?.logo ? logoUrlFromPath(editRow.logo) : "");
      return;
    }

    if (!ALLOWED_LOGO_MIME.includes(file.type)) {
      showErrorToast("Logo must be PNG, JPG, WEBP, or SVG.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      showErrorToast("Logo must be under 2 MB.");
      e.target.value = "";
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
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
      category_id: row.category_id ?? "",
      status: Number(row.status) === 1 ? 1 : 0,
    });
    setLogoFile(null);
    setLogoPreview(row.logo ? logoUrlFromPath(row.logo) : "");
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
        name: form.name.trim(),
        category_id: Number(form.category_id),
        company_id: Number(myCompanyId),
        status: Number(form.status),
      };
      if (logoFile) payload.logo = logoFile;

      if (modalMode === "edit" && form.id) {
        await updateBrand({ id: form.id, ...payload });
        showSuccessToast("Brand updated successfully");
      } else {
        await saveBrand(payload);
        showSuccessToast("Brand created successfully");
      }

      closeModal();
      await loadBrands();
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
      await deleteBrand(confirmRow.id);
      showSuccessToast(`"${confirmRow.name}" deleted`);
      setConfirmOpen(false);
      setConfirmRow(null);
      await loadBrands();
    } catch (err) {
      showErrorToast(err.message || "Failed to delete");
    } finally {
      setConfirmBusy(false);
    }
  };

  // ─── OPTIONS ─────────────────────────────────────────
  const categoryOptions = useMemo(() => {
    const out = [{ value: "", label: "— Select a category —" }];

    const walk = (nodes, level = 0) => {
      (nodes || []).forEach((n) => {
        out.push({
          value: String(n.id),
          label: `${"— ".repeat(level)}${n.name}`,
        });
        walk(n.children, level + 1);
      });
    };
    walk(categories);
    return out;
  }, [categories]);

  const statusOptions = [
    { value: 1, label: "Active" },
    { value: 0, label: "Inactive" },
  ];

  const modalTitle = modalMode === "edit" ? "Edit Brand" : "Add Brand";
  const modalSubtitle =
    modalMode === "edit" ? editRow?.name || "" : "Create a new brand";

  // ─── RENDER ──────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Brands"
        icon={BadgeCheck}
        breadcrumb
        onClickGuide={() => showInfoToast("Opening guide...")}
      />

      <CardBox
        title="My Brands"
        subTitle={`${brands.length} item(s)`}
        icon={BadgeCheck}
        headerBgColor="light"
        buttons={[
          {
            text: "Add Brand",
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
              loadBrands();
            },
          },
        ]}
      >
        <DataTable
          data={tableData}
          columns={columns}
          loading={loading}
          searchable
          searchPlaceholder="Search brands..."
          sortable
          paginated
          initialPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          striped
          stickyHeader
          emptyMessage="No brands yet"
          emptyHint="Click 'Add Brand' to create your first one."
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
          <SelectInput
            label="Category"
            name="category_id"
            value={form.category_id}
            onChange={(e) => setField("category_id", e.target.value)}
            options={categoryOptions}
            required
            error={errors.category_id}
          />
          <TextInput
            label="Brand Name"
            name="name"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="e.g. Samsung"
            required
            error={errors.name}
          />

          <div className="form-group">
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Logo
            </label>

            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                onChange={handleLogoChange}
                className="block text-sm text-gray-700 dark:text-gray-200 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700"
              />
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="Preview"
                  className="h-12 w-12 object-contain rounded border border-gray-200 dark:border-gray-600 bg-white"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              )}
            </div>

            <small className="block mt-1 text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, WEBP, or SVG. Max 2 MB. Leave blank to keep the current logo when editing.
            </small>
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
            message="Brands belong to your company and are attached to one category."
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