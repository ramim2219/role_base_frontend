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

// GET /api/ProductSupplier/get_all
//   opts: { productId?, variantId?, supplierId?, status? }
export const fetchProductSuppliers = async (opts = {}) => {
  const params = {};
  if (opts.productId != null) params.product_id = opts.productId;
  if (opts.variantId != null) params.variant_id = opts.variantId;
  if (opts.supplierId != null) params.supplier_id = opts.supplierId;
  if (opts.status != null) params.status = opts.status;
  return unwrap(apiClient.get("ProductSupplier/get_all", { params }));
};

export const saveProductSupplier = async (payload) =>
  unwrap(apiClient.post("ProductSupplier/save", payload));

export const updateProductSupplier = async (payload) =>
  unwrap(apiClient.put("ProductSupplier/update", payload));

export const deleteProductSupplier = async (id) =>
  unwrap(apiClient.delete("ProductSupplier/delete", { data: { id } }));