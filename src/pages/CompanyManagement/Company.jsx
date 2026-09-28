// src/pages/Company.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Save,
  AlertTriangle,
  RefreshCw,
  Mail,
  Phone,
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
  fetchCompanies,
  saveCompany,
  updateCompany,
  deleteCompany,
} from "../../services/companyServices";

import { fetchCompanyTypes } from "../../services/companyTypeServices";

// ─── Logo upload constraints (mirror the backend) ─────────
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_LOGO_MIME = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
];

// Build a display URL from a stored path like "logos/xxx.webp"
const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api")
  .replace(/\/api\/?$/, "");

const logoUrlFromPath = (p) => {
  if (!p) return "";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  return `${API_ORIGIN}/storage/${p}`;
};

export default function Company() {
  // =====================================================
  // STATE
  // =====================================================
  const [companies, setCompanies] = useState([]);
  const [companyTypes, setCompanyTypes] = useState([]);
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

  // Logo-specific state
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  // Form state — matches CompanyController::save/update exactly
  const [form, setForm] = useState({
    id: 0,
    name: "",
    company_type_id: "",
    address: "",
    contact: "",
    email: "",
    status: 1,
  });

  // =====================================================
  // LOAD — only companies the current user created
  // =====================================================
  const loadCompanies = async () => {
    setLoading(true);
    try {
      // true → sends ?only_mine=1 → backend filters by created_by
      const res = await fetchCompanies(true);
      setCompanies(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load companies.");
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyTypes = async () => {
    try {
      const res = await fetchCompanyTypes();
      setCompanyTypes(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load company types.");
    }
  };

  useEffect(() => {
    loadCompanies();
    loadCompanyTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================================
  // TABLE COLUMNS
  // =====================================================
  const columns = [
    { key: "sl",           header: "SL",      width: 60 },
    { key: "logo",         header: "Logo",    width: 70 },
    { key: "name",         header: "Name" },
    { key: "company_type", header: "Type" },
    { key: "contact",      header: "Contact" },
    { key: "email",        header: "Email" },
    { key: "status",       header: "Status" },
    { key: "actions",      header: "Actions" },
  ];

  // =====================================================
  // ROW DATA
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

    return companies.map((c, idx) => {
      const rowSnapshot = {
        id: c.id,
        name: c.name,
        company_type_id: c.company_type_id,
        address: c.address,
        contact: c.contact,
        email: c.email,
        logo: c.logo,
        status: c.status,
      };

      return {
        ...c,
        sl: idx + 1,
        logo: c.logo ? (
          <img
            src={logoUrlFromPath(c.logo)}
            alt=""
            className="h-8 w-8 object-contain rounded"
            onError={(e) => { e.target.style.visibility = "hidden"; }}
          />
        ) : (
          <span className="text-gray-400">—</span>
        ),
        name: c.name || "-",
        company_type: c.company_type?.name || "—",
        contact: c.contact || "-",
        email: c.email || "-",
        status: statusBadge(c.status),

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
  }, [companies, loading]);

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
      name: "",
      company_type_id: "",
      address: "",
      contact: "",
      email: "",
      status: 1,
    });
    setLogoFile(null);
    setLogoPreview("");
    setErrors({});
    setFormError("");
  };

  const validateForm = () => {
    const errs = {};

    if (!form.name.trim()) errs.name = "Name is required";
    else if (form.name.trim().length > 200)
      errs.name = "Name must be 200 characters or less";

    if (!form.company_type_id)
      errs.company_type_id = "Company type is required";

    if (!form.address.trim()) errs.address = "Address is required";

    if (!form.contact.trim()) errs.contact = "Contact is required";
    else if (form.contact.trim().length > 20)
      errs.contact = "Contact must be 20 characters or less";

    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
      errs.email = "Invalid email";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // =====================================================
  // LOGO HANDLER
  // =====================================================
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
      company_type_id: row.company_type_id ?? "",
      address: row.address || "",
      contact: row.contact || "",
      email: row.email || "",
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

  // =====================================================
  // SAVE (create or update)
  // =====================================================
  const handleSave = async () => {
    if (!validateForm()) {
      showErrorToast("Please fix the highlighted fields");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const payload = {
        name: form.name.trim(),
        company_type_id: Number(form.company_type_id),
        address: form.address.trim(),
        contact: form.contact.trim(),
        email: form.email.trim() || null,
        status: Number(form.status),
      };

      if (logoFile) {
        payload.logo = logoFile;
      }

      if (modalMode === "edit" && form.id) {
        await updateCompany({ id: form.id, ...payload });
        showSuccessToast("Company updated successfully");
      } else {
        await saveCompany(payload);
        showSuccessToast("Company created successfully");
      }

      closeModal();
      await loadCompanies();
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
      await deleteCompany(confirmRow.id);
      showSuccessToast(`"${confirmRow.name}" deleted`);
      setConfirmOpen(false);
      setConfirmRow(null);
      await loadCompanies();
    } catch (err) {
      showErrorToast(err.message || "Failed to delete");
    } finally {
      setConfirmBusy(false);
    }
  };

  // =====================================================
  // SELECT OPTIONS
  // =====================================================
  const typeOptions = useMemo(() => {
    return [
      { value: "", label: "— Select a company type —" },
      ...companyTypes.map((t) => ({ value: t.id, label: t.name })),
    ];
  }, [companyTypes]);

  const statusOptions = [
    { value: 1, label: "Active" },
    { value: 0, label: "Inactive" },
  ];

  const modalTitle =
    modalMode === "edit" ? "Edit Company" : "Add Company";

  const modalSubtitle =
    modalMode === "edit"
      ? editRow?.name || ""
      : "Create a new company";

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div>
      <PageHeader
        title="Companies"
        icon={Building2}
        breadcrumb
        onClickGuide={() => showInfoToast("Opening guide...")}
      />

      <CardBox
        title="My Companies"
        subTitle={`${companies.length} item(s)`}
        icon={Building2}
        headerBgColor="light"
        buttons={[
          {
            text: "Add Company",
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
              loadCompanies();
            },
          },
        ]}
      >
        <DataTable
          data={tableData}
          columns={columns}
          loading={loading}
          searchable
          searchPlaceholder="Search companies..."
          sortable
          paginated
          initialPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          striped
          stickyHeader
          emptyMessage="No companies yet"
          emptyHint="Click 'Add Company' to create your first one."
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
              label="Company Name"
              name="name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Acme Corp"
              required
              error={errors.name}
            />

            <SelectInput
              label="Company Type"
              name="company_type_id"
              value={form.company_type_id}
              onChange={(e) => setField("company_type_id", e.target.value)}
              options={typeOptions}
              required
              error={errors.company_type_id}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="Contact"
              name="contact"
              value={form.contact}
              onChange={(e) => setField("contact", e.target.value)}
              placeholder="e.g. 01700000000"
              icon={Phone}
              required
              error={errors.contact}
            />

            <TextInput
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="info@example.com"
              icon={Mail}
              error={errors.email}
            />
          </div>

          <TextArea
            label="Address"
            name="address"
            value={form.address}
            onChange={(e) => setField("address", e.target.value)}
            placeholder="Street, city, country..."
            rows={3}
            required
            error={errors.address}
          />

          {/* ─── Logo file input ─── */}
          <div className="form-group">
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Logo
            </label>

            <div className="flex items-center gap-3">
              <input
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                onChange={handleLogoChange}
                className="block text-sm text-gray-700 dark:text-gray-200 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700"
              />

              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-12 w-12 object-contain rounded border border-gray-200 dark:border-gray-600 bg-white"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              )}
            </div>

            <small className="block mt-1 text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, WEBP, or SVG. Max 2 MB. Leave blank to keep the current
              logo when editing.
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
            message="The slug is generated automatically from the company name."
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
          This action cannot be undone. Deletion will fail if any user is
          still assigned to this company.
        </p>
      </AppModal>
    </div>
  );
}