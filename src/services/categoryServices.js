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

// GET /api/Category/get_all
//   opts: { companyId?, parentId?, tree?, status? }
export const fetchCategories = async (opts = {}) => {
  const params = {};
  if (opts.companyId != null) params.company_id = opts.companyId;
  if (opts.parentId !== undefined) params.parent_id = opts.parentId;
  if (opts.tree) params.tree = 1;
  if (opts.status != null) params.status = opts.status;
  return unwrap(apiClient.get("Category/get_all", { params }));
};

// GET /api/Category/get_by_company?company_id=X
export const fetchCategoriesByCompany = async (companyId) =>
  unwrap(
    apiClient.get("Category/get_by_company", { params: { company_id: companyId } })
  );

// GET /api/Category/get_by_id?id=X
export const fetchCategoryById = async (id) =>
  unwrap(apiClient.get("Category/get_by_id", { params: { id } }));

// POST /api/Category/save (multipart when image is present)
export const saveCategory = async (payload) => {
  const hasFile = payload?.image instanceof File;

  if (!hasFile) {
    return unwrap(apiClient.post("Category/save", payload));
  }

  return unwrap(
    apiClient.post("Category/save", toFormData(payload), {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

// POST /api/Category/update with _method=PUT when multipart
export const updateCategory = async (payload) => {
  const hasFile = payload?.image instanceof File;

  if (!hasFile) {
    return unwrap(apiClient.put("Category/update", payload));
  }

  const fd = toFormData(payload);
  fd.append("_method", "PUT");

  return unwrap(
    apiClient.post("Category/update", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

// DELETE /api/Category/delete
export const deleteCategory = async (id) =>
  unwrap(apiClient.delete("Category/delete", { data: { id } }));