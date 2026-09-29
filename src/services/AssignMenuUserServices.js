import apiClient from "../Axios/axiosConfig";

const OK = 1200;

async function unwrap(promise) {
  const res = await promise;
  const body = res.data;

  if (body?.messageCode && body.messageCode !== OK) {
    throw new Error(body.message || `Request failed (${body.messageCode})`);
  }
  return body;
}

// ─────────────────────────────────────────────────────
// LIST — menus assigned to the current user (auth-based)
// GET /api/MenuAllocation/get_assigned_menus
//   opts: { userId?, userTypeId? }
//   If both omitted, the backend resolves the user from the bearer token
//   and returns their effective menus (direct + type-scoped + ancestors).
// ─────────────────────────────────────────────────────
export const fetchAssignedMenus = async (opts = {}) => {
  const params = {};
  if (opts.userId != null) params.user_info_id = opts.userId;
  if (opts.userTypeId != null) params.user_type_id = opts.userTypeId;
  return unwrap(
    apiClient.get("MenuAllocation/get_assigned_menus", { params })
  );
};

// Sidebar-friendly alias — same endpoint, clearer name at the call site.
// No params → backend uses the caller's own id/user_type_id.
export const fetchMyMenus = fetchAssignedMenus;

// ─────────────────────────────────────────────────────
// USERS — only the ones created by the logged-in user
// GET /api/User/get_my_users
// ─────────────────────────────────────────────────────
export const fetchMyUsers = async () =>
  unwrap(apiClient.get("User/get_my_users"));

// ─────────────────────────────────────────────────────
// USER TYPES — only the ones created by the logged-in user
// GET /api/UserType/get_user_type_by_createdby
// ─────────────────────────────────────────────────────
export const fetchUserTypesByCreator = async (createdBy = null) =>
  unwrap(
    apiClient.get("UserType/get_user_type_by_createdby", {
      params: createdBy ? { created_by: createdBy } : {},
    })
  );

// ─────────────────────────────────────────────────────
// ALLOCATIONS — flat list, filterable
// GET /api/MenuAllocation/get_all
// ─────────────────────────────────────────────────────
export const fetchAllocations = async (filters = {}) => {
  const params = {};
  if (filters.menuInfoId != null) params.menu_info_id = filters.menuInfoId;
  if (filters.userInfoId != null) params.user_info_id = filters.userInfoId;
  if (filters.userTypeId != null) params.user_type_id = filters.userTypeId;
  if (filters.status) params.status = filters.status;
  return unwrap(apiClient.get("MenuAllocation/get_all", { params }));
};

// ─────────────────────────────────────────────────────
// UNASSIGN
// DELETE /api/MenuAllocation/remove_menu_allocation
// ─────────────────────────────────────────────────────
export const unassignMenu = async ({ menuId, userId = 0, userTypeId = 0 }) =>
  unwrap(
    apiClient.delete("MenuAllocation/remove_menu_allocation", {
      data: {
        tbl_menuinfo_id: Number(menuId),
        tbl_userinfo_id: Number(userId) || 0,
        tbl_type_id: Number(userTypeId) || 0,
      },
    })
  );

export const unassignMenuFromUser = (menuId, userId) =>
  unassignMenu({ menuId, userId, userTypeId: 0 });

export const unassignMenuFromType = (menuId, userTypeId) =>
  unassignMenu({ menuId, userId: 0, userTypeId });

// ─────────────────────────────────────────────────────
// ASSIGNABLE MENUS — the caller's own effective menu set
// GET /api/MenuAllocation/get_assignable_menus
// ─────────────────────────────────────────────────────
export const fetchAssignableMenus = async () =>
  unwrap(apiClient.get("MenuAllocation/get_assignable_menus"));

// ─────────────────────────────────────────────────────
// ASSIGN — POST /api/MenuAllocation/typewise_menu_allocation
// ─────────────────────────────────────────────────────
export const assignMenu = async ({
  menuId,
  userId = 0,
  userTypeId = 0,
  priority = 1,
}) =>
  unwrap(
    apiClient.post("MenuAllocation/typewise_menu_allocation", {
      tbl_menuinfo_id: Number(menuId),
      tbl_userinfo_id: Number(userId) || 0,
      tbl_type_id: Number(userTypeId) || 0,
      priority: Number(priority) || 1,
    })
  );

export const assignMenuToUser = (menuId, userId, priority = 1) =>
  assignMenu({ menuId, userId, userTypeId: 0, priority });

export const assignMenuToType = (menuId, userTypeId, priority = 1) =>
  assignMenu({ menuId, userId: 0, userTypeId, priority });