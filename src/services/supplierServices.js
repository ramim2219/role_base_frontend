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

// GET /api/Supplier/get_all
//   opts: { companyId?, status?, search? }
export const fetchSuppliers = async (opts = {}) => {
  const params = {};
  if (opts.companyId != null) params.company_id = opts.companyId;
  if (opts.status != null) params.status = opts.status;
  if (opts.search) params.search = opts.search;
  return unwrap(apiClient.get("Supplier/get_all", { params }));
};

export const fetchSupplierById = async (id) =>
  unwrap(apiClient.get("Supplier/get_by_id", { params: { id } }));

export const saveSupplier = async (payload) =>
  unwrap(apiClient.post("Supplier/save", payload));

export const updateSupplier = async (payload) =>
  unwrap(apiClient.put("Supplier/update", payload));

export const deleteSupplier = async (id) =>
  unwrap(apiClient.delete("Supplier/delete", { data: { id } }));