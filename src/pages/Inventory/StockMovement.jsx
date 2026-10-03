// src/pages/Inventory/StockMovement.jsx
import { useEffect, useMemo, useState } from "react";
import {
  History,
  RefreshCw,
  Search,
  Route as RouteIcon,
  AlertTriangle,
} from "lucide-react";

import PageHeader from "../../components/PageHeader";
import CardBox from "../../components/CardBox";
import AlertMessage from "../../components/AlertMessage";
import TextInput from "../../components/TextInput";
import SelectInput from "../../components/SelectInput";
import DataTable from "../../components/DataTable";

import {
  showErrorToast,
  showInfoToast,
} from "../../Helper/TosterHelper";

import {
  fetchStockMovements,
  traceStockMovements,
} from "../../services/stockMovementServices";

const MOVEMENT_TYPES = [
  { value: "",               label: "— any —" },
  { value: "purchase",       label: "Purchase" },
  { value: "sale",           label: "Sale" },
  { value: "sale_return",    label: "Sale Return" },
  { value: "purchase_return",label: "Purchase Return" },
  { value: "transfer_in",    label: "Transfer In" },
  { value: "transfer_out",   label: "Transfer Out" },
  { value: "adjustment",     label: "Adjustment" },
  { value: "damage",         label: "Damage" },
  { value: "expired",        label: "Expired" },
  { value: "opening_stock",  label: "Opening Stock" },
];

