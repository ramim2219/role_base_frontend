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

// ─── ATTRIBUTES ─────────────────────────────────────────

// GET /api/Attribute/get_all
//   opts: { companyId?, inputType?, isVariant?, status?, search?, withValues? }
export const fetchAttributes = async (opts = {}) => {
  const params = {};
  if (opts.companyId != null) params.company_id = opts.companyId;
  if (opts.inputType) params.input_type = opts.inputType;
  if (opts.isVariant != null) params.is_variant = opts.isVariant ? 1 : 0;
  if (opts.status != null) params.status = opts.status;
  if (opts.search) params.search = opts.search;
  if (opts.withValues) params.with_values = 1;
  return unwrap(apiClient.get("Attribute/get_all", { params }));
};

export const fetchAttributeById = async (id, withValues = true) =>
  unwrap(
    apiClient.get("Attribute/get_by_id", {
      params: { id, ...(withValues ? { with_values: 1 } : {}) },
    })
  );

export const saveAttribute = async (payload) =>
  unwrap(apiClient.post("Attribute/save", payload));

export const updateAttribute = async (payload) =>
  unwrap(apiClient.put("Attribute/update", payload));

export const deleteAttribute = async (id) =>
  unwrap(apiClient.delete("Attribute/delete", { data: { id } }));

// ─── ATTRIBUTE VALUES ───────────────────────────────────

export const fetchAttributeValues = async (attributeId) =>
  unwrap(
    apiClient.get("AttributeValue/get_by_attribute", {
      params: { attribute_id: attributeId },
    })
  );

export const saveAttributeValue = async (payload) =>
  unwrap(apiClient.post("AttributeValue/save", payload));

export const updateAttributeValue = async (payload) =>
  unwrap(apiClient.put("AttributeValue/update", payload));

export const deleteAttributeValue = async (id) =>
  unwrap(apiClient.delete("AttributeValue/delete", { data: { id } }));