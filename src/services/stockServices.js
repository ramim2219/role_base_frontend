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

// opts: { companyId?, warehouseId?, productId?, variantId?, lowStock? }
export const fetchStocks = async (opts = {}) => {
  const params = {};
  if (opts.companyId != null) params.company_id = opts.companyId;
  if (opts.warehouseId != null) params.warehouse_id = opts.warehouseId;
  if (opts.productId != null) params.product_id = opts.productId;
  if (opts.variantId != null) params.variant_id = opts.variantId;
  if (opts.lowStock) params.low_stock = 1;
  return unwrap(apiClient.get("Stock/get_all", { params }));
};

export const fetchStockById = async (id) =>
  unwrap(apiClient.get("Stock/get_by_id", { params: { id } }));

export const fetchStockByProduct = async (productId, variantId) =>
  unwrap(
    apiClient.get("Stock/get_by_product", {
      params: { product_id: productId, variant_id: variantId },
    })
  );

export const saveStock = async (payload) =>
  unwrap(apiClient.post("Stock/save", payload));

export const adjustStock = async (payload) =>
  unwrap(apiClient.post("Stock/adjust", payload));

export const updateStockReorder = async (payload) =>
  unwrap(apiClient.put("Stock/update_reorder", payload));