// src/pages/CategoryManagement/Category.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Tags,
  Plus,
  Pencil,
  Trash2,
  Save,
  AlertTriangle,
  RefreshCw,
  FolderTree,
} from "lucide-react";

import PageHeader from "../../components/PageHeader";
import CardBox from "../../components/CardBox";
import AppModal from "../../components/AppModal";
import AlertMessage from "../../components/AlertMessage";
import TextInput from "../../components/TextInput";
import TextArea from "../../components/TextArea";
import SelectInput from "../../components/SelectInput";
import LoadingButton from "../../components/LoadingButton";
import DataTable from "../../components/DataTable";

import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from "../../Helper/TosterHelper";

import {
  fetchCategories,
  saveCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoryServices";

import { useAuth } from "../../context/AuthContext";

// ─── Image constraints (mirror the backend) ───────────────
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_IMAGE_MIME = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
];

const imageUrlFromPath = (p) => {
  if (!p) return "";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api")
    .replace(/\/api\/?$/, "");
  return `${API_ORIGIN}/storage/${p}`;
};

export default function Category() {
  // =====================================================
  // AUTH — auto company
  // =====================================================
  const { user } = useAuth();
  const myCompanyId = user?.company_id ?? null;

  // =====================================================
  // STATE
  // =====================================================
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [modalMode, setModalMode] = useState(null); // "create" | "edit" | null
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmRow, setConfirmRow] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Image state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // Form state — company_id is NOT in the form; it's derived from the auth user
  const [form, setForm] = useState({
    id: 0,
    parent_id: "",
    name: "",
    description: "",
    status: 1,
  });

  // =====================================================
  // LOAD
  // =====================================================
  const loadCategories = async () => {
    setLoading(true);
    try {
      // Scope the tree to the user's own company (falls back to all-mine if no company)
      const res = await fetchCategories({ tree: true });
      setCategories(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================================
  // TABLE COLUMNS
  // =====================================================
  const columns = [
    { key: "sl",          header: "SL",          width: 60 },
    { key: "image",       header: "Image",       width: 70 },
    { key: "name",        header: "Name" },
    { key: "parent",      header: "Parent" },
    { key: "description", header: "Description" },
    { key: "status",      header: "Status" },
    { key: "actions",     header: "Actions" },
  ];

  // =====================================================
  // ROW DATA — flatten tree, indent children
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

    const rows = [];

    const walk = (nodes, level = 0) => {
      (nodes || []).forEach((node) => {
        rows.push({
          id: node.id,
          parent_id: node.parent_id,
          parent: node.parent?.name || "—",
          name: node.name,
          description: node.description,
          image: node.image,
          image_url: node.image_url,
          status: node.status,
          level,
        });

        if (Array.isArray(node.children) && node.children.length) {
          walk(node.children, level + 1);
        }
      });
    };

    walk(categories);

    return rows.map((r, idx) => {
      const rowSnapshot = {
        id: r.id,
        parent_id: r.parent_id,
        name: r.name,
        description: r.description,
        image: r.image,
        status: r.status,
      };

      return {
        ...r,
        sl: idx + 1,
        image: r.image ? (
          <img
            src={imageUrlFromPath(r.image)}
            alt=""
            className="h-8 w-8 object-contain rounded"
            onError={(e) => { e.target.style.visibility = "hidden"; }}
          />
        ) : (
          <span className="text-gray-400">—</span>
        ),
        name: (
          <span
            style={{
              paddingLeft: (r.level || 0) * 18,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ opacity: 0.6 }}>
              {r.level === 0 ? "" : r.level === 1 ? "↳" : "•"}
            </span>
            <span className={r.level === 0 ? "font-semibold" : ""}>{r.name}</span>
          </span>
        ),
        parent: r.parent || "—",
        description: r.description
          ? r.description.length > 60
            ? r.description.slice(0, 60) + "…"
            : r.description
          : "—",
        status: statusBadge(r.status),

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
  }, [categories, loading]);

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
      parent_id: "",
      name: "",
      description: "",
      status: 1,
    });
    setImageFile(null);
    setImagePreview("");
    setErrors({});
    setFormError("");
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    else if (form.name.trim().length > 150)
      errs.name = "Name must be 150 characters or less";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // =====================================================
  // IMAGE HANDLER
  // =====================================================
  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      setImageFile(null);
      setImagePreview(editRow?.image ? imageUrlFromPath(editRow.image) : "");
      return;
    }

    if (!ALLOWED_IMAGE_MIME.includes(file.type)) {
      showErrorToast("Image must be PNG, JPG, WEBP, or SVG.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      showErrorToast("Image must be under 2 MB.");
      e.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // =====================================================
  // OPEN MODALS
  // =====================================================
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
      parent_id: row.parent_id ?? "",
      name: row.name || "",
      description: row.description || "",
      status: Number(row.status) === 1 ? 1 : 0,
    });
    setImageFile(null);
    setImagePreview(row.image ? imageUrlFromPath(row.image) : "");
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
  // — company_id is taken from the logged-in user, not the form
  // =====================================================
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
        company_id: Number(myCompanyId), // ← auto from logged-in user
        parent_id: form.parent_id === "" ? null : Number(form.parent_id),
        name: form.name.trim(),
        description: form.description.trim() || null,
        status: Number(form.status),
      };

      if (imageFile) payload.image = imageFile;

      if (modalMode === "edit" && form.id) {
        await updateCategory({ id: form.id, ...payload });
        showSuccessToast("Category updated successfully");
      } else {
        await saveCategory(payload);
        showSuccessToast("Category created successfully");
      }

      closeModal();
      await loadCategories();
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
      await deleteCategory(confirmRow.id);
      showSuccessToast(`"${confirmRow.name}" deleted`);
      setConfirmOpen(false);
      setConfirmRow(null);
      await loadCategories();
    } catch (err) {
      showErrorToast(err.message || "Failed to delete");
    } finally {
      setConfirmBusy(false);
    }
  };

  // =====================================================
  // SELECT OPTIONS
  // =====================================================
  // Flattened category list, excluding the row being edited (and its descendants),
  // for the "Parent" dropdown.
  const parentOptions = useMemo(() => {
    const out = [{ value: "", label: "— None (top-level) —" }];

    const collectDescendants = (id, list) => {
      const kids = [];
      const walk = (nodes) => {
        (nodes || []).forEach((n) => {
          if (Number(n.parent_id) === Number(id)) kids.push(Number(n.id));
          walk(n.children);
        });
      };
      walk(list);
      return kids;
    };

    const exclude = new Set();
    if (editRow?.id) {
      exclude.add(Number(editRow.id));
      collectDescendants(editRow.id, categories).forEach((id) => exclude.add(id));
    }

    const walk = (nodes, level = 0) => {
      (nodes || []).forEach((n) => {
        if (!exclude.has(Number(n.id))) {
          out.push({
            value: String(n.id),
            label: `${"— ".repeat(level)}${n.name}`,
          });
        }
        walk(n.children, level + 1);
      });
    };
    walk(categories);

    return out;
  }, [categories, editRow]);

  const statusOptions = [
    { value: 1, label: "Active" },
    { value: 0, label: "Inactive" },
  ];

  const modalTitle =
    modalMode === "edit" ? "Edit Category" : "Add Category";

  const modalSubtitle =
    modalMode === "edit" ? editRow?.name || "" : "Create a new category";

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div>
      <PageHeader
        title="Categories"
        icon={Tags}
        breadcrumb
        onClickGuide={() => showInfoToast("Opening guide...")}
      />

      <CardBox
        title="My Categories"
        subTitle={`${tableData.length} item(s)`}
        icon={FolderTree}
        headerBgColor="light"
        buttons={[
          {
            text: "Add Category",
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
              loadCategories();
            },
          },
        ]}
      >
        <DataTable
          data={tableData}
          columns={columns}
          loading={loading}
          searchable
          searchPlaceholder="Search categories..."
          sortable
          paginated
          initialPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          striped
          stickyHeader
          emptyMessage="No categories yet"
          emptyHint="Click 'Add Category' to create your first one."
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
            label="Parent Category"
            name="parent_id"
            value={form.parent_id}
            onChange={(e) => setField("parent_id", e.target.value)}
            options={parentOptions}
          />

          <TextInput
            label="Category Name"
            name="name"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="e.g. Electronics"
            required
            error={errors.name}
          />

          <TextArea
            label="Description"
            name="description"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            placeholder="Short description..."
            rows={3}
          />

          {/* ─── Image preview ─── */}
          <div className="form-group">
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Image
            </label>

            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                onChange={handleImageChange}
                className="block text-sm text-gray-700 dark:text-gray-200 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700"
              />

              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-12 w-12 object-contain rounded border border-gray-200 dark:border-gray-600 bg-white"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              )}
            </div>

            <small className="block mt-1 text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, WEBP, or SVG. Max 2 MB. Leave blank to keep the current image when editing.
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
            message="Categories belong to your company and can optionally be nested under a parent."
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
          This action cannot be undone. All sub-categories under this one will
          also be permanently removed.
        </p>
      </AppModal>
    </div>
  );
}