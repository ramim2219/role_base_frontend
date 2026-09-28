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
  Menu as MenuIcon,
  EyeOff,
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

const toSlug = (name) =>
  String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_/]/g, "");

const KIND_LABEL = { menu: "Menu", submenu: "Submenu", access: "Access" };

const ICON_SUGGESTIONS = [
  "fas fa-home",
  "fas fa-users",
  "fas fa-cog",
  "fas fa-chart-bar",
  "fas fa-file-alt",
  "fas fa-shopping-cart",
  "fas fa-bell",
  "fas fa-lock",
];

const EMPTY_FORM = {
  menuName: "",
  menuUrl: "",
  menuOrder: 1,
  status: "On",
  icon: "",
  type: "Menu", // hidden — sent to API
  parentId: 0, // hidden — sent to API
};

export default function AddMenu() {
  // =====================================================
  // STATE
  // =====================================================
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Quick filter (driven by the summary cards)
  const [kindFilter, setKindFilter] = useState("all"); // all | menu | submenu | access | inactive

  // Modal mode: "menu" | "submenu" | "access" | "edit"
  const [modalMode, setModalMode] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [parentRow, setParentRow] = useState(null); // for submenu/access
  const [editRow, setEditRow] = useState(null); // for edit
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState({});
  const [urlTouched, setUrlTouched] = useState(false);

  // Confirm-delete modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmRow, setConfirmRow] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Form state
  const [form, setForm] = useState(EMPTY_FORM);

  // What kind of item the modal is working with
  const formKind = modalMode === "edit" ? editRow?.kind : modalMode;
  const isAccessForm = formKind === "access";
  const isSubmenuForm = formKind === "submenu";

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

    const walk = (nodes, level = 0, kind = "menu") => {
      (nodes || []).forEach((node) => {
        rows.push({
          id: node.id,
          menu: node.menu,
          menu_url: node.menu_url,
          type: node.type,
          kind,
          status: node.status,
          menu_order: node.menu_order,
          parent_id: node.parent_id,
          icon: node.icon,
          level,
          childCount: 0,
        });

        if (Array.isArray(node.submenu) && node.submenu.length) {
          walk(node.submenu, level + 1, "submenu");
        }
        if (Array.isArray(node.access) && node.access.length) {
          walk(node.access, level + 1, "access");
        }
      });
    };

    walk(menus);

    // count all descendants (used in the delete warning)
    rows.forEach((row, i) => {
      let count = 0;
      for (let j = i + 1; j < rows.length && rows[j].level > row.level; j++) {
        count++;
      }
      row.childCount = count;
    });

    return rows;
  }, [menus]);

  // =====================================================
  // COUNTS + FILTERED ROWS
  // =====================================================
  const counts = useMemo(
    () => ({
      all: tableRows.length,
      menu: tableRows.filter((r) => r.kind === "menu").length,
      submenu: tableRows.filter((r) => r.kind === "submenu").length,
      access: tableRows.filter((r) => r.kind === "access").length,
      inactive: tableRows.filter(
        (r) => String(r.status || "").toLowerCase() !== "on"
      ).length,
    }),
    [tableRows]
  );

  const filteredRows = useMemo(() => {
    if (kindFilter === "all") return tableRows;
    if (kindFilter === "inactive") {
      return tableRows.filter(
        (r) => String(r.status || "").toLowerCase() !== "on"
      );
    }
    return tableRows.filter((r) => r.kind === kindFilter);
  }, [tableRows, kindFilter]);

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
    { key: "sl", header: "SL", width: 60 },
    { key: "icon", header: "Icon", align: "center", width: 60 },
    { key: "menu", header: "Name" },
    { key: "menu_url", header: "URL" },
    { key: "type", header: "Type" },
    { key: "menu_order", header: "Order", align: "right" },
    { key: "status", header: "Status" },
    { key: "add_action", header: "Add Under" },
    { key: "actions", header: "Actions" },
  ];

  // =====================================================
  // ROW DATA (with JSX cells for add_action + actions)
  // =====================================================
  const tableData = useMemo(() => {
    const badgeStyle = (bg) => ({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      minWidth: 78,
      padding: "4px 10px",
      borderRadius: 999,
      color: "#fff",
      fontSize: 12,
      fontWeight: 600,
      backgroundColor: bg,
    });

    const typeBadge = (kind) => {
      if (kind === "menu") return <span style={badgeStyle("#007bff")}>Menu</span>;
      if (kind === "submenu")
        return <span style={badgeStyle("#17a2b8")}>Submenu</span>;
      if (kind === "access")
        return <span style={badgeStyle("#fd7e14")}>Access</span>;
      return <span style={badgeStyle("#6c757d")}>Unknown</span>;
    };

    const statusBadge = (s) =>
      String(s || "").toLowerCase() === "on" ? (
        <span style={badgeStyle("#28a745")}>Active</span>
      ) : (
        <span style={badgeStyle("#dc3545")}>Inactive</span>
      );

    return filteredRows.map((r, idx) => {
      const canAddSubmenu = r.kind === "menu";
      const canAddAccess = r.kind === "menu" || r.kind === "submenu";

      // FULL snapshot — needed so the Edit modal prefills correctly
      const rowSnapshot = {
        id: r.id,
        menu: r.menu,
        menu_url: r.menu_url,
        type: r.type,
        kind: r.kind,
        status: r.status,
        menu_order: r.menu_order,
        parent_id: r.parent_id,
        icon: r.icon,
        childCount: r.childCount,
      };

      return {
        ...r,

        // ─── searchable raw values (not shown as columns) ───
        _name:        String(r.menu || "").toLowerCase(),
        _url:         String(r.menu_url || "").toLowerCase(),
        _kind:        String(r.kind || "").toLowerCase(),
        _kindLabel:   String(KIND_LABEL[r.kind] || "").toLowerCase(),
        _status:      String(r.status || "").toLowerCase(),
        _statusLabel: String(r.status || "").toLowerCase() === "on" ? "active" : "inactive",
        _icon:        String(r.icon || "").toLowerCase(),
        _order:       String(r.menu_order ?? ""),

        // ─── rendered cells ───
        sl: idx + 1,
        icon: r.icon ? <i className={r.icon} /> : <span className="text-gray-300">—</span>,
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
            <span style={{ opacity: 0.6 }}>
              {r.level === 0 ? "" : r.level === 1 ? "↳" : "•"}
            </span>
            <span className={r.level === 0 ? "font-semibold" : ""}>{r.menu}</span>
          </span>
        ),
        menu_url: r.menu_url ? (
          <code className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
            {r.menu_url}
          </code>
        ) : (
          <span className="text-gray-400">—</span>
        ),
        type: typeBadge(r.kind),
        menu_order: Number(r.menu_order || 0),
        status: statusBadge(r.status),

        // ─── Add Submenu / Add Access buttons ───
        add_action:
          canAddSubmenu || canAddAccess ? (
            <div className="flex gap-2 flex-wrap">
              {canAddSubmenu && (
                <button
                  type="button"
                  title={`Add a submenu under "${r.menu}"`}
                  onClick={() => openAddSubmenuModal(rowSnapshot)}
                  disabled={loading}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Submenu
                </button>
              )}
              {canAddAccess && (
                <button
                  type="button"
                  title={`Add an access permission under "${r.menu}"`}
                  onClick={() => openAddAccessModal(rowSnapshot)}
                  disabled={loading}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50"
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
              title={`Edit "${r.menu}"`}
              onClick={() => openEditModal(rowSnapshot)}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              type="button"
              title={`Delete "${r.menu}"`}
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
  }, [filteredRows, tableRows, loading]);

  // =====================================================
  // FORM HELPERS
  // =====================================================
  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
    if (formError) setFormError("");
  };

  // Name change — for new submenus, suggest a URL until the user edits it
  const handleNameChange = (value) => {
    setForm((prev) => {
      const next = { ...prev, menuName: value };
      if (modalMode === "submenu" && !urlTouched) next.menuUrl = toSlug(value);
      return next;
    });
    setErrors((prev) => ({ ...prev, menuName: "", menuUrl: "" }));
    if (formError) setFormError("");
  };

  const handleUrlChange = (value) => {
    setUrlTouched(true);
    setField("menuUrl", value);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setFormError("");
    setUrlTouched(false);
  };

  const validateForm = () => {
    const errs = {};
    const name = form.menuName.trim();

    if (!name) errs.menuName = "Name is required";

    if (name && isAccessForm && !toAccessUrl(name)) {
      errs.menuName = "Use letters or numbers in the name";
    }

    // duplicate name under the same parent (same kind)
    if (name && !errs.menuName) {
      const dup = tableRows.some(
        (r) =>
          r.id !== editRow?.id &&
          r.kind === formKind &&
          Number(r.parent_id || 0) === Number(form.parentId || 0) &&
          String(r.menu || "").trim().toLowerCase() === name.toLowerCase()
      );
      if (dup) errs.menuName = "An item with this name already exists here";
    }

    if (!form.menuOrder || Number(form.menuOrder) < 1)
      errs.menuOrder = "Order must be 1 or higher";

    if (isSubmenuForm && !form.menuUrl.trim())
      errs.menuUrl = "Submenu URL is required";

    if (!isAccessForm && form.icon.trim() && !isValidFaClass(form.icon))
      errs.icon = "Use a Font Awesome class, e.g. fas fa-home";

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
    setForm({
      ...EMPTY_FORM,
      menuOrder: getNextOrderForTopLevel(),
      type: "Menu",
      parentId: 0,
    });
    setModalOpen(true);
  };

  const openAddSubmenuModal = (row) => {
    setModalMode("submenu");
    setEditRow(null);
    setParentRow(row);
    resetForm();
    setForm({
      ...EMPTY_FORM,
      menuOrder: getNextOrderForParent(row.id),
      type: "Menu", // submenu is still type=Menu
      parentId: Number(row.id),
    });
    setModalOpen(true);
  };

  const openAddAccessModal = (row) => {
    setModalMode("access");
    setEditRow(null);
    setParentRow(row);
    resetForm();
    setForm({
      ...EMPTY_FORM,
      menuOrder: getNextOrderForParent(row.id),
      type: "Access",
      parentId: Number(row.id),
    });
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
    setUrlTouched(true);
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
    if (saving) return;

    if (!validateForm()) {
      showErrorToast("Please fix the highlighted fields");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const name = form.menuName.trim();

      // Access URL is generated from the name. When editing without renaming,
      // keep the stored URL untouched.
      let menuUrl;
      if (isAccessForm) {
        const unchanged =
          modalMode === "edit" &&
          name === String(editRow?.menu || "").trim() &&
          editRow?.menu_url;
        menuUrl = unchanged ? editRow.menu_url : toAccessUrl(name);
      } else {
        menuUrl = normalizeUrl(form.menuUrl);
      }

      const payload = {
        menuName: name,
        menuUrl,
        menuOrder: Number(form.menuOrder),
        parentId: Number(form.parentId) || 0,
        type: form.type,
        status: form.status,
        icon: isAccessForm ? null : form.icon?.trim() || null,
      };

      if (modalMode === "edit" && editRow?.id) {
        await updateMenu({ id: editRow.id, ...payload });
        showSuccessToast(`"${name}" updated successfully`);
      } else {
        await saveMenu(payload);
        showSuccessToast(`${KIND_LABEL[modalMode] || "Menu"} "${name}" created`);
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

  // Press Enter in any field to save
  const handleFormKeyDown = (e) => {
    if (e.key === "Enter" && !saving) {
      e.preventDefault();
      handleSave();
    }
  };

  // =====================================================
  // DELETE
  // =====================================================
  const askDelete = (row) => {
    setConfirmRow(row);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (confirmBusy) return;
    setConfirmOpen(false);
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
    { value: "On", label: "On — visible / active" },
    { value: "Off", label: "Off — hidden / inactive" },
  ];

  const modalTitle =
    modalMode === "edit"
      ? `Edit ${KIND_LABEL[editRow?.kind] || "Menu"}`
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

  const nameLabel = isSubmenuForm
    ? "Submenu Name"
    : isAccessForm
    ? "Access Name"
    : "Menu Name";

  const namePlaceholder = isSubmenuForm
    ? "e.g. Reports"
    : isAccessForm
    ? "e.g. can_view"
    : "e.g. Dashboard";

  // Summary cards double as quick filters
  const statCards = [
    {
      key: "all",
      label: "All items",
      icon: LayoutDashboard,
      iconClass: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200",
    },
    {
      key: "menu",
      label: "Menus",
      icon: MenuIcon,
      iconClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
    },
    {
      key: "submenu",
      label: "Submenus",
      icon: Folder,
      iconClass: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-300",
    },
    {
      key: "access",
      label: "Access",
      icon: Key,
      iconClass: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300",
    },
    {
      key: "inactive",
      label: "Inactive",
      icon: EyeOff,
      iconClass: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
    },
  ];

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

      {/* ─── Summary / quick filters ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          const active = kindFilter === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() =>
                setKindFilter(active && s.key !== "all" ? "all" : s.key)
              }
              aria-pressed={active}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors bg-white dark:bg-gray-800 hover:border-blue-400 ${
                active
                  ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <span
                className={`flex items-center justify-center w-10 h-10 rounded-lg ${s.iconClass}`}
              >
                <Icon className="w-5 h-5" />
              </span>
              <span>
                <span className="block text-xl font-bold text-gray-800 dark:text-gray-100 leading-tight">
                  {counts[s.key]}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {s.label}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <CardBox
        title="All Menus"
        subTitle={
          kindFilter !== "all"
            ? `Showing ${filteredRows.length} of ${tableRows.length} item(s)`
            : `${tableRows.length} item(s)`
        }
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
          searchPlaceholder="Search by name, URL, type, status, icon, order..."
          searchKeys={[
            "_name",
            "_url",
            "_kind",
            "_kindLabel",
            "_status",
            "_statusLabel",
            "_icon",
            "_order",
          ]}
          sortable
          paginated
          initialPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          striped
          stickyHeader
          emptyMessage={
            kindFilter !== "all" ? "No matching items" : "No menus yet"
          }
          emptyHint={
            kindFilter !== "all"
              ? "Try a different filter."
              : "Click 'Add Menu' to create your first menu."
          }
        />
      </CardBox>

      {/* ─── Add / Edit modal ─── */}
      <AppModal
        show={modalOpen}
        onHide={() => !saving && closeModal()}
        title={modalTitle}
        subtitle={modalSubtitle}
        icon={modalIcon}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <LoadingButton
              isLoading={saving}
              text={modalMode === "edit" ? "Save Changes" : "Create"}
              icon={Save}
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold uppercase transition-colors disabled:opacity-60"
            />
          </div>
        }
      >
        <div className="space-y-4" onKeyDown={handleFormKeyDown}>
          {formError && <AlertMessage type="danger" message={formError} />}

          {parentRow && (
            <AlertMessage
              type="info"
              message={`Parent: ${parentRow.menu} (${KIND_LABEL[parentRow.kind] || parentRow.type})`}
            />
          )}

          <TextInput
            label={nameLabel}
            name="menuName"
            value={form.menuName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={namePlaceholder}
            required
            error={errors.menuName}
          />

          {isAccessForm ? (
            <>
              <AlertMessage
                type="info"
                message={`Access key (auto-generated): ${
                  toAccessUrl(form.menuName) || "—"
                }`}
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
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <TextInput
                  label={isSubmenuForm ? "Menu URL (Required)" : "Menu URL"}
                  name="menuUrl"
                  value={form.menuUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="e.g. dashboard"
                  required={isSubmenuForm}
                  error={errors.menuUrl}
                />
                <small className="block mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {isSubmenuForm
                    ? "Suggested from the name — you can change it."
                    : "Leave empty if this menu only groups submenus."}
                </small>
              </div>
              <div>
                <TextInput
                  label="Order"
                  name="menuOrder"
                  type="number"
                  value={form.menuOrder}
                  onChange={(e) => setField("menuOrder", e.target.value)}
                  required
                  error={errors.menuOrder}
                />
                <small className="block mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Lower numbers appear first.
                </small>
              </div>
            </div>
          )}

          <SelectInput
            label="Status"
            name="status"
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
            options={statusOptions}
          />

          {!isAccessForm && (
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
                    error={errors.icon}
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

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Quick pick:
                </span>
                {ICON_SUGGESTIONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    title={ic}
                    onClick={() => setField("icon", ic)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md border text-sm transition-colors ${
                      form.icon === ic
                        ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/30"
                        : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <i className={ic} />
                  </button>
                ))}
                {form.icon && (
                  <button
                    type="button"
                    onClick={() => setField("icon", "")}
                    className="text-xs text-gray-500 hover:text-red-600 underline"
                  >
                    Clear
                  </button>
                )}
              </div>

              <small className="block mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter a Font Awesome class, e.g. <code>fas fa-home</code>
              </small>
            </div>
          )}
        </div>
      </AppModal>

      {/* ─── Confirm Delete ─── */}
      <AppModal
        show={confirmOpen}
        onHide={closeConfirm}
        title="Confirm Delete"
        subtitle={confirmRow ? `Delete "${confirmRow.menu}"?` : ""}
        icon={AlertTriangle}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeConfirm}
              disabled={confirmBusy}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <LoadingButton
              isLoading={confirmBusy}
              text="Delete"
              icon={Trash2}
              onClick={confirmDelete}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold uppercase transition-colors disabled:opacity-60"
            />
          </div>
        }
      >
        <div className="space-y-3">
          {confirmRow?.childCount > 0 && (
            <AlertMessage
              type="danger"
              message={`This will also delete ${confirmRow.childCount} nested item(s) (submenus / access) under "${confirmRow.menu}".`}
            />
          )}
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This action cannot be undone. Child menus and allocations will also
            be permanently removed.
          </p>
        </div>
      </AppModal>
    </div>
  );
}