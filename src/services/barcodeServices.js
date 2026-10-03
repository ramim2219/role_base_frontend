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

// GET /api/Barcode/get_all
//   opts: { companyId?, productId?, variantId?, barcodeType?, status?, search? }
export const fetchBarcodes = async (opts = {}) => {
  const params = {};
  if (opts.companyId != null) params.company_id = opts.companyId;
  if (opts.productId != null) params.product_id = opts.productId;
  if (opts.variantId != null) params.variant_id = opts.variantId;
  if (opts.barcodeType) params.barcode_type = opts.barcodeType;
  if (opts.status != null) params.status = opts.status;
  if (opts.search) params.search = opts.search;
  return unwrap(apiClient.get("Barcode/get_all", { params }));
};

export const fetchBarcodeById = async (id) =>
  unwrap(apiClient.get("Barcode/get_by_id", { params: { id } }));

export const saveBarcode = async (payload) =>
  unwrap(apiClient.post("Barcode/save", payload));

export const updateBarcode = async (payload) =>
  unwrap(apiClient.put("Barcode/update", payload));

export const deleteBarcode = async (id) =>
  unwrap(apiClient.delete("Barcode/delete", { data: { id } }));