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

// GET /api/Unit/get_all
//   opts: { companyId?, unitType?, status?, search? }
export const fetchUnits = async (opts = {}) => {
  const params = {};
  if (opts.companyId != null) params.company_id = opts.companyId;
  if (opts.unitType) params.unit_type = opts.unitType;
  if (opts.status != null) params.status = opts.status;
  if (opts.search) params.search = opts.search;
  return unwrap(apiClient.get("Unit/get_all", { params }));
};

// GET /api/Unit/get_by_company?company_id=X
export const fetchUnitsByCompany = async (companyId) =>
  unwrap(apiClient.get("Unit/get_by_company", { params: { company_id: companyId } }));

// GET /api/Unit/get_by_id?id=X
export const fetchUnitById = async (id) =>
  unwrap(apiClient.get("Unit/get_by_id", { params: { id } }));

// POST /api/Unit/save
export const saveUnit = async (payload) =>
  unwrap(apiClient.post("Unit/save", payload));

// PUT /api/Unit/update
export const updateUnit = async (payload) =>
  unwrap(apiClient.put("Unit/update", payload));

// DELETE /api/Unit/delete
export const deleteUnit = async (id) =>
  unwrap(apiClient.delete("Unit/delete", { data: { id } }));