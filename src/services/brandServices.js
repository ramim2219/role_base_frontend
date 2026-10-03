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

function toFormData(obj) {
  const fd = new FormData();
  Object.entries(obj).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    fd.append(key, value);
  });
  return fd;
}

// GET /api/Brand/get_all
//   opts: { companyId?, categoryId?, status? }
export const fetchBrands = async (opts = {}) => {
  const params = {};
  if (opts.companyId != null) params.company_id = opts.companyId;
  if (opts.categoryId != null) params.category_id = opts.categoryId;
  if (opts.status != null) params.status = opts.status;
  return unwrap(apiClient.get("Brand/get_all", { params }));
};

// GET /api/Brand/get_by_category?category_id=X
export const fetchBrandsByCategory = async (categoryId) =>
  unwrap(
    apiClient.get("Brand/get_by_category", { params: { category_id: categoryId } })
  );

// GET /api/Brand/get_by_company?company_id=X
export const fetchBrandsByCompany = async (companyId) =>
  unwrap(
    apiClient.get("Brand/get_by_company", { params: { company_id: companyId } })
  );

// GET /api/Brand/get_by_id?id=X
export const fetchBrandById = async (id) =>
  unwrap(apiClient.get("Brand/get_by_id", { params: { id } }));

// POST /api/Brand/save (multipart if logo file present)
export const saveBrand = async (payload) => {
  const hasFile = payload?.logo instanceof File;

  if (!hasFile) {
    return unwrap(apiClient.post("Brand/save", payload));
  }

  return unwrap(
    apiClient.post("Brand/save", toFormData(payload), {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

// POST /api/Brand/update with _method=PUT when multipart
export const updateBrand = async (payload) => {
  const hasFile = payload?.logo instanceof File;

  if (!hasFile) {
    return unwrap(apiClient.put("Brand/update", payload));
  }

  const fd = toFormData(payload);
  fd.append("_method", "PUT");

  return unwrap(
    apiClient.post("Brand/update", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

// DELETE /api/Brand/delete
export const deleteBrand = async (id) =>
  unwrap(apiClient.delete("Brand/delete", { data: { id } }));