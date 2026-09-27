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
// LIST
// GET /api/UserType/get_all
//   opts: { companyId?, onlyMine? }
// ─────────────────────────────────────────────────────
export const fetchUserTypes = async (opts = {}) => {
  const params = {};
  if (opts.companyId != null) params.company_id = opts.companyId;
  if (opts.onlyMine) params.only_mine = 1;

  return unwrap(apiClient.get("UserType/get_all", { params }));
};

// ─────────────────────────────────────────────────────
// GET BY ID
// GET /api/UserType/get_by_id?id=X
// ─────────────────────────────────────────────────────
export const fetchUserTypeById = async (id) =>
  unwrap(apiClient.get("UserType/get_by_id", { params: { id } }));

// ─────────────────────────────────────────────────────
// CREATE
// POST /api/UserType/save
//   payload: { name, company_id? }
// ─────────────────────────────────────────────────────
export const saveUserType = async (payload) =>
  unwrap(apiClient.post("UserType/save", payload));

// ─────────────────────────────────────────────────────
// UPDATE
// PUT /api/UserType/update
//   payload: { id, name?, company_id? }
// ─────────────────────────────────────────────────────
export const updateUserType = async (payload) =>
  unwrap(apiClient.put("UserType/update", payload));

// ─────────────────────────────────────────────────────
// DELETE
// DELETE /api/UserType/delete
// ─────────────────────────────────────────────────────
export const deleteUserType = async (id) =>
  unwrap(apiClient.delete("UserType/delete", { data: { id } }));