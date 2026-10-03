// src/pages/Inventory/Stock.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  RefreshCw,
  SlidersHorizontal,
  AlertTriangle,
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

import { fetchStocks, adjustStock } from "../../services/stockServices";
import { useAuth } from "../../context/AuthContext";

const MOVEMENT_TYPES = [
  { value: "purchase",       label: "Purchase (+)" },
  { value: "sale",           label: "Sale (-)" },
  { value: "sale_return",    label: "Sale Return (+)" },
  { value: "purchase_return",label: "Purchase Return (-)" },
  { value: "transfer_in",    label: "Transfer In (+)" },
  { value: "transfer_out",   label: "Transfer Out (-)" },
  { value: "adjustment",     label: "Adjustment (±)" },
  { value: "damage",         label: "Damage (-)" },
  { value: "expired",        label: "Expired (-)" },
  { value: "opening_stock",  label: "Opening Stock (+)" },
];

const emptyAdjust = {
  warehouse_id: "",
  product_id: "",
  variant_id: "",
  quantity: "",
  movement_type: "adjustment",
  reference_type: "",
  reference_id: "",
  note: "",
  company_id: "",
};

export default function Stock() {
  const { user } = useAuth();
  const myCompanyId = user?.company_id ?? null;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    warehouseId: "",
    productId: "",
    variantId: "",
    lowStock: false,
  });

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState(emptyAdjust);
  const [adjustBusy, setAdjustBusy] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchStocks({
        warehouseId: filters.warehouseId || undefined,
        productId: filters.productId || undefined,
        variantId: filters.variantId || undefined,
        lowStock: filters.lowStock || undefined,
      });
      setRows(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load stocks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    { key: "sl",                 header: "SL",         width: 60 },
    { key: "warehouse",          header: "Warehouse" },
    { key: "product",            header: "Product" },
    { key: "variant",            header: "Variant" },
    { key: "quantity",           header: "Qty" },
    { key: "reserved_quantity",  header: "Reserved" },
    { key: "available_quantity", header: "Available" },
    { key: "reorder_level",      header: "Reorder Lvl" },
    { key: "actions",            header: "Actions" },
  ];

  const tableData = useMemo(() => {
    return rows.map((r, idx) => {
      const isLow =
        Number(r.available_quantity) <= Number(r.reorder_level || 0);

      const rowSnapshot = {
        id: r.id,
        company_id: r.company_id,
        warehouse_id: r.warehouse_id,
        product_id: r.product_id,
        variant_id: r.variant_id,
        quantity: r.quantity,
      };

      return {
        ...r,
        sl: idx + 1,
        warehouse: (
          <span>
            {r.warehouse?.name || "—"}
            {r.warehouse?.code ? (
              <span className="text-gray-500"> ({r.warehouse.code})</span>
            ) : null}
          </span>
        ),
        product: r.product?.name || "—",
        variant: r.variant?.variant_name || "—",
        quantity: Number(r.quantity || 0),
        reserved_quantity: Number(r.reserved_quantity || 0),
        available_quantity: (
          <span
            className={
              isLow
                ? "font-semibold text-red-600"
                : "font-semibold text-emerald-700"
            }
          >
            {Number(r.available_quantity || 0)}
          </span>
        ),
        reorder_level: Number(r.reorder_level || 0),
        actions: (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openAdjust(rowSnapshot)}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust
            </button>
          </div>
        ),
      };
    });
  }, [rows, loading]);

  const setFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const openAdjust = (row) => {
    setAdjustForm({
      ...emptyAdjust,
      company_id: row.company_id ?? myCompanyId ?? "",
      warehouse_id: row.warehouse_id,
      product_id: row.product_id,
      variant_id: row.variant_id ?? "",
    });
    setAdjustError("");
    setAdjustOpen(true);
  };

  const closeAdjust = () => {
    setAdjustOpen(false);
    setAdjustForm(emptyAdjust);
    setAdjustError("");
  };

  const handleAdjust = async () => {
    if (!adjustForm.quantity || Number(adjustForm.quantity) === 0) {
      const msg = "Quantity must be a non-zero number";
      setAdjustError(msg);
      showErrorToast(msg);
      return;
    }
    if (!adjustForm.company_id) {
      const msg = "Company is missing";
      setAdjustError(msg);
      showErrorToast(msg);
      return;
    }

    setAdjustBusy(true);
    setAdjustError("");
    try {
      await adjustStock({
        company_id: Number(adjustForm.company_id),
        warehouse_id: Number(adjustForm.warehouse_id),
        product_id: Number(adjustForm.product_id),
        variant_id:
          adjustForm.variant_id === "" ? null : Number(adjustForm.variant_id),
        quantity: Number(adjustForm.quantity),
        movement_type: adjustForm.movement_type,
        reference_type: adjustForm.reference_type || null,
        reference_id:
          adjustForm.reference_id === ""
            ? null
            : Number(adjustForm.reference_id),
        note: adjustForm.note || null,
      });
      showSuccessToast("Stock adjusted");
      closeAdjust();
      await load();
    } catch (err) {
      const msg = err.message || "Failed to adjust stock";
      setAdjustError(msg);
      showErrorToast(msg);
    } finally {
      setAdjustBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Stock"
        icon={Boxes}
        breadcrumb
        onClickGuide={() => showInfoToast("Opening guide...")}
      />

      <CardBox
        title="Stock by Warehouse"
        subTitle={`${rows.length} row(s)`}
        icon={Boxes}
        headerBgColor="light"
        buttons={[
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
        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
          <TextInput
            label="Warehouse ID"
            value={filters.warehouseId}
            onChange={(e) => setFilter("warehouseId", e.target.value)}
          />
          <TextInput
            label="Product ID"
            value={filters.productId}
            onChange={(e) => setFilter("productId", e.target.value)}
          />
          <TextInput
            label="Variant ID"
            value={filters.variantId}
            onChange={(e) => setFilter("variantId", e.target.value)}
          />
          <div className="flex items-end gap-2">
            <label className="inline-flex items-center gap-2 text-sm pb-2">
              <input
                type="checkbox"
                checked={filters.lowStock}
                onChange={(e) => setFilter("lowStock", e.target.checked)}
              />
              Low stock only
            </label>
            <button
              type="button"
              onClick={load}
              className="px-3 py-2 rounded-md text-xs font-semibold border border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              Apply
            </button>
          </div>
        </div>

        <DataTable
          data={tableData}
          columns={columns}
          loading={loading}
          searchable
          searchPlaceholder="Search stock..."
          sortable
          paginated
          initialPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          striped
          stickyHeader
          emptyMessage="No stock rows"
          emptyHint="Set stock via the Stock API to get started."
        />
      </CardBox>

      {/* Adjust modal */}
      <AppModal
        show={adjustOpen}
        onHide={closeAdjust}
        title="Adjust Stock"
        subtitle="Apply a signed quantity change"
        icon={SlidersHorizontal}
        size="lg"
        footer={
          <LoadingButton
            isLoading={adjustBusy}
            text="Apply Adjustment"
            icon={SlidersHorizontal}
            onClick={handleAdjust}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold uppercase transition-colors disabled:opacity-60"
          />
        }
      >
        <div className="space-y-4">
          {adjustError && <AlertMessage type="danger" message={adjustError} />}

          <AlertMessage
            type="info"
            message="Use a positive number to add stock, negative to remove. The signed value is written to stock movements."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TextInput
              label="Company ID"
              value={adjustForm.company_id}
              onChange={(e) =>
                setAdjustForm({ ...adjustForm, company_id: e.target.value })
              }
            />
            <TextInput
              label="Warehouse ID"
              value={adjustForm.warehouse_id}
              onChange={(e) =>
                setAdjustForm({ ...adjustForm, warehouse_id: e.target.value })
              }
            />
            <TextInput
              label="Product ID"
              value={adjustForm.product_id}
              onChange={(e) =>
                setAdjustForm({ ...adjustForm, product_id: e.target.value })
              }
            />
            <TextInput
              label="Variant ID"
              value={adjustForm.variant_id}
              onChange={(e) =>
                setAdjustForm({ ...adjustForm, variant_id: e.target.value })
              }
              placeholder="Optional"
            />
            <TextInput
              label="Quantity (±)"
              type="number"
              value={adjustForm.quantity}
              onChange={(e) =>
                setAdjustForm({ ...adjustForm, quantity: e.target.value })
              }
              placeholder="e.g. 10 or -3"
              required
            />
            <SelectInput
              label="Movement Type"
              value={adjustForm.movement_type}
              onChange={(e) =>
                setAdjustForm({ ...adjustForm, movement_type: e.target.value })
              }
              options={MOVEMENT_TYPES}
            />
            <TextInput
              label="Reference Type"
              value={adjustForm.reference_type}
              onChange={(e) =>
                setAdjustForm({ ...adjustForm, reference_type: e.target.value })
              }
              placeholder="e.g. sale, purchase"
            />
            <TextInput
              label="Reference ID"
              type="number"
              value={adjustForm.reference_id}
              onChange={(e) =>
                setAdjustForm({ ...adjustForm, reference_id: e.target.value })
              }
            />
          </div>

          <TextArea
            label="Note"
            value={adjustForm.note}
            onChange={(e) =>
              setAdjustForm({ ...adjustForm, note: e.target.value })
            }
            rows={2}
          />
        </div>
      </AppModal>
    </div>
  );
}