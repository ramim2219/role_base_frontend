// src/pages/Inventory/ProductSupplier.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Link2,
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
  fetchProductSuppliers,
  saveProductSupplier,
  updateProductSupplier,
  deleteProductSupplier,
} from "../../services/productSupplierServices";

import { fetchProducts } from "../../services/productServices";
import { fetchSuppliers } from "../../services/supplierServices";

const STATUS_OPTIONS = [
  { value: 1, label: "Active" },
  { value: 0, label: "Inactive" },
];

export default function ProductSupplier() {
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
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
    supplier_id: "",
    supplier_sku: "",
    purchase_price: 0,
    minimum_order_qty: 1,
    is_preferred: false,
    status: 1,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchProductSuppliers();
      setRows(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load links.");
    } finally {
      setLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      const [p, s] = await Promise.allSettled([
        fetchProducts(),
        fetchSuppliers(),
      ]);
      setProducts(p.status === "fulfilled" ? p.value?.data || [] : []);
      setSuppliers(s.status === "fulfilled" ? s.value?.data || [] : []);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
    loadLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    { key: "sl",               header: "SL",           width: 60 },
    { key: "product",          header: "Product" },
    { key: "variant",          header: "Variant" },
    { key: "supplier",         header: "Supplier" },
    { key: "supplier_sku",     header: "Supplier SKU" },
    { key: "purchase_price",   header: "Price" },
    { key: "minimum_order_qty",header: "MOQ" },
    { key: "is_preferred",     header: "Preferred" },
    { key: "status",           header: "Status" },
    { key: "actions",          header: "Actions" },
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

    return rows.map((r, idx) => {
      const rowSnapshot = {
        id: r.id,
        product_id: r.product_id,
        variant_id: r.variant_id,
        supplier_id: r.supplier_id,
        supplier_sku: r.supplier_sku,
        purchase_price: r.purchase_price,
        minimum_order_qty: r.minimum_order_qty,
        is_preferred: r.is_preferred,
        status: r.status,
      };

      return {
        ...r,
        sl: idx + 1,
        product: r.product?.name || "—",
        variant: r.variant?.variant_name || "—",
        supplier: r.supplier?.name || "—",
        supplier_sku: r.supplier_sku || "—",
        purchase_price: Number(r.purchase_price || 0).toFixed(2),
        minimum_order_qty: Number(r.minimum_order_qty || 1),
        is_preferred: r.is_preferred ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            ★ Preferred
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
        status: statusBadge(r.status),
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
  }, [rows, loading]);

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
      supplier_id: "",
      supplier_sku: "",
      purchase_price: 0,
      minimum_order_qty: 1,
      is_preferred: false,
      status: 1,
    });
    setErrors({});
    setFormError("");
  };

  const validateForm = () => {
    const errs = {};
    if (!form.product_id) errs.product_id = "Product is required";
    if (!form.supplier_id) errs.supplier_id = "Supplier is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

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
      product_id: row.product_id ?? "",
      variant_id: row.variant_id ?? "",
      supplier_id: row.supplier_id ?? "",
      supplier_sku: row.supplier_sku || "",
      purchase_price: row.purchase_price ?? 0,
      minimum_order_qty: row.minimum_order_qty ?? 1,
      is_preferred: !!row.is_preferred,
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

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        product_id: Number(form.product_id),
        variant_id: form.variant_id === "" ? null : Number(form.variant_id),
        supplier_id: Number(form.supplier_id),
        supplier_sku: form.supplier_sku.trim() || null,
        purchase_price: Number(form.purchase_price || 0),
        minimum_order_qty: Number(form.minimum_order_qty || 1),
        is_preferred: form.is_preferred ? 1 : 0,
        status: Number(form.status),
      };

      if (modalMode === "edit" && form.id) {
        await updateProductSupplier({ id: form.id, ...payload });
        showSuccessToast("Link updated");
      } else {
        await saveProductSupplier(payload);
        showSuccessToast("Link created");
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
      await deleteProductSupplier(confirmRow.id);
      showSuccessToast("Link deleted");
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

  const supplierOptions = useMemo(
    () => [
      { value: "", label: "— Select a supplier —" },
      ...suppliers.map((s) => ({ value: String(s.id), label: s.name })),
    ],
    [suppliers]
  );

  return (
    <div>
      <PageHeader
        title="Product–Supplier Links"
        icon={Link2}
        breadcrumb
        onClickGuide={() => showInfoToast("Opening guide...")}
      />

      <CardBox
        title="Product ↔ Supplier"
        subTitle={`${rows.length} link(s)`}
        icon={Link2}
        headerBgColor="light"
        buttons={[
          {
            text: "Add Link",
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
          searchPlaceholder="Search links..."
          sortable
          paginated
          initialPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          striped
          stickyHeader
          emptyMessage="No links yet"
          emptyHint="Click 'Add Link' to attach a supplier to a product."
        />
      </CardBox>

      <AppModal
        show={modalOpen}
        onHide={closeModal}
        title={modalMode === "edit" ? "Edit Link" : "Add Link"}
        subtitle="Attach a supplier to a product"
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
            <SelectInput
              label="Product"
              value={form.product_id}
              onChange={(e) => setField("product_id", e.target.value)}
              options={productOptions}
              required
              error={errors.product_id}
              disabled={modalMode === "edit"}
            />
            <SelectInput
              label="Supplier"
              value={form.supplier_id}
              onChange={(e) => setField("supplier_id", e.target.value)}
              options={supplierOptions}
              required
              error={errors.supplier_id}
              disabled={modalMode === "edit"}
            />
            <TextInput
              label="Variant ID"
              type="number"
              value={form.variant_id}
              onChange={(e) => setField("variant_id", e.target.value)}
              placeholder="Optional"
              disabled={modalMode === "edit"}
            />
            <TextInput
              label="Supplier SKU"
              value={form.supplier_sku}
              onChange={(e) => setField("supplier_sku", e.target.value)}
              placeholder="The supplier's own code"
            />
            <TextInput
              label="Purchase Price"
              type="number"
              value={form.purchase_price}
              onChange={(e) => setField("purchase_price", e.target.value)}
            />
            <TextInput
              label="Minimum Order Qty"
              type="number"
              value={form.minimum_order_qty}
              onChange={(e) => setField("minimum_order_qty", e.target.value)}
            />
            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <input
                id="is_preferred"
                type="checkbox"
                checked={form.is_preferred}
                onChange={(e) => setField("is_preferred", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="is_preferred"
                className="text-sm text-gray-700 dark:text-gray-200"
              >
                <span className="font-medium">Preferred supplier</span>
                <span className="block text-xs text-gray-500">
                  Marks this supplier as the default for this product.
                </span>
              </label>
            </div>
            <SelectInput
              label="Status"
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>
      </AppModal>

      <AppModal
        show={confirmOpen}
        onHide={() => setConfirmOpen(false)}
        title="Confirm Delete"
        subtitle={confirmRow ? "Delete this link?" : ""}
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