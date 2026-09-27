import apiClient from "../Axios/axiosConfig";

export const MESSAGE_CODE = {
  OK: 1200,
  DUPLICATE: 3002,
  VALIDATION_ERR: 4000,
  SERVER_ERR: 5000,
};

async function unwrap(promise) {
  const res = await promise;
  const body = res.data;
  if (body?.messageCode && body.messageCode !== MESSAGE_CODE.OK) {
    throw new Error(body.message || `Request failed (${body.messageCode})`);
  }
  return body;
}

// ═══════════════ MENU CRUD ═══════════════
export const fetchAllMenus = async () =>
  unwrap(apiClient.get("Menu/get_all_menus"));

export const fetchMenuById = async (menuId) =>
  unwrap(apiClient.get("Menu/get_menus_by_id", { params: { menu_id: menuId } }));

export const saveMenu = async (payload) =>
  unwrap(apiClient.post("Menu/saveMenu", payload));

export const updateMenu = async (payload) =>
  unwrap(apiClient.put("Menu/update_menu", payload));

export const deleteMenu = async (menuId) =>
  unwrap(apiClient.delete("Menu/delete_menu", { params: { menu_id: menuId } }));

// ═══════════════ MENU ALLOCATION ═══════════════
// POST /api/MenuAllocation/typewise_menu_allocation
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

// DELETE /api/MenuAllocation/remove_menu_allocation
export const unassignMenu = async ({
  menuId,
  userId = 0,
  userTypeId = 0,
}) =>
  unwrap(
    apiClient.delete("MenuAllocation/remove_menu_allocation", {
      data: {
        tbl_menuinfo_id: Number(menuId),
        tbl_userinfo_id: Number(userId) || 0,
        tbl_type_id: Number(userTypeId) || 0,
      },
    })
  );

// GET /api/MenuAllocation/get_all
export const fetchAllocations = async (filters = {}) => {
  const params = {};
  if (filters.menuInfoId != null) params.menu_info_id = filters.menuInfoId;
  if (filters.userInfoId != null) params.user_info_id = filters.userInfoId;
  if (filters.userTypeId != null) params.user_type_id = filters.userTypeId;
  if (filters.status) params.status = filters.status;
  return unwrap(apiClient.get("MenuAllocation/get_all", { params }));
};

// Convenience wrappers
export const assignMenuToUser = (menuId, userId, priority = 1) =>
  assignMenu({ menuId, userId, userTypeId: 0, priority });

export const assignMenuToType = (menuId, userTypeId, priority = 1) =>
  assignMenu({ menuId, userId: 0, userTypeId, priority });

export const unassignMenuFromUser = (menuId, userId) =>
  unassignMenu({ menuId, userId, userTypeId: 0 });

export const unassignMenuFromType = (menuId, userTypeId) =>
  unassignMenu({ menuId, userId: 0, userTypeId });

// ─────────────────────────────────────────────────────
// USER — used by AssignMenu page
// GET /api/User/get_my_users
// ─────────────────────────────────────────────────────
export const fetchMyUsers = async () =>
  unwrap(apiClient.get("User/get_my_users"));

// ─────────────────────────────────────────────────────
// USER TYPE — used by AssignMenu page
// GET /api/UserType/get_all
// ─────────────────────────────────────────────────────
export const fetchUserTypes = async () =>
  unwrap(apiClient.get("UserType/get_all"));