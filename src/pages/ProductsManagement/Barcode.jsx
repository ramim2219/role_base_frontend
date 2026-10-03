// src/pages/ProductManagement/Barcode.jsx
import { useEffect, useMemo, useState } from "react";
import {
  ScanBarcode,
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
  fetchBarcodes,
  saveBarcode,
  updateBarcode,
  deleteBarcode,
} from "../../services/barcodeServices";

import { fetchProducts } from "../../services/productServices";
import { useAuth } from "../../context/AuthContext";

const TYPE_OPTIONS = [
  { value: "internal", label: "Internal" },
  { value: "ean",      label: "EAN" },
  { value: "upc",      label: "UPC" },
  { value: "supplier", label: "Supplier" },
  { value: "other",    label: "Other" },
];

const STATUS_OPTIONS = [
  { value: 1, label: "Active" },
  { value: 0, label: "Inactive" },
];

export default function Barcode() {
  const { user } = useAuth();
  const myCompanyId = user?.company_id ?? null;

  const [barcodes, setBarcodes] = useState([]);
  const [products, setProducts] = useState([]);
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
    product_id: "",
    variant_id: "",
    barcode: "",
    barcode_type: "internal",
    is_primary: false,
    status: 1,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchBarcodes();
      setBarcodes(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load barcodes.");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetchProducts();
      setProducts(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load products.");
    }
  };

  useEffect(() => {
    load();
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    { key: "sl",           header: "SL",           width: 60 },
    { key: "barcode",      header: "Barcode" },
    { key: "barcode_type", header: "Type" },
    { key: "product",      header: "Product" },
    { key: "variant",      header: "Variant" },
    { key: "is_primary",   header: "Primary" },
    { key: "status",       header: "Status" },
    { key: "actions",      header: "Actions" },
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

    return barcodes.map((b, idx) => {
      const rowSnapshot = {
        id: b.id,
        product_id: b.product_id,
        variant_id: b.variant_id,
        barcode: b.barcode,
        barcode_type: b.barcode_type,
        is_primary: b.is_primary,
        status: b.status,
      };

      return {
        ...b,
        sl: idx + 1,
        barcode: (
          <code className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
            {b.barcode}
          </code>
        ),
        barcode_type:
          TYPE_OPTIONS.find((o) => o.value === b.barcode_type)?.label ||
          b.barcode_type,
        product: b.product?.name || "—",
        variant: b.variant?.variant_name || "—",
        is_primary: b.is_primary ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            Yes
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            No
          </span>
        ),
        status: statusBadge(b.status),

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
  }, [barcodes, loading]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
    if (formError) setFormError("");
  };

  const resetForm = () => {
    setForm({
      id: 0,
      product_id: "",
      variant_id: "",
      barcode: "",
      barcode_type: "internal",
      is_primary: false,
      status: 1,
    });
    setErrors({});
    setFormError("");
  };

  const validateForm = () => {
    const errs = {};
    if (!form.product_id) errs.product_id = "Product is required";
    if (!form.barcode.trim()) errs.barcode = "Barcode is required";
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
      product_id: row.product_id ?? "",
      variant_id: row.variant_id ?? "",
      barcode: row.barcode || "",
      barcode_type: row.barcode_type || "internal",
      is_primary: !!row.is_primary,
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
        product_id: Number(form.product_id),
        variant_id: form.variant_id === "" ? null : Number(form.variant_id),
        barcode: form.barcode.trim(),
        barcode_type: form.barcode_type,
        is_primary: form.is_primary ? 1 : 0,
        status: Number(form.status),
      };

      if (modalMode === "edit" && form.id) {
        await updateBarcode({ id: form.id, ...payload });
        showSuccessToast("Barcode updated");
      } else {
        await saveBarcode(payload);
        showSuccessToast("Barcode created");
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
      await deleteBarcode(confirmRow.id);
      showSuccessToast("Barcode deleted");
      setConfirmOpen(false);
      setConfirmRow(null);
      await load();
    } catch (err) {
      showErrorToast(err.message || "Failed to delete");
    } finally {
      setConfirmBusy(false);
    }
  };

  const productOptions = useMemo(
    () => [
      { value: "", label: "— Select a product —" },
      ...products.map((p) => ({ value: String(p.id), label: p.name })),
    ],
    [products]
  );

  return (
    <div>
      <PageHeader
        title="Barcodes"
        icon={ScanBarcode}
        breadcrumb
        onClickGuide={() => showInfoToast("Opening guide...")}
      />

      <CardBox
        title="My Barcodes"
        subTitle={`${barcodes.length} item(s)`}
        icon={ScanBarcode}
        headerBgColor="light"
        buttons={[
          {
            text: "Add Barcode",
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
          searchPlaceholder="Search barcodes..."
          sortable
          paginated
          initialPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          striped
          stickyHeader
          emptyMessage="No barcodes yet"
          emptyHint="Click 'Add Barcode' to create your first one."
        />
      </CardBox>

      <AppModal
        show={modalOpen}
        onHide={closeModal}
        title={modalMode === "edit" ? "Edit Barcode" : "Add Barcode"}
        subtitle={
          modalMode === "edit" ? editRow?.barcode || "" : "Create a new barcode"
        }
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
            label="Product"
            name="product_id"
            value={form.product_id}
            onChange={(e) => setField("product_id", e.target.value)}
            options={productOptions}
            required
            error={errors.product_id}
          />

          <TextInput
            label="Barcode"
            name="barcode"
            value={form.barcode}
            onChange={(e) => setField("barcode", e.target.value)}
            placeholder="e.g. 1234567890123"
            required
            error={errors.barcode}
          />

          <SelectInput
            label="Barcode Type"
            name="barcode_type"
            value={form.barcode_type}
            onChange={(e) => setField("barcode_type", e.target.value)}
            options={TYPE_OPTIONS}
          />

          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <input
              id="is_primary"
              type="checkbox"
              checked={form.is_primary}
              onChange={(e) => setField("is_primary", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_primary" className="text-sm text-gray-700 dark:text-gray-200">
              <span className="font-medium">Primary barcode</span>
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
            message="Barcodes are unique per company. Each product can have several (EAN, UPC, supplier, internal)."
          />
        </div>
      </AppModal>

      <AppModal
        show={confirmOpen}
        onHide={() => setConfirmOpen(false)}
        title="Confirm Delete"
        subtitle={confirmRow ? `Delete "${confirmRow.barcode}"?` : ""}
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