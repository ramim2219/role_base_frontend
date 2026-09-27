import apiClient from "../Axios/axiosConfig";

// ─────────────────────────────────────────────────────
// Response shape from MenuController:
//   { messageCode: 1200 | 3002 | 4000 | 5000, message: string, data: ... }
//
// The axios interceptor only rejects on HTTP errors (401, 500, network).
// Your controller always returns HTTP 200 — even on business errors —
// with a messageCode inside the body. So callers must check messageCode.
// ─────────────────────────────────────────────────────

export const MESSAGE_CODE = {
  OK: 1200,
  DUPLICATE: 3002,
  VALIDATION_ERR: 4000,
  SERVER_ERR: 5000,
};

/**
 * Wrap a service call so business-level errors (messageCode !== 1200)
 * throw a real Error. Components can then use try/catch + toast as usual.
 */
async function unwrap(promise) {
  const res = await promise;
  const body = res.data;

  if (body?.messageCode && body.messageCode !== MESSAGE_CODE.OK) {
    throw new Error(body.message || `Request failed (${body.messageCode})`);
  }
  return body;
}

// ═════════════════════════════════════════════════════
// 1. GET ALL MENUS
// GET /api/Menu/get_all_menus
// Returns nested tree
// ═════════════════════════════════════════════════════
export const fetchAllMenus = async () => {
  return unwrap(apiClient.get("Menu/get_all_menus"));
};

// ═════════════════════════════════════════════════════
// 2. GET MENU BY ID
// GET /api/Menu/get_menus_by_id?menu_id=X
// Returns: [ { menu } ]  (array with one element)
// ═════════════════════════════════════════════════════
export const fetchMenuById = async (menuId) => {
  return unwrap(
    apiClient.get("Menu/get_menus_by_id", {
      params: { menu_id: menuId },
    })
  );
};

// ═════════════════════════════════════════════════════
// 3. SAVE MENU (create)
// POST /api/Menu/saveMenu
//
// Body fields (from controller):
//   menuName  (required, string)
//   menuUrl   (nullable, string) — auto-generated when type=Access
//   menuOrder (required, int >= 1)
//   parentId  (nullable, int >= 0) — 0 or null = top-level
//   type      (nullable, 'Menu' | 'Access')
//   status    (nullable, 'On' | 'Off')
//   icon      (nullable, string)
//   createdBy (nullable, int)
// ═════════════════════════════════════════════════════
export const saveMenu = async (payload) => {
  return unwrap(apiClient.post("Menu/saveMenu", payload));
};

// ═════════════════════════════════════════════════════
// 4. UPDATE MENU
// PUT /api/Menu/update_menu
//
// Body: same as saveMenu plus:
//   id (required)
// ═════════════════════════════════════════════════════
export const updateMenu = async (payload) => {
  return unwrap(apiClient.put("Menu/update_menu", payload));
};

// ═════════════════════════════════════════════════════
// 5. DELETE MENU
// DELETE /api/Menu/delete_menu?menu_id=X
// Cascades to children + allocations
// ═════════════════════════════════════════════════════
export const deleteMenu = async (menuId) => {
  return unwrap(
    apiClient.delete("Menu/delete_menu", {
      params: { menu_id: menuId },
    })
  );
};

// ═════════════════════════════════════════════════════
// 6. ASSIGN MENU
// POST /api/Menu/typewise_menu_allocation
//
// Body (from controller):
//   tbl_menuinfo_id (required)
//   tbl_userinfo_id (nullable) — set this OR tbl_type_id
//   tbl_type_id     (nullable) — set this OR tbl_userinfo_id
//   priority        (optional)
// ═════════════════════════════════════════════════════
export const assignMenu = async (payload) => {
  return unwrap(apiClient.post("Menu/typewise_menu_allocation", payload));
};

// ═════════════════════════════════════════════════════
// 7. UNASSIGN MENU
// DELETE /api/Menu/remove_menu_allocation
//
// Body (from controller — reads from request body, not query):
//   Id               (or id) — allocation id (required)
//   tbl_menuinfo_id  (required)
//   tbl_userinfo_id  (nullable)
//   tbl_type_id      (nullable)
// ═════════════════════════════════════════════════════
export const unassignMenu = async (payload) => {
  return unwrap(
    apiClient.delete("Menu/remove_menu_allocation", { data: payload })
  );
};