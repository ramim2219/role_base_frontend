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

// opts: { companyId?, warehouseId?, productId?, variantId?, movementType?,
//         referenceType?, referenceId?, from?, to?, limit? }
export const fetchStockMovements = async (opts = {}) => {
  const params = {};
  if (opts.companyId != null) params.company_id = opts.companyId;
  if (opts.warehouseId != null) params.warehouse_id = opts.warehouseId;
  if (opts.productId != null) params.product_id = opts.productId;
  if (opts.variantId != null) params.variant_id = opts.variantId;
  if (opts.movementType) params.movement_type = opts.movementType;
  if (opts.referenceType) params.reference_type = opts.referenceType;
  if (opts.referenceId != null) params.reference_id = opts.referenceId;
  if (opts.from) params.from = opts.from;
  if (opts.to) params.to = opts.to;
  if (opts.limit != null) params.limit = opts.limit;
  return unwrap(apiClient.get("StockMovement/get_all", { params }));
};

export const fetchStockMovementById = async (id) =>
  unwrap(apiClient.get("StockMovement/get_by_id", { params: { id } }));

export const traceStockMovements = async (opts = {}) => {
  const params = {};
  if (opts.productId != null) params.product_id = opts.productId;
  if (opts.variantId != null) params.variant_id = opts.variantId;
  if (opts.warehouseId != null) params.warehouse_id = opts.warehouseId;
  return unwrap(apiClient.get("StockMovement/trace", { params }));
};