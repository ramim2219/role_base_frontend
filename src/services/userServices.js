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

// ─── USERS ──────────────────────────────────────────

export const fetchUserById = async (userId) =>
  unwrap(
    apiClient.get("User/get_user_by_id", { params: { user_id: userId } })
  );

export const fetchMyUsers = async () =>
  unwrap(apiClient.get("User/get_my_users"));

export const saveUser = async (payload) =>
  unwrap(apiClient.post("User/save_user", payload));

export const updateUser = async (payload) =>
  unwrap(apiClient.put("User/update_user", payload));

export const deleteUser = async (userId) =>
  unwrap(apiClient.delete("User/delete_user", { data: { id: userId } }));

// ─── USER TYPES (creator-scoped) ────────────────────

export const fetchUserTypesByCreator = async (createdBy = null) =>
  unwrap(
    apiClient.get("UserType/get_user_type_by_createdby", {
      params: createdBy ? { created_by: createdBy } : {},
    })
  );