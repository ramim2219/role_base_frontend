// src/pages/AssignMenu.jsx
import { useEffect, useMemo, useState } from "react";
import {
  UserCheck,
  Users,
  UserCog,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";

import PageHeader from "../../components/PageHeader";
import CardBox from "../../components/CardBox";
import CustomButton from "../../components/CustomButton";
import AppModal from "../../components/AppModal";
import AlertMessage from "../../components/AlertMessage";
import SelectInput from "../../components/SelectInput";
import LoadingButton from "../../components/LoadingButton";

import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  showWarningToast,
} from "../../Helper/TosterHelper";

import {
  fetchAllMenus,
  assignMenuToUser,
  assignMenuToType,
  unassignMenuFromUser,
  unassignMenuFromType,
  fetchAllocations,
  fetchMyUsers,
  fetchUserTypes,
} from "../../services/MenuServices";

// ─── Flatten the menu tree for display ─────────────────
function flattenMenus(tree) {
  const out = [];

  const walk = (nodes, depth = 0) => {
    (nodes || []).forEach((node) => {
      out.push({
        id: node.id,
        menu: node.menu,
        menu_url: node.menu_url,
        type: node.type,
        depth,
      });

      if (Array.isArray(node.submenu) && node.submenu.length) {
        walk(node.submenu, depth + 1);
      }
      if (Array.isArray(node.access) && node.access.length) {
        walk(node.access, depth + 1);
      }
    });
  };

  walk(tree, 0);
  return out;
}

