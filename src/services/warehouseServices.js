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

export const fetchWarehouses = async (opts = {}) => {
  const params = {};
  if (opts.companyId != null) params.company_id = opts.companyId;
  if (opts.status != null) params.status = opts.status;
  if (opts.search) params.search = opts.search;
  return unwrap(apiClient.get("Warehouse/get_all", { params }));
};

export const fetchWarehouseById = async (id) =>
  unwrap(apiClient.get("Warehouse/get_by_id", { params: { id } }));

export const saveWarehouse = async (payload) =>
  unwrap(apiClient.post("Warehouse/save", payload));

export const updateWarehouse = async (payload) =>
  unwrap(apiClient.put("Warehouse/update", payload));

export const deleteWarehouse = async (id) =>
  unwrap(apiClient.delete("Warehouse/delete", { data: { id } }));