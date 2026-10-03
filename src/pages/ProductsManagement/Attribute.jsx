// src/pages/AttributeManagement/Attribute.jsx
import { useEffect, useMemo, useState } from "react";
import {
  ListTree,
  ListOrdered,
  Plus,
  Pencil,
  Trash2,
  Save,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import PageHeader from "../../components/PageHeader";
import CardBox from "../../components/CardBox";
import AppModal from "../../components/AppModal";
import AlertMessage from "../../components/AlertMessage";
import TextInput from "../../components/TextInput";
import SelectInput from "../../components/SelectInput";
import LoadingButton from "../../components/LoadingButton";

import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from "../../Helper/TosterHelper";

import {
  fetchAttributes,
  saveAttribute,
  updateAttribute,
  deleteAttribute,
  fetchAttributeValues,
  saveAttributeValue,
  updateAttributeValue,
  deleteAttributeValue,
} from "../../services/attributeServices";

import { useAuth } from "../../context/AuthContext";

// ─── Options ─────────────────────────────────────────────
const INPUT_TYPE_OPTIONS = [
  { value: "text",        label: "Text" },
  { value: "number",      label: "Number" },
  { value: "select",      label: "Select (single choice)" },
  { value: "multiselect", label: "Multi-select" },
  { value: "color",       label: "Color" },
  { value: "boolean",     label: "Boolean (Yes/No)" },
];

const STATUS_OPTIONS = [
  { value: 1, label: "Active" },
  { value: 0, label: "Inactive" },
];

const EMPTY_ATTR_FORM = {
  id: 0,
  name: "",
  display_name: "",
  input_type: "select",
  is_variant_attribute: false,
  status: 1,
};

const EMPTY_VALUE_FORM = {
  id: 0,
  value: "",
  display_name: "",
  sort_order: 0,
  status: 1,
};

export default function Attribute() {
  const { user } = useAuth();
  const myCompanyId = user?.company_id ?? null;

  // ─── STATE ───────────────────────────────────────────
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Attribute modal
  const [attrModalOpen, setAttrModalOpen] = useState(false);
  const [attrMode, setAttrMode] = useState(null); // "create" | "edit"
  const [attrEditRow, setAttrEditRow] = useState(null);
  const [attrForm, setAttrForm] = useState(EMPTY_ATTR_FORM);
  const [attrSaving, setAttrSaving] = useState(false);
  const [attrError, setAttrError] = useState("");
  const [attrErrors, setAttrErrors] = useState({});

  // Value modal
  const [valueModalOpen, setValueModalOpen] = useState(false);
  const [valueMode, setValueMode] = useState(null); // "create" | "edit"
  const [valueEditRow, setValueEditRow] = useState(null);
  const [valueParent, setValueParent] = useState(null); // the attribute owning this value
  const [valueForm, setValueForm] = useState(EMPTY_VALUE_FORM);
  const [valueSaving, setValueSaving] = useState(false);
  const [valueError, setValueError] = useState("");
  const [valueErrors, setValueErrors] = useState({});

  // Confirm delete (attribute)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmRow, setConfirmRow] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Confirm delete (value)
  const [valueConfirmOpen, setValueConfirmOpen] = useState(false);
  const [valueConfirmRow, setValueConfirmRow] = useState(null);
  const [valueConfirmBusy, setValueConfirmBusy] = useState(false);

  // Which attribute rows are expanded (values panel open)
  const [expanded, setExpanded] = useState(new Set());

  // Cache of values by attribute id: { [attrId]: [ {..value}, ... ] }
  const [valuesByAttr, setValuesByAttr] = useState({});
  const [valuesLoading, setValuesLoading] = useState({});

  // ─── LOAD ATTRIBUTES ─────────────────────────────────
  const loadAttributes = async () => {
    setLoading(true);
    try {
      const res = await fetchAttributes();
      setAttributes(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load attributes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttributes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── LOAD VALUES FOR ONE ATTRIBUTE ───────────────────
  const loadValues = async (attrId) => {
    setValuesLoading((prev) => ({ ...prev, [attrId]: true }));
    try {
      const res = await fetchAttributeValues(attrId);
      setValuesByAttr((prev) => ({ ...prev, [attrId]: res.data || [] }));
    } catch (err) {
      showErrorToast(err.message || "Failed to load values.");
    } finally {
      setValuesLoading((prev) => ({ ...prev, [attrId]: false }));
    }
  };

  // ─── TOGGLE EXPANSION ────────────────────────────────
  const toggleExpand = async (attrId) => {
    const isOpen = expanded.has(attrId);

    setExpanded((prev) => {
      const next = new Set(prev);
      isOpen ? next.delete(attrId) : next.add(attrId);
      return next;
    });

    // Load values the first time the panel opens
    if (!isOpen && !valuesByAttr[attrId]) {
      await loadValues(attrId);
    }
  };

  // ─── ATTRIBUTE FORM HELPERS ──────────────────────────
  const setAttrField = (key, value) => {
    setAttrForm((prev) => ({ ...prev, [key]: value }));
    if (attrErrors[key]) setAttrErrors((prev) => ({ ...prev, [key]: "" }));
    if (attrError) setAttrError("");
  };

  const resetAttrForm = () => {
    setAttrForm(EMPTY_ATTR_FORM);
    setAttrErrors({});
    setAttrError("");
  };

  const validateAttrForm = () => {
    const errs = {};
    if (!attrForm.name.trim()) errs.name = "Name is required";
    else if (attrForm.name.trim().length > 100)
      errs.name = "Name must be 100 characters or less";
    if (!attrForm.display_name.trim()) errs.display_name = "Display name is required";
    if (!attrForm.input_type) errs.input_type = "Input type is required";
    setAttrErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openCreateAttrModal = () => {
    if (!myCompanyId) {
      showErrorToast("Your account is not linked to a company.");
      return;
    }
    setAttrMode("create");
    setAttrEditRow(null);
    resetAttrForm();
    setAttrModalOpen(true);
  };

  const openEditAttrModal = (row) => {
    setAttrMode("edit");
    setAttrEditRow(row);
    setAttrForm({
      id: row.id,
      name: row.name || "",
      display_name: row.display_name || "",
      input_type: row.input_type || "select",
      is_variant_attribute: !!row.is_variant_attribute,
      status: Number(row.status) === 1 ? 1 : 0,
    });
    setAttrErrors({});
    setAttrError("");
    setAttrModalOpen(true);
  };

  const closeAttrModal = () => {
    setAttrModalOpen(false);
    setAttrMode(null);
    setAttrEditRow(null);
    resetAttrForm();
  };

  const saveAttr = async () => {
    if (!validateAttrForm()) {
      showErrorToast("Please fix the highlighted fields");
      return;
    }
    if (!myCompanyId) {
      const msg = "Your account is not linked to a company.";
      setAttrError(msg);
      showErrorToast(msg);
      return;
    }

    setAttrSaving(true);
    setAttrError("");

    try {
      const payload = {
        company_id: Number(myCompanyId),
        name: attrForm.name.trim(),
        display_name: attrForm.display_name.trim(),
        input_type: attrForm.input_type,
        is_variant_attribute: attrForm.is_variant_attribute ? 1 : 0,
        status: Number(attrForm.status),
      };

      if (attrMode === "edit" && attrForm.id) {
        await updateAttribute({ id: attrForm.id, ...payload });
        showSuccessToast("Attribute updated");
      } else {
        await saveAttribute(payload);
        showSuccessToast("Attribute created");
      }

      closeAttrModal();
      await loadAttributes();
    } catch (err) {
      const msg = err.message || "Failed to save";
      setAttrError(msg);
      showErrorToast(msg);
    } finally {
      setAttrSaving(false);
    }
  };

  const askDeleteAttr = (row) => {
    setConfirmRow(row);
    setConfirmOpen(true);
  };

  const confirmDeleteAttr = async () => {
    if (!confirmRow?.id) return;
    setConfirmBusy(true);
    try {
      await deleteAttribute(confirmRow.id);
      showSuccessToast(`"${confirmRow.display_name}" deleted`);

      // Drop cached values for that attribute
      setValuesByAttr((prev) => {
        const next = { ...prev };
        delete next[confirmRow.id];
        return next;
      });
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(confirmRow.id);
        return next;
      });

      setConfirmOpen(false);
      setConfirmRow(null);
      await loadAttributes();
    } catch (err) {
      showErrorToast(err.message || "Failed to delete");
    } finally {
      setConfirmBusy(false);
    }
  };

  // ─── VALUE FORM HELPERS ──────────────────────────────
  const setValueField = (key, value) => {
    setValueForm((prev) => ({ ...prev, [key]: value }));
    if (valueErrors[key]) setValueErrors((prev) => ({ ...prev, [key]: "" }));
    if (valueError) setValueError("");
  };

  const resetValueForm = () => {
    setValueForm(EMPTY_VALUE_FORM);
    setValueErrors({});
    setValueError("");
  };

  const nextSortOrder = (attrId) => {
    const list = valuesByAttr[attrId] || [];
    if (!list.length) return 1;
    return Math.max(...list.map((v) => Number(v.sort_order || 0))) + 1;
  };

  const validateValueForm = () => {
    const errs = {};
    if (!valueForm.value.trim()) errs.value = "Value is required";
    else if (valueForm.value.trim().length > 100)
      errs.value = "Value must be 100 characters or less";
    if (!valueForm.display_name.trim())
      errs.display_name = "Display name is required";
    setValueErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openCreateValueModal = (attribute) => {
    setValueMode("create");
    setValueParent(attribute);
    setValueEditRow(null);
    resetValueForm();
    setValueForm({
      ...EMPTY_VALUE_FORM,
      sort_order: nextSortOrder(attribute.id),
    });
    setValueModalOpen(true);
  };

  const openEditValueModal = (attribute, value) => {
    setValueMode("edit");
    setValueParent(attribute);
    setValueEditRow(value);
    setValueForm({
      id: value.id,
      value: value.value || "",
      display_name: value.display_name || "",
      sort_order: Number(value.sort_order || 0),
      status: Number(value.status) === 1 ? 1 : 0,
    });
    setValueErrors({});
    setValueError("");
    setValueModalOpen(true);
  };

  const closeValueModal = () => {
    setValueModalOpen(false);
    setValueMode(null);
    setValueEditRow(null);
    setValueParent(null);
    resetValueForm();
  };

  const saveValue = async () => {
    if (!validateValueForm()) {
      showErrorToast("Please fix the highlighted fields");
      return;
    }
    if (!valueParent?.id) return;

    setValueSaving(true);
    setValueError("");

    try {
      const payload = {
        attribute_id: valueParent.id,
        value: valueForm.value.trim(),
        display_name: valueForm.display_name.trim(),
        sort_order: Number(valueForm.sort_order || 0),
        status: Number(valueForm.status),
      };

      if (valueMode === "edit" && valueForm.id) {
        await updateAttributeValue({ id: valueForm.id, ...payload });
        showSuccessToast("Value updated");
      } else {
        await saveAttributeValue(payload);
        showSuccessToast("Value created");
      }

      closeValueModal();
      await loadValues(valueParent.id);
    } catch (err) {
      const msg = err.message || "Failed to save";
      setValueError(msg);
      showErrorToast(msg);
    } finally {
      setValueSaving(false);
    }
  };

  const askDeleteValue = (attribute, value) => {
    setValueParent(attribute);
    setValueConfirmRow(value);
    setValueConfirmOpen(true);
  };

  const confirmDeleteValue = async () => {
    if (!valueConfirmRow?.id || !valueParent?.id) return;
    setValueConfirmBusy(true);
    try {
      await deleteAttributeValue(valueConfirmRow.id);
      showSuccessToast(`"${valueConfirmRow.display_name}" deleted`);
      setValueConfirmOpen(false);
      setValueConfirmRow(null);
      await loadValues(valueParent.id);
    } catch (err) {
      showErrorToast(err.message || "Failed to delete");
    } finally {
      setValueConfirmBusy(false);
    }
  };

  // ─── DERIVED ─────────────────────────────────────────
  const attrModalTitle = attrMode === "edit" ? "Edit Attribute" : "Add Attribute";
  const attrModalSubtitle =
    attrMode === "edit"
      ? attrEditRow?.display_name || ""
      : "Create a new attribute";

  const valueModalTitle = valueMode === "edit" ? "Edit Value" : "Add Value";
  const valueModalSubtitle =
    valueMode === "edit"
      ? valueEditRow?.display_name || ""
      : `For attribute: ${valueParent?.display_name || ""}`;

  // ─── RENDER ──────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Attributes"
        icon={ListTree}
        breadcrumb
        onClickGuide={() => showInfoToast("Opening guide...")}
      />

      <CardBox
        title="My Attributes"
        subTitle={`${attributes.length} item(s)`}
        icon={ListTree}
        headerBgColor="light"
        buttons={[
          {
            text: "Add Attribute",
            icon: Plus,
            color: "primary",
            onClick: openCreateAttrModal,
          },
          {
            text: "Refresh",
            icon: RefreshCw,
            color: "secondary",
            onClick: () => {
              showInfoToast("Refreshing...");
              loadAttributes();
              setValuesByAttr({});
            },
          },
        ]}
      >
        {loading ? (
          <div className="py-10 text-center text-gray-500">
            <RefreshCw className="inline-block animate-spin mb-2" />
            <div>Loading attributes…</div>
          </div>
        ) : attributes.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            <ListTree className="inline-block mb-2 w-6 h-6 opacity-40" />
            <div>No attributes yet</div>
            <div className="text-xs mt-1">
              Click <strong>Add Attribute</strong> to create your first one.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {attributes.map((attr) => {
              const isOpen = expanded.has(attr.id);
              const vals = valuesByAttr[attr.id] || [];
              const isLoadingVals = valuesLoading[attr.id];

              return (
                <div
                  key={attr.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
                >
                  {/* ─── Attribute header row ─── */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleExpand(attr.id)}
                        className="mt-0.5 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        title={isOpen ? "Collapse" : "Expand"}
                      >
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-800 dark:text-white">
                            {attr.display_name}
                          </span>
                          <code className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {attr.name}
                          </code>

                          {/* input type chip */}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {INPUT_TYPE_OPTIONS.find((o) => o.value === attr.input_type)?.label ||
                              attr.input_type}
                          </span>

                          {/* variant chip */}
                          {attr.is_variant_attribute ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              Variant
                            </span>
                          ) : null}

                          {/* status chip */}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] ${
                              Number(attr.status) === 1
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                            }`}
                          >
                            {Number(attr.status) === 1 ? "Active" : "Inactive"}
                          </span>
                        </div>

                        {!isOpen && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {vals.length} value{vals.length === 1 ? "" : "s"} loaded
                            {attrsHasNoCache(valuesByAttr, attr.id) ? " (expand to load)" : ""}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ─── Actions ─── */}
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() => toggleExpand(attr.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        {isOpen ? (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" /> Hide Values
                          </>
                        ) : (
                          <>
                            <ListOrdered className="w-3.5 h-3.5" /> Manage Values
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditAttrModal(attr)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => askDeleteAttr(attr)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>

                  {/* ─── Values panel ─── */}
                  {isOpen && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                          Values ({vals.length})
                        </h4>
                        <button
                          type="button"
                          onClick={() => openCreateValueModal(attr)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Value
                        </button>
                      </div>

                      {isLoadingVals ? (
                        <div className="text-xs text-gray-500 py-4 text-center">
                          Loading values…
                        </div>
                      ) : vals.length === 0 ? (
                        <div className="text-xs text-gray-500 py-4 text-center">
                          No values yet. Click <strong>Add Value</strong> to
                          create the first one.
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          {vals.map((v) => (
                            <li
                              key={v.id}
                              className="flex items-center justify-between gap-3 px-3 py-2"
                            >
                              <div className="min-w-0 flex items-center gap-2">
                                <code className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                  {v.value}
                                </code>
                                <span className="text-sm text-gray-800 dark:text-gray-100 truncate">
                                  {v.display_name}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  #{v.sort_order}
                                </span>
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] ${
                                    Number(v.status) === 1
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                      : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                                  }`}
                                >
                                  {Number(v.status) === 1 ? "Active" : "Inactive"}
                                </span>
                              </div>

                              <div className="flex gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openEditValueModal(attr, v)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                >
                                  <Pencil className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => askDeleteValue(attr, v)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardBox>

      {/* ═══════════ Attribute Modal ═══════════ */}
      <AppModal
        show={attrModalOpen}
        onHide={closeAttrModal}
        title={attrModalTitle}
        subtitle={attrModalSubtitle}
        icon={attrMode === "edit" ? Pencil : Plus}
        size="lg"
        footer={
          <LoadingButton
            isLoading={attrSaving}
            text={attrMode === "edit" ? "Save Changes" : "Create"}
            icon={Save}
            onClick={saveAttr}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold uppercase transition-colors disabled:opacity-60"
          />
        }
      >
        <div className="space-y-4">
          {attrError && <AlertMessage type="danger" message={attrError} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="Internal Name"
              name="name"
              value={attrForm.name}
              onChange={(e) => setAttrField("name", e.target.value)}
              placeholder="e.g. color"
              required
              error={attrErrors.name}
            />
            <TextInput
              label="Display Name"
              name="display_name"
              value={attrForm.display_name}
              onChange={(e) => setAttrField("display_name", e.target.value)}
              placeholder="e.g. Colour"
              required
              error={attrErrors.display_name}
            />
          </div>

          <SelectInput
            label="Input Type"
            name="input_type"
            value={attrForm.input_type}
            onChange={(e) => setAttrField("input_type", e.target.value)}
            options={INPUT_TYPE_OPTIONS}
            required
            error={attrErrors.input_type}
          />

          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <input
              id="is_variant_attribute"
              type="checkbox"
              checked={attrForm.is_variant_attribute}
              onChange={(e) =>
                setAttrField("is_variant_attribute", e.target.checked)
              }
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="is_variant_attribute"
              className="text-sm text-gray-700 dark:text-gray-200"
            >
              <span className="font-medium">Variant attribute</span>
              <br />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Turn on if this creates product variants (e.g. Color, Size).
                Leave off for descriptive attributes.
              </span>
            </label>
          </div>

          <SelectInput
            label="Status"
            name="status"
            value={attrForm.status}
            onChange={(e) => setAttrField("status", e.target.value)}
            options={STATUS_OPTIONS}
          />

          <AlertMessage
            type="info"
            message="After saving, expand the attribute to manage its values inline."
          />
        </div>
      </AppModal>

      {/* ═══════════ Value Modal ═══════════ */}
      <AppModal
        show={valueModalOpen}
        onHide={closeValueModal}
        title={valueModalTitle}
        subtitle={valueModalSubtitle}
        icon={valueMode === "edit" ? Pencil : Plus}
        size="lg"
        footer={
          <LoadingButton
            isLoading={valueSaving}
            text={valueMode === "edit" ? "Save Changes" : "Create"}
            icon={Save}
            onClick={saveValue}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold uppercase transition-colors disabled:opacity-60"
          />
        }
      >
        <div className="space-y-4">
          {valueError && <AlertMessage type="danger" message={valueError} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="Value"
              name="value"
              value={valueForm.value}
              onChange={(e) => setValueField("value", e.target.value)}
              placeholder="e.g. red"
              required
              error={valueErrors.value}
            />
            <TextInput
              label="Display Name"
              name="display_name"
              value={valueForm.display_name}
              onChange={(e) => setValueField("display_name", e.target.value)}
              placeholder="e.g. Red"
              required
              error={valueErrors.display_name}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="Sort Order"
              name="sort_order"
              type="number"
              value={valueForm.sort_order}
              onChange={(e) => setValueField("sort_order", e.target.value)}
            />
            <SelectInput
              label="Status"
              name="status"
              value={valueForm.status}
              onChange={(e) => setValueField("status", e.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>

          <AlertMessage
            type="info"
            message="Values appear in the order specified by 'Sort Order'."
          />
        </div>
      </AppModal>

      {/* ═══════════ Confirm Delete Attribute ═══════════ */}
      <AppModal
        show={confirmOpen}
        onHide={() => setConfirmOpen(false)}
        title="Confirm Delete"
        subtitle={confirmRow ? `Delete "${confirmRow.display_name}"?` : ""}
        icon={AlertTriangle}
        size="sm"
        footer={
          <LoadingButton
            isLoading={confirmBusy}
            text="Delete"
            icon={Trash2}
            onClick={confirmDeleteAttr}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold uppercase transition-colors disabled:opacity-60"
          />
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          This action cannot be undone. All values under this attribute will
          also be removed.
        </p>
      </AppModal>

      {/* ═══════════ Confirm Delete Value ═══════════ */}
      <AppModal
        show={valueConfirmOpen}
        onHide={() => setValueConfirmOpen(false)}
        title="Confirm Delete"
        subtitle={
          valueConfirmRow ? `Delete "${valueConfirmRow.display_name}"?` : ""
        }
        icon={AlertTriangle}
        size="sm"
        footer={
          <LoadingButton
            isLoading={valueConfirmBusy}
            text="Delete"
            icon={Trash2}
            onClick={confirmDeleteValue}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold uppercase disabled:opacity-60"
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

// Helper — true if we haven't loaded values for this attribute yet
function attrsHasNoCache(cache, attrId) {
  return !(attrId in cache);
}