export default function AssignMenu() {
  const [menus, setMenus] = useState([]);
  const [users, setUsers] = useState([]);
  const [types, setTypes] = useState([]);
  const [allocations, setAllocations] = useState([]);

  const [loadingMenus, setLoadingMenus] = useState(false);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [loadingAlloc, setLoadingAlloc] = useState(false);
  const [saving, setSaving] = useState(false);

  const [scope, setScope] = useState("user");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("");

  const [pickedIds, setPickedIds] = useState(new Set());

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const [formError, setFormError] = useState("");

  // ─── LOAD ────────────────────────────────────────────
  const loadMenus = async () => {
    setLoadingMenus(true);
    try {
      const res = await fetchAllMenus();
      setMenus(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load menus.");
    } finally {
      setLoadingMenus(false);
    }
  };

  const loadRefData = async () => {
    setLoadingRefs(true);
    try {
      const [usersRes, typesRes] = await Promise.all([
        fetchMyUsers(),
        fetchUserTypes(),
      ]);
      setUsers(usersRes.data || []);
      setTypes(typesRes.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load users/types.");
    } finally {
      setLoadingRefs(false);
    }
  };

  const loadAllocations = async () => {
    if (scope === "user" && !selectedUserId) {
      setAllocations([]);
      return;
    }
    if (scope === "type" && !selectedTypeId) {
      setAllocations([]);
      return;
    }

    setLoadingAlloc(true);
    try {
      const filters =
        scope === "user"
          ? { userInfoId: selectedUserId, status: "active" }
          : { userTypeId: selectedTypeId, status: "active" };
      const res = await fetchAllocations(filters);
      setAllocations(res.data || []);
    } catch (err) {
      showErrorToast(err.message || "Failed to load allocations.");
      setAllocations([]);
    } finally {
      setLoadingAlloc(false);
    }
  };

  useEffect(() => {
    loadMenus();
    loadRefData();
  }, []);

  useEffect(() => {
    setPickedIds(new Set());
    loadAllocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, selectedUserId, selectedTypeId]);

  // ─── DERIVED ─────────────────────────────────────────
  const flatMenus = useMemo(() => flattenMenus(menus), [menus]);

  const assignedMenuIds = useMemo(() => {
    const s = new Set();
    allocations.forEach((a) => s.add(Number(a.menu_info_id)));
    return s;
  }, [allocations]);

  const allocationByMenuId = useMemo(() => {
    const m = new Map();
    allocations.forEach((a) => m.set(Number(a.menu_info_id), a));
    return m;
  }, [allocations]);

  const typeOptions = useMemo(
    () => [
      { value: "", label: "— Select a user type —" },
      ...types.map((t) => ({
        value: String(t.id),
        label: t.company?.name ? `${t.name} (${t.company.name})` : t.name,
      })),
    ],
    [types]
  );

  const userOptions = useMemo(
    () => [
      { value: "", label: "— Select a user —" },
      ...users.map((u) => ({
        value: String(u.id),
        label: u.email ? `${u.name} (${u.email})` : u.name,
      })),
    ],
    [users]
  );

  const scopeReady =
    (scope === "user" && !!selectedUserId) ||
    (scope === "type" && !!selectedTypeId);

  // ─── ACTIONS ─────────────────────────────────────────
  const togglePick = (menuId) => {
    if (!scopeReady) return;
    if (assignedMenuIds.has(Number(menuId))) return;

    setPickedIds((prev) => {
      const next = new Set(prev);
      if (next.has(menuId)) next.delete(menuId);
      else next.add(menuId);
      return next;
    });
  };

  const handleAssign = async () => {
    setFormError("");
    if (!scopeReady) {
      const msg = "Please pick a user or a user type first.";
      setFormError(msg);
      showErrorToast(msg);
      return;
    }

    const toAssign = Array.from(pickedIds).filter(
      (id) => !assignedMenuIds.has(Number(id))
    );

    if (toAssign.length === 0) {
      showWarningToast("Please select at least one menu to assign.");
      return;
    }

    setSaving(true);
    try {
      const promises = toAssign.map((menuId) =>
        scope === "user"
          ? assignMenuToUser(menuId, Number(selectedUserId))
          : assignMenuToType(menuId, Number(selectedTypeId))
      );

      const settled = await Promise.allSettled(promises);

      let ok = 0,
        dup = 0,
        failed = 0;
      settled.forEach((s) => {
        if (s.status === "fulfilled") ok++;
        else if (s.reason?.message?.toLowerCase().includes("already")) dup++;
        else failed++;
      });

      if (ok) showSuccessToast(`${ok} menu(s) assigned.`);
      if (dup) showWarningToast(`${dup} already assigned.`);
      if (failed) showErrorToast(`${failed} failed.`);

      setPickedIds(new Set());
      await loadAllocations();
    } catch (err) {
      showErrorToast(err.message || "Failed to assign.");
    } finally {
      setSaving(false);
    }
  };

  const askUnassign = (menuId) => {
    const alloc = allocationByMenuId.get(Number(menuId));
    if (!alloc) {
      showErrorToast("Allocation not found for this menu.");
      return;
    }
    setConfirmPayload({
      menuId: Number(menuId),
      allocationId: alloc.id,
      menuName:
        alloc.menu?.menu ||
        flatMenus.find((m) => m.id === menuId)?.menu ||
        "menu",
    });
    setConfirmOpen(true);
  };

  const confirmUnassign = async () => {
    if (!confirmPayload) return;
    setConfirmBusy(true);
    try {
      if (scope === "user") {
        await unassignMenuFromUser(confirmPayload.menuId, Number(selectedUserId));
      } else {
        await unassignMenuFromType(confirmPayload.menuId, Number(selectedTypeId));
      }
      showSuccessToast("Menu unassigned.");
      setConfirmOpen(false);
      setConfirmPayload(null);
      await loadAllocations();
    } catch (err) {
      showErrorToast(err.message || "Failed to unassign.");
    } finally {
      setConfirmBusy(false);
    }
  };

  const refreshAll = async () => {
    showInfoToast("Refreshing...");
    await Promise.all([loadMenus(), loadAllocations()]);
  };

  const clearScope = () => {
    setSelectedUserId("");
    setSelectedTypeId("");
    setPickedIds(new Set());
    setAllocations([]);
    setFormError("");
  };

  // ─── RENDER ──────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Assign Menu"
        icon={UserCheck}
        breadcrumb
        onClickGuide={() => showInfoToast("Opening guide...")}
      />

      <CardBox
        title="Select Scope"
        icon={Users}
        headerBgColor="light"
        buttons={[
          {
            text: "Refresh",
            icon: RefreshCw,
            color: "secondary",
            onClick: refreshAll,
          },
        ]}
      >
        <div className="space-y-4">
          {formError && <AlertMessage type="danger" message={formError} />}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setScope("user");
                setSelectedTypeId("");
                setPickedIds(new Set());
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                scope === "user"
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <Users className="w-4 h-4" /> Assign to a User
            </button>

            <button
              type="button"
              onClick={() => {
                setScope("type");
                setSelectedUserId("");
                setPickedIds(new Set());
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                scope === "type"
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <UserCog className="w-4 h-4" /> Assign to a User Type
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {scope === "user" && (
              <SelectInput
                label="User"
                name="selectedUserId"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                options={userOptions}
                disabled={loadingRefs}
              />
            )}

            {scope === "type" && (
              <SelectInput
                label="User Type"
                name="selectedTypeId"
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                options={typeOptions}
                disabled={loadingRefs}
              />
            )}

            {(selectedUserId || selectedTypeId) && (
              <div className="flex items-end">
                <CustomButton
                  title="Clear selection"
                  color="secondary"
                  onClick={clearScope}
                />
              </div>
            )}
          </div>

          <AlertMessage
            type="info"
            message={
              scopeReady
                ? "Now pick the menus to assign below."
                : "Pick a user or a user type to enable the menu list."
            }
          />
        </div>
      </CardBox>

      <CardBox
        title="Menus"
        subTitle={`${flatMenus.length} item(s)`}
        icon={UserCheck}
        headerBgColor="light"
        footerButtons={[
          {
            text: saving ? "Assigning..." : `Assign (${pickedIds.size})`,
            icon: Check,
            color: "success",
            onClick: handleAssign,
          },
        ]}
      >
        {loadingMenus || loadingAlloc ? (
          <div className="py-10 text-center text-gray-500">
            <RefreshCw className="inline-block animate-spin mb-2" />
            <div>Loading menus…</div>
          </div>
        ) : flatMenus.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            No menus yet. Create some in Menu Management.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {flatMenus.map((m) => {
              const isAssigned = assignedMenuIds.has(Number(m.id));
              const isPicked = pickedIds.has(m.id);
              const disabled = !scopeReady || isAssigned;

              return (
                <div
                  key={m.id}
                  onClick={() => !disabled && togglePick(m.id)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-all ${
                    isAssigned
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20 cursor-not-allowed"
                      : isPicked
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-pointer"
                      : scopeReady
                      ? "border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer"
                      : "border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed"
                  }`}
                  style={{ paddingLeft: `${12 + m.depth * 16}px` }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-gray-400 text-xs">
                      {m.depth === 0 ? "◆" : m.depth === 1 ? "↳" : "•"}
                    </span>
                    <span
                      className={`truncate ${
                        isAssigned
                          ? "text-green-700 dark:text-green-400 font-medium"
                          : "text-gray-800 dark:text-gray-100"
                      }`}
                      title={m.menu}
                    >
                      {m.menu}
                    </span>
                    {isAssigned && (
                      <span className="text-[10px] font-bold uppercase text-green-700 dark:text-green-400">
                        assigned
                      </span>
                    )}
                    {isPicked && !isAssigned && (
                      <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
                        selected
                      </span>
                    )}
                  </div>

                  {isAssigned && scopeReady && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        askUnassign(m.id);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <X className="w-3.5 h-3.5" />
                      Unassign
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardBox>

      <AppModal
        show={confirmOpen}
        onHide={() => setConfirmOpen(false)}
        title="Confirm Unassign"
        subtitle={confirmPayload ? `Unassign "${confirmPayload.menuName}"?` : ""}
        icon={AlertTriangle}
        size="sm"
        footer={
          <LoadingButton
            isLoading={confirmBusy}
            text="Unassign"
            icon={X}
            onClick={confirmUnassign}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold uppercase transition-colors disabled:opacity-60"
          />
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          The user will lose access to this menu immediately. You can re-assign
          later.
        </p>
      </AppModal>
    </div>
  );
}