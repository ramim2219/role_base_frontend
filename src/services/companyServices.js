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

// Convert a plain object into FormData, skipping null/undefined
// so they don't get serialised as the string "null".
function toFormData(obj) {
  const fd = new FormData();
  Object.entries(obj).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    fd.append(key, value);
  });
  return fd;
}

// ─────────────────────────────────────────────────────
// LIST
// ─────────────────────────────────────────────────────
export const fetchCompanies = async (onlyMine = false) =>
  unwrap(
    apiClient.get("Company/get_all", {
      params: onlyMine ? { only_mine: 1 } : {},
    })
  );

// ─────────────────────────────────────────────────────
// GET BY ID
// ─────────────────────────────────────────────────────
export const fetchCompanyById = async (id) =>
  unwrap(apiClient.get("Company/get_by_id", { params: { id } }));

// ─────────────────────────────────────────────────────
// CREATE
// POST /api/Company/save  (multipart/form-data)
//   payload.logo: File (optional)
// ─────────────────────────────────────────────────────
export const saveCompany = async (payload) => {
  const fd = toFormData(payload);
  const res = await apiClient.post("Company/save", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const body = res.data;
  if (body?.messageCode && body.messageCode !== OK) {
    throw new Error(body.message || `Request failed (${body.messageCode})`);
  }
  return body;
};

// ─────────────────────────────────────────────────────
// UPDATE
// POST /api/Company/update with _method=PUT
// (PHP can't parse multipart on a real PUT request)
//   payload.logo: File (optional)
//   payload.remove_logo: 1 to clear
// ─────────────────────────────────────────────────────
export const updateCompany = async (payload) => {
  const fd = toFormData(payload);
  fd.append("_method", "PUT");

  const res = await apiClient.post("Company/update", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const body = res.data;
  if (body?.messageCode && body.messageCode !== OK) {
    throw new Error(body.message || `Request failed (${body.messageCode})`);
  }
  return body;
};

// ─────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────
export const deleteCompany = async (id) =>
  unwrap(apiClient.delete("Company/delete", { data: { id } }));