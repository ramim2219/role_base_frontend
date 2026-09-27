// src/pages/AddMenu.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  LayoutDashboard,
  Save,
  AlertTriangle,
  RefreshCw,
  Folder,
  Key,
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
  fetchAllMenus,
  saveMenu,
  updateMenu,
  deleteMenu,
} from "../../services/MenuServices";

// ─── helpers ──────────────────────────────────────────
const isValidFaClass = (v) => /^fa[rsbdl]?\s+fa-/.test(String(v || "").trim());

const normalizeUrl = (v) => String(v || "").trim().replace(/^\/+/, "");

const toAccessUrl = (name) =>
  String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

export default function AddMenu() {
  // =====================================================
  // STATE
  // =====================================================
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal mode: "menu" | "submenu" | "access" | "edit"
  const [modalMode, setModalMode] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [parentRow, setParentRow] = useState(null); // for submenu/access
  const [editRow, setEditRow] = useState(null);     // for edit
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState({});

  // Confirm-delete modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmRow, setConfirmRow] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Form state
  const [form, setForm] = useState({
    menuName: "",
    menuUrl: "",
    menuOrder: 1,
    status: "On",
    icon: "",
    type: "Menu",   // hidden — sent to API
    parentId: 0,    // hidden — sent to API
  });

  // =====================================================
  // LOAD MENUS
  // =====================================================
  const loadMenus = async () => {
    setLoading(true);
    try {
      const res = await fetchAllMenus();
      setMenus(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load menus.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, []);

  // =====================================================
  // FLATTEN TREE → TABLE ROWS
  // =====================================================
  const tableRows = useMemo(() => {
    const rows = [];

    const walk = (nodes, level = 0) => {
      (nodes || []).forEach((node) => {
        rows.push({
          id: node.id,
          menu: node.menu,
          menu_url: node.menu_url,
          type: node.type,
          status: node.status,
          menu_order: node.menu_order,
          parent_id: node.parent_id,
          icon: node.icon,
          level,
        });

        if (Array.isArray(node.submenu) && node.submenu.length) {
          walk(node.submenu, level + 1);
        }
        if (Array.isArray(node.access) && node.access.length) {
          walk(node.access, level + 1);
        }
      });
    };

    walk(menus);
    return rows;
  }, [menus]);

  // =====================================================
  // NEXT-ORDER HELPERS
  // =====================================================
  const getNextOrderForTopLevel = () => {
    const top = tableRows.filter(
      (r) =>
        Number(r.parent_id || 0) === 0 &&
        String(r.type || "").toLowerCase() === "menu"
    );
    const max = top.reduce(
      (mx, r) => Math.max(mx, Number(r.menu_order || 0)),
      0
    );
    return max + 1;
  };

  const getNextOrderForParent = (parentId) => {
    const siblings = tableRows.filter(
      (r) => Number(r.parent_id) === Number(parentId)
    );
    const max = siblings.reduce(
      (mx, r) => Math.max(mx, Number(r.menu_order || 0)),
      0
    );
    return max + 1;
  };

  // =====================================================
  // TABLE COLUMNS
  // =====================================================
  const columns = [
    { key: "sl",          header: "SL",     width: 60 },
    { key: "icon",        header: "",       align: "center", width: 50 },
    { key: "menu",        header: "Menu" },
    { key: "menu_url",    header: "URL" },
    { key: "type",        header: "Type" },
    { key: "menu_order",  header: "Order",  align: "right" },
    { key: "status",      header: "Status" },
    { key: "add_action",  header: "Add" },
    { key: "actions",     header: "Actions" },
  ];

  // =====================================================
  // ROW DATA (with JSX cells for add_action + actions)
  // =====================================================
  const tableData = useMemo(() => {
    const badgeStyle = (bg) => ({
      display: "inline-block",
      minWidth: 78,
      textAlign: "center",
      padding: "4px 10px",
      borderRadius: 999,
      color: "#fff",
      fontSize: 12,
      fontWeight: 600,
      backgroundColor: bg,
    });

    const typeBadge = (type) => {
      const t = String(type || "").toLowerCase();
      if (t === "menu")    return <span style={badgeStyle("#007bff")}>Menu</span>;
      if (t === "submenu") return <span style={badgeStyle("#17a2b8")}>Submenu</span>;
      if (t === "access")  return <span style={badgeStyle("#fd7e14")}>Access</span>;
      return <span style={badgeStyle("#6c757d")}>?</span>;
    };

    const statusBadge = (s) =>
      String(s || "").toLowerCase() === "on" ? (
        <span style={badgeStyle("#28a745")}>Active</span>
      ) : (
        <span style={badgeStyle("#dc3545")}>Inactive</span>
      );

    return tableRows.map((r, idx) => {
      const t = String(r.type || "").toLowerCase();
      const canAddSubmenu = t === "menu";
      const canAddAccess  = t === "menu" || t === "submenu";

      // ─── FULL snapshot — needed so Edit modal prefills correctly ───
      const rowSnapshot = {
        id: r.id,
        menu: r.menu,
        menu_url: r.menu_url,
        type: r.type,
        status: r.status,
        menu_order: r.menu_order,
        parent_id: r.parent_id,
        icon: r.icon,
      };

      return {
        ...r,
        sl: idx + 1,
        icon: r.icon ? <i className={r.icon} /> : null,
        menu: (
          <span
            style={{
              paddingLeft: (r.level || 0) * 18,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ opacity: 0.8 }}>
              {r.level === 0 ? "" : r.level === 1 ? "↳" : "•"}
            </span>
            <span>{r.menu}</span>
          </span>
        ),
        menu_url: r.menu_url || "-",
        type: typeBadge(r.type),
        menu_order: Number(r.menu_order || 0),
        status: statusBadge(r.status),

        // ─── Add Submenu / Add Access buttons ───
        add_action:
          canAddSubmenu || canAddAccess ? (
            <div className="flex gap-2 flex-wrap">
              {canAddSubmenu && (
                <button
                  type="button"
                  onClick={() => openAddSubmenuModal(rowSnapshot)}
                  disabled={loading}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Submenu
                </button>
              )}
              {canAddAccess && (
                <button
                  type="button"
                  onClick={() => openAddAccessModal(rowSnapshot)}
                  disabled={loading}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-emerald-500 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                >
                  <Key className="w-3.5 h-3.5" />
                  Access
                </button>
              )}
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          ),

        // ─── Edit / Delete buttons ───
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
  }, [tableRows, loading]);

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
      menuName: "",
      menuUrl: "",
      menuOrder: 1,
      status: "On",
      icon: "",
      type: "Menu",
      parentId: 0,
    });
    setErrors({});
    setFormError("");
  };

  const validateForm = () => {
    const errs = {};
    if (!form.menuName.trim()) errs.menuName = "Name is required";
    if (!form.menuOrder || Number(form.menuOrder) < 1)
      errs.menuOrder = "Order must be >= 1";
    if (modalMode === "submenu" && !form.menuUrl.trim())
      errs.menuUrl = "Submenu URL is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // =====================================================
  // OPEN MODALS
  // =====================================================
  const openCreateMenuModal = () => {
    setModalMode("menu");
    setEditRow(null);
    setParentRow(null);
    resetForm();
    setForm((prev) => ({
      ...prev,
      menuOrder: getNextOrderForTopLevel(),
      type: "Menu",
      parentId: 0,
    }));
    setModalOpen(true);
  };

  const openAddSubmenuModal = (row) => {
    setModalMode("submenu");
    setEditRow(null);
    setParentRow(row);
    resetForm();
    setForm((prev) => ({
      ...prev,
      menuOrder: getNextOrderForParent(row.id),
      type: "Menu",                  // submenu is still type=Menu
      parentId: Number(row.id),
    }));
    setModalOpen(true);
  };

  const openAddAccessModal = (row) => {
    setModalMode("access");
    setEditRow(null);
    setParentRow(row);
    resetForm();
    setForm((prev) => ({
      ...prev,
      menuOrder: getNextOrderForParent(row.id),
      type: "Access",
      parentId: Number(row.id),
    }));
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setModalMode("edit");
    setEditRow(row);
    setParentRow(null);
    setForm({
      menuName: row.menu || "",
      menuUrl: row.menu_url || "",
      menuOrder: Number(row.menu_order) || 1,
      status: row.status || "On",
      icon: row.icon || "",
      type: row.type || "Menu",
      parentId: Number(row.parent_id) || 0,
    });
    setErrors({});
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalMode(null);
    setEditRow(null);
    setParentRow(null);
    resetForm();
  };

  // =====================================================
  // SAVE
  // =====================================================
  const handleSave = async () => {
    if (!validateForm()) {
      showErrorToast("Please fix the highlighted fields");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const isAccess = modalMode === "access";

      const payload = {
        menuName: form.menuName.trim(),
        menuUrl: isAccess
          ? toAccessUrl(form.menuName)
          : normalizeUrl(form.menuUrl),
        menuOrder: Number(form.menuOrder),
        parentId: Number(form.parentId) || 0,
        type: form.type,
        status: form.status,
        icon: form.icon?.trim() || null,
      };

      if (modalMode === "edit" && editRow?.id) {
        await updateMenu({ id: editRow.id, ...payload });
        showSuccessToast("Updated successfully");
      } else {
        await saveMenu(payload);
        const label =
          modalMode === "submenu"
            ? "Submenu"
            : modalMode === "access"
            ? "Access"
            : "Menu";
        showSuccessToast(`${label} created successfully`);
      }

      closeModal();
      await loadMenus();
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
      await deleteMenu(confirmRow.id);
      showSuccessToast(`"${confirmRow.menu}" deleted`);
      setConfirmOpen(false);
      setConfirmRow(null);
      await loadMenus();
    } catch (err) {
      showErrorToast(err.message || "Failed to delete");
    } finally {
      setConfirmBusy(false);
    }
  };

  // =====================================================
  // OPTIONS + MODAL DERIVED VALUES
  // =====================================================
  const statusOptions = [
    { value: "On",  label: "On" },
    { value: "Off", label: "Off" },
  ];

  const modalTitle =
    modalMode === "edit"
      ? `Edit ${editRow?.type || "Menu"}`
      : modalMode === "submenu"
      ? "Add Submenu"
      : modalMode === "access"
      ? "Add Access"
      : "Add Menu";

  const modalSubtitle =
    modalMode === "edit"
      ? editRow?.menu
      : modalMode === "submenu" || modalMode === "access"
      ? `Under: ${parentRow?.menu}`
      : "Create a new top-level menu";

  const modalIcon =
    modalMode === "edit"
      ? Pencil
      : modalMode === "submenu"
      ? Folder
      : modalMode === "access"
      ? Key
      : Plus;

  const nameLabel =
    modalMode === "submenu"
      ? "Submenu Name"
      : modalMode === "access"
      ? "Access Name"
      : "Menu Name";

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div>
      <PageHeader
        title="Menu Management"
        icon={LayoutDashboard}
        breadcrumb
        onClickGuide={() => showInfoToast("Opening guide...")}
      />

      <CardBox
        title="All Menus"
        subTitle={`${tableRows.length} item(s)`}
        icon={LayoutDashboard}
        headerBgColor="light"
        buttons={[
          {
            text: "Add Menu",
            icon: Plus,
            color: "primary",
            onClick: openCreateMenuModal,
          },
          {
            text: "Refresh",
            icon: RefreshCw,
            color: "secondary",
            onClick: () => {
              showInfoToast("Refreshing...");
              loadMenus();
            },
          },
        ]}
      >
        <DataTable
          data={tableData}
          columns={columns}
          loading={loading}
          searchable
          searchPlaceholder="Search menus..."
          sortable
          paginated
          initialPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          striped
          stickyHeader
          emptyMessage="No menus yet"
          emptyHint="Click 'Add Menu' to create your first menu."
        />
      </CardBox>

      {/* ─── Add / Edit modal — Save only ─── */}
      <AppModal
        show={modalOpen}
        onHide={closeModal}
        title={modalTitle}
        subtitle={modalSubtitle}
        icon={modalIcon}
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

          {parentRow && (
            <AlertMessage
              type="info"
              message={`Parent: ${parentRow.menu} (${parentRow.type})`}
            />
          )}

          <TextInput
            label={nameLabel}
            name="menuName"
            value={form.menuName}
            onChange={(e) => setField("menuName", e.target.value)}
            placeholder={
              modalMode === "submenu"
                ? "e.g. Reports"
                : modalMode === "access"
                ? "e.g. can_view"
                : "e.g. Dashboard"
            }
            required
            error={errors.menuName}
          />

          {modalMode !== "access" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label={modalMode === "submenu" ? "Menu URL (Required)" : "Menu URL"}
                name="menuUrl"
                value={form.menuUrl}
                onChange={(e) => setField("menuUrl", e.target.value)}
                placeholder="e.g. dashboard"
                required={modalMode === "submenu"}
                error={errors.menuUrl}
              />
              <TextInput
                label="Order"
                name="menuOrder"
                type="number"
                value={form.menuOrder}
                onChange={(e) => setField("menuOrder", e.target.value)}
                required
                error={errors.menuOrder}
              />
            </div>
          ) : (
            <TextInput
              label="Order"
              name="menuOrder"
              type="number"
              value={form.menuOrder}
              onChange={(e) => setField("menuOrder", e.target.value)}
              required
              error={errors.menuOrder}
            />
          )}

          <SelectInput
            label="Status"
            name="status"
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
            options={statusOptions}
          />

          {modalMode !== "access" && (
            <div className="form-group">
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Icon
              </label>
              <div className="flex items-stretch gap-2">
                <div className="flex-1">
                  <TextInput
                    name="icon"
                    value={form.icon}
                    onChange={(e) => setField("icon", e.target.value)}
                    placeholder="e.g. fas fa-home"
                  />
                </div>
                <div
                  className="flex items-center justify-center px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                  style={{ minWidth: 64 }}
                >
                  {form.icon ? (
                    isValidFaClass(form.icon) ? (
                      <i className={form.icon} style={{ fontSize: 20 }} />
                    ) : (
                      <span className="text-xs text-red-500">?</span>
                    )
                  ) : (
                    <span className="text-xs text-gray-400">Preview</span>
                  )}
                </div>
              </div>
              <small className="block mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter a Font Awesome class, e.g. <code>fas fa-home</code>
              </small>
            </div>
          )}
        </div>
      </AppModal>

      {/* ─── Confirm Delete — Delete only ─── */}
      <AppModal
        show={confirmOpen}
        onHide={() => setConfirmOpen(false)}
        title="Confirm Delete"
        subtitle={confirmRow ? `Delete "${confirmRow.menu}"?` : ""}
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
          This action cannot be undone. Child menus and allocations will also
          be permanently removed.
        </p>
      </AppModal>
    </div>
  );
}