export default function StockMovement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [traceMode, setTraceMode] = useState(false);
  const [traceError, setTraceError] = useState("");

  const [filters, setFilters] = useState({
    company_id: "",
    warehouse_id: "",
    product_id: "",
    variant_id: "",
    movement_type: "",
    reference_type: "",
    reference_id: "",
    from: "",
    to: "",
    limit: 200,
  });

  const load = async (mode = "list") => {
    setLoading(true);
    setTraceError("");
    try {
      const opts = {
        companyId: filters.company_id || undefined,
        warehouseId: filters.warehouse_id || undefined,
        productId: filters.product_id || undefined,
        variantId: filters.variant_id || undefined,
        movementType: filters.movement_type || undefined,
        referenceType: filters.reference_type || undefined,
        referenceId: filters.reference_id || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        limit: filters.limit || undefined,
      };

      if (mode === "trace") {
        if (!opts.productId) {
          setTraceError("Product ID is required to trace.");
          showErrorToast("Product ID is required to trace.");
          setLoading(false);
          return;
        }
        const res = await traceStockMovements({
          productId: opts.productId,
          variantId: opts.variantId,
          warehouseId: opts.warehouseId,
        });
        setRows(res.data || []);
        setTraceMode(true);
      } else {
        const res = await fetchStockMovements(opts);
        setRows(res.data || []);
        setTraceMode(false);
      }
    } catch (err) {
      showErrorToast(err.message || "Failed to load movements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load("list");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    { key: "sl",                header: "SL",         width: 60 },
    { key: "created_at",        header: "When" },
    { key: "warehouse",         header: "Warehouse" },
    { key: "product",           header: "Product" },
    { key: "variant",           header: "Variant" },
    { key: "movement_type",     header: "Type" },
    { key: "reference",         header: "Ref" },
    { key: "quantity",          header: "Δ Qty" },
    { key: "previous_quantity", header: "Prev" },
    { key: "new_quantity",      header: "New" },
    { key: "note",              header: "Note" },
  ];

  const tableData = useMemo(() => {
    return rows.map((m, idx) => {
      const delta = Number(m.quantity || 0);
      return {
        ...m,
        sl: idx + 1,
        created_at: m.created_at
          ? new Date(m.created_at).toLocaleString()
          : "—",
        warehouse: m.warehouse?.name || "—",
        product: m.product?.name || "—",
        variant: m.variant?.variant_name || "—",
        movement_type: (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            {m.movement_type}
          </span>
        ),
        reference: m.reference_type
          ? `${m.reference_type}#${m.reference_id ?? ""}`
          : "—",
        quantity: (
          <span
            className={
              delta >= 0
                ? "font-mono font-semibold text-emerald-700"
                : "font-mono font-semibold text-red-700"
            }
          >
            {delta > 0 ? `+${delta}` : delta}
          </span>
        ),
        previous_quantity: (
          <span className="font-mono">{Number(m.previous_quantity || 0)}</span>
        ),
        new_quantity: (
          <span className="font-mono">{Number(m.new_quantity || 0)}</span>
        ),
        note: m.note || "—",
      };
    });
  }, [rows]);

  const setFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const resetFilters = () =>
    setFilters({
      company_id: "",
      warehouse_id: "",
      product_id: "",
      variant_id: "",
      movement_type: "",
      reference_type: "",
      reference_id: "",
      from: "",
      to: "",
      limit: 200,
    });

  return (
    <div>
      <PageHeader
        title="Stock Movements"
        icon={History}
        breadcrumb
        onClickGuide={() => showInfoToast("Opening guide...")}
      />

      <CardBox
        title="Audit Trail"
        subTitle={`${rows.length} record(s)`}
        icon={History}
        headerBgColor="light"
        buttons={[
          {
            text: "Refresh",
            icon: RefreshCw,
            color: "secondary",
            onClick: () => {
              showInfoToast("Refreshing...");
              load(traceMode ? "trace" : "list");
            },
          },
        ]}
      >
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
          <TextInput
            label="Company ID"
            value={filters.company_id}
            onChange={(e) => setFilter("company_id", e.target.value)}
          />
          <TextInput
            label="Warehouse ID"
            value={filters.warehouse_id}
            onChange={(e) => setFilter("warehouse_id", e.target.value)}
          />
          <TextInput
            label="Product ID"
            value={filters.product_id}
            onChange={(e) => setFilter("product_id", e.target.value)}
          />
          <TextInput
            label="Variant ID"
            value={filters.variant_id}
            onChange={(e) => setFilter("variant_id", e.target.value)}
          />
          <SelectInput
            label="Movement Type"
            value={filters.movement_type}
            onChange={(e) => setFilter("movement_type", e.target.value)}
            options={MOVEMENT_TYPES}
          />
          <TextInput
            label="Reference Type"
            value={filters.reference_type}
            onChange={(e) => setFilter("reference_type", e.target.value)}
          />
          <TextInput
            label="Reference ID"
            value={filters.reference_id}
            onChange={(e) => setFilter("reference_id", e.target.value)}
          />
          <TextInput
            label="Limit (≤ 1000)"
            type="number"
            value={filters.limit}
            onChange={(e) => setFilter("limit", e.target.value)}
          />
          <TextInput
            label="From"
            type="date"
            value={filters.from}
            onChange={(e) => setFilter("from", e.target.value)}
          />
          <TextInput
            label="To"
            type="date"
            value={filters.to}
            onChange={(e) => setFilter("to", e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => load("list")}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-xs font-semibold border border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <Search className="w-3.5 h-3.5" /> Search
          </button>
          <button
            type="button"
            onClick={() => load("trace")}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <RouteIcon className="w-3.5 h-3.5" />
            {traceMode ? "Re-run Trace" : "Trace Product"}
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-xs font-semibold border border-gray-400 text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>

        {traceError && (
          <div className="mb-3">
            <AlertMessage type="warning" message={traceError} />
          </div>
        )}

        {traceMode && !traceError && (
          <div className="mb-3">
            <AlertMessage
              type="info"
              message={`Tracing product ${filters.product_id}${
                filters.variant_id ? ` · variant ${filters.variant_id}` : ""
              }${filters.warehouse_id ? ` · warehouse ${filters.warehouse_id}` : ""}`}
            />
          </div>
        )}

        <DataTable
          data={tableData}
          columns={columns}
          loading={loading}
          searchable
          searchPlaceholder="Search movements..."
          sortable
          paginated
          initialPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          striped
          stickyHeader
          emptyMessage="No movements yet"
          emptyHint="Movements appear when stock is adjusted."
        />
      </CardBox>
    </div>
  );
}