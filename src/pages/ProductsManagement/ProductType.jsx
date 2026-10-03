// src/pages/ProductManagement/ProductType.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
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
  fetchProductTypes,
  saveProductType,
  updateProductType,
  deleteProductType,
} from "../../services/productTypeServices";

import { useAuth } from "../../context/AuthContext";

const STATUS_OPTIONS = [
  { value: 1, label: "Active" },
  { value: 0, label: "Inactive" },
];

export default function ProductType() {
  const { user } = useAuth();
  const myCompanyId = user?.company_id ?? null;

  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmRow, setConfirmRow] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const [form, setForm] = useState({
    id: 0,
    name: "",
    description: "",
    status: 1,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchProductTypes();
      setTypes(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load product types.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    { key: "sl",          header: "SL",         width: 60 },
    { key: "name",        header: "Name" },
    { key: "description", header: "Description" },
    { key: "status",      header: "Status" },
    { key: "actions",     header: "Actions" },
  ];

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

    return types.map((t, idx) => {
      const rowSnapshot = {
        id: t.id,
        name: t.name,
        description: t.description,
        status: t.status,
      };

      return {
        ...t,
        sl: idx + 1,
        name: t.name || "—",
        description: t.description
          ? t.description.length > 80
            ? t.description.slice(0, 80) + "…"
            : t.description
          : "—",
        status: statusBadge(t.status),
        actions: (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openEditModal(rowSnapshot)}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              type="button"
              onClick={() => askDelete(rowSnapshot)}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        ),
      };
    });
  }, [types, loading]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
    if (formError) setFormError("");
  };

  const resetForm = () => {
    setForm({ id: 0, name: "", description: "", status: 1 });
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
      description: row.description || "",
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
        description: form.description.trim() || null,
        status: Number(form.status),
      };

      if (modalMode === "edit" && form.id) {
        await updateProductType({ id: form.id, ...payload });
        showSuccessToast("Product type updated");
      } else {
        await saveProductType(payload);
        showSuccessToast("Product type created");
      }

      closeModal();
      await load();
    } catch (err) {
      const msg = err.message || "Failed to save";
      setFormError(msg);
      showErrorToast(msg);
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (row) => {
    setConfirmRow(row);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!confirmRow?.id) return;
    setConfirmBusy(true);
    try {
      await deleteProductType(confirmRow.id);
      showSuccessToast(`"${confirmRow.name}" deleted`);
      setConfirmOpen(false);
      setConfirmRow(null);
      await load();
    } catch (err) {
      showErrorToast(err.message || "Failed to delete");
    } finally {
      setConfirmBusy(false);
    }
  };

  const modalTitle =
    modalMode === "edit" ? "Edit Product Type" : "Add Product Type";

  return (
    <div>
      <PageHeader
        title="Product Types"
        icon={Boxes}
        breadcrumb
        onClickGuide={() => showInfoToast("Opening guide...")}
      />

      <CardBox
        title="My Product Types"
        subTitle={`${types.length} item(s)`}
        icon={Boxes}
        headerBgColor="light"
        buttons={[
          {
            text: "Add Product Type",
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
              load();
            },
          },
        ]}
      >
        <DataTable
          data={tableData}
          columns={columns}
          loading={loading}
          searchable
          searchPlaceholder="Search product types..."
          sortable
          paginated
          initialPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          striped
          stickyHeader
          emptyMessage="No product types yet"
          emptyHint="Click 'Add Product Type' to create your first one."
        />
      </CardBox>

      <AppModal
        show={modalOpen}
        onHide={closeModal}
        title={modalTitle}
        subtitle={
          modalMode === "edit" ? editRow?.name || "" : "Create a new product type"
        }
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
            placeholder="e.g. Simple Product"
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

          <SelectInput
            label="Status"
            name="status"
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
            options={STATUS_OPTIONS}
          />

          <AlertMessage
            type="info"
            message="Product types classify what UI a product shows (simple, variable, serialized, service)."
          />
        </div>
      </AppModal>

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
          This action cannot be undone. It will fail if products are still using
          this type.
        </p>
      </AppModal>
    </div>
  );
}