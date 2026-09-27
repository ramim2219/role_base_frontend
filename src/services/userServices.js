import apiClient from "../Axios/axiosConfig";

// Same unwrap pattern as MenuServices
const OK = 1200;

async function unwrap(promise) {
  const res = await promise;
  const body = res.data;

  if (body?.messageCode && body.messageCode !== OK) {
    throw new Error(body.message || `Request failed (${body.messageCode})`);
  }
  return body;
}

export const fetchUserById = async (userId) => {
  return unwrap(
    apiClient.get("User/get_user_by_id", { params: { user_id: userId } })
  );
};

export const fetchMyUsers = async () => {
  return unwrap(apiClient.get("User/get_my_users"));
};

export const updateUser = async (payload) => {
  return unwrap(apiClient.put("User/update_user", payload));
};

export const deleteUser = async (userId) => {
  return unwrap(
    apiClient.delete("User/delete_user", { data: { id: userId } })
  );
};