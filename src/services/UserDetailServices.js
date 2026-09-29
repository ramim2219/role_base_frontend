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
// 1. BY USER ID
// GET /api/UserDetail/get_userDetails_by_userid?user_id=X
// ─────────────────────────────────────────────────────
export const fetchUserDetailByUserId = async (userId) =>
  unwrap(
    apiClient.get("UserDetail/get_userDetails_by_userid", {
      params: { user_id: userId },
    })
  );

// ─────────────────────────────────────────────────────
// 2. BY USER ID (creator-scoped)
// GET /api/UserDetail/get_userDetails_by_userid_creator?user_id=X
// ─────────────────────────────────────────────────────
export const fetchUserDetailByUserIdCreator = async (userId) =>
  unwrap(
    apiClient.get("UserDetail/get_userDetails_by_userid_creator", {
      params: { user_id: userId },
    })
  );

// ─────────────────────────────────────────────────────
// 3. ALL
// GET /api/UserDetail/get_all_userDetails
//   opts: { onlyMine?, createdBy?, search? }
// ─────────────────────────────────────────────────────
export const fetchAllUserDetails = async (opts = {}) => {
  const params = {};
  if (opts.onlyMine) params.only_mine = 1;
  if (opts.createdBy != null) params.created_by = opts.createdBy;
  if (opts.search) params.search = opts.search;
  return unwrap(apiClient.get("UserDetail/get_all_userDetails", { params }));
};

// ─────────────────────────────────────────────────────
// 4. UPDATE
// PUT /api/UserDetail/update_userDetails
//   payload may include `image` (File) — will be sent as multipart
// ─────────────────────────────────────────────────────
export const updateUserDetails = async (payload) => {
  const hasFile = payload?.image instanceof File;

  if (!hasFile) {
    return unwrap(apiClient.put("UserDetail/update_userDetails", payload));
  }

  // Build multipart form data when a file is present
  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    fd.append(key, value);
  });

  return unwrap(
    apiClient.put("UserDetail/update_userDetails", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

// ─────────────────────────────────────────────────────
// 5. DELETE
// DELETE /api/UserDetail/delete_userDetails
// ─────────────────────────────────────────────────────
export const deleteUserDetails = async (id) =>
  unwrap(
    apiClient.delete("UserDetail/delete_userDetails", {
      data: { id },
    })
  );

// ─────────────────────────────────────────────────────
// CREATE / UPSERT (self-service)
// POST /api/UserDetail/save_userDetails
// ─────────────────────────────────────────────────────
export const saveUserDetails = async (payload) => {
  const hasFile = payload?.image instanceof File;

  if (!hasFile) {
    return unwrap(apiClient.post("UserDetail/save_userDetails", payload));
  }

  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    fd.append(key, value);
  });

  return unwrap(
    apiClient.post("UserDetail/save_userDetails", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};