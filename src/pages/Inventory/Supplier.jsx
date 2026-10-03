// src/pages/Inventory/Supplier.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Users,
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
  fetchSuppliers,
  saveSupplier,
  updateSupplier,
  deleteSupplier,
} from "../../services/supplierServices";

import { useAuth } from "../../context/AuthContext";

const STATUS_OPTIONS = [
  { value: 1, label: "Active" },
  { value: 0, label: "Inactive" },
];

export default function Supplier() {
  const { user } = useAuth();
  const myCompanyId = user?.company_id ?? null;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
    company_name: "",
    phone: "",
    email: "",
    address: "",
    tax_number: "",
    opening_balance: 0,
    credit_limit: "",
    status: 1,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchSuppliers({
        search: searchTerm || undefined,
      });
      setRows(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    { key: "sl",              header: "SL",             width: 60 },
    { key: "name",            header: "Name" },
    { key: "company_name",    header: "Company" },
    { key: "phone",           header: "Phone" },
    { key: "email",           header: "Email" },
    { key: "opening_balance", header: "Opening Bal" },
    { key: "credit_limit",    header: "Credit Limit" },
    { key: "status",          header: "Status" },
    { key: "actions",         header: "Actions" },
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
        name: r.name,
        company_name: r.company_name,
        phone: r.phone,
        email: r.email,
        address: r.address,
        tax_number: r.tax_number,
        opening_balance: r.opening_balance,
        credit_limit: r.credit_limit,
        status: r.status,
      };

      return {
        ...r,
        sl: idx + 1,
        name: r.name || "—",
        company_name: r.company_name || "—",
        phone: r.phone || "—",
        email: r.email || "—",
        opening_balance: Number(r.opening_balance || 0).toFixed(2),
        credit_limit:
          r.credit_limit != null ? Number(r.credit_limit).toFixed(2) : "—",
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
      name: "",
      company_name: "",
      phone: "",
      email: "",
      address: "",
      tax_number: "",
      opening_balance: 0,
      credit_limit: "",
      status: 1,
    });
    setErrors({});
    setFormError("");
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    else if (form.name.trim().length > 150)
      errs.name = "Name must be 150 characters or less";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
      errs.email = "Enter a valid email";
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
      company_name: row.company_name || "",
      phone: row.phone || "",
      email: row.email || "",
      address: row.address || "",
      tax_number: row.tax_number || "",
      opening_balance: row.opening_balance ?? 0,
      credit_limit: row.credit_limit ?? "",
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
        company_name: form.company_name.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        tax_number: form.tax_number.trim() || null,
        opening_balance: Number(form.opening_balance || 0),
        credit_limit:
          form.credit_limit === "" ? null : Number(form.credit_limit),
        status: Number(form.status),
      };

      if (modalMode === "edit" && form.id) {
        await updateSupplier({ id: form.id, ...payload });
        showSuccessToast("Supplier updated");
      } else {
        await saveSupplier(payload);
        showSuccessToast("Supplier created");
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
      await deleteSupplier(confirmRow.id);
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

  return (
    <div>
      <PageHeader
        title="Suppliers"
        icon={Users}
        breadcrumb
        onClickGuide={() => showInfoToast("Opening guide...")}
      />

      <CardBox
        title="My Suppliers"
        subTitle={`${rows.length} item(s)`}
        icon={Users}
        headerBgColor="light"
        buttons={[
          {
            text: "Add Supplier",
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
          searchPlaceholder="Search suppliers..."
          onSearchChange={(v) => setSearchTerm(v)}
          sortable
          paginated
          initialPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          striped
          stickyHeader
          emptyMessage="No suppliers yet"
          emptyHint="Click 'Add Supplier' to create your first one."
        />
      </CardBox>

      <AppModal
        show={modalOpen}
        onHide={closeModal}
        title={modalMode === "edit" ? "Edit Supplier" : "Add Supplier"}
        subtitle={
          modalMode === "edit" ? editRow?.name || "" : "Create a new supplier"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="Name"
              name="name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Acme Corp."
              required
              error={errors.name}
            />
            <TextInput
              label="Company Name"
              name="company_name"
              value={form.company_name}
              onChange={(e) => setField("company_name", e.target.value)}
              placeholder="Legal / trade name"
            />
            <TextInput
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
            <TextInput
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              error={errors.email}
            />
            <TextInput
              label="Tax Number"
              name="tax_number"
              value={form.tax_number}
              onChange={(e) => setField("tax_number", e.target.value)}
            />
            <SelectInput
              label="Status"
              name="status"
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
              options={STATUS_OPTIONS}
            />
            <TextInput
              label="Opening Balance"
              name="opening_balance"
              type="number"
              value={form.opening_balance}
              onChange={(e) => setField("opening_balance", e.target.value)}
            />
            <TextInput
              label="Credit Limit"
              name="credit_limit"
              type="number"
              value={form.credit_limit}
              onChange={(e) => setField("credit_limit", e.target.value)}
              placeholder="Leave blank for unlimited"
            />
          </div>

          <TextArea
            label="Address"
            name="address"
            value={form.address}
            onChange={(e) => setField("address", e.target.value)}
            rows={2}
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
          This action cannot be undone. Products linked to this supplier will
          lose the link.
        </p>
      </AppModal>
    </div>
  );
}