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

// GET /api/ProductType/get_all
export const fetchProductTypes = async (opts = {}) => {
  const params = {};
  if (opts.companyId != null) params.company_id = opts.companyId;
  if (opts.status != null) params.status = opts.status;
  if (opts.search) params.search = opts.search;
  return unwrap(apiClient.get("ProductType/get_all", { params }));
};

export const fetchProductTypeById = async (id) =>
  unwrap(apiClient.get("ProductType/get_by_id", { params: { id } }));

export const saveProductType = async (payload) =>
  unwrap(apiClient.post("ProductType/save", payload));

export const updateProductType = async (payload) =>
  unwrap(apiClient.put("ProductType/update", payload));

export const deleteProductType = async (id) =>
  unwrap(apiClient.delete("ProductType/delete", { data: { id } }));