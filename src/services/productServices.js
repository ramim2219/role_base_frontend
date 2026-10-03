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

// GET /api/Product/get_all
export const fetchProducts = async (opts = {}) => {
  const params = {};
  if (opts.companyId != null) params.company_id = opts.companyId;
  if (opts.categoryId != null) params.category_id = opts.categoryId;
  if (opts.brandId != null) params.brand_id = opts.brandId;
  if (opts.productTypeId != null) params.product_type_id = opts.productTypeId;
  if (opts.status != null) params.status = opts.status;
  if (opts.search) params.search = opts.search;
  return unwrap(apiClient.get("Product/get_all", { params }));
};

export const fetchProductById = async (id, detailed = true) =>
  unwrap(
    apiClient.get("Product/get_by_id", {
      params: { id, ...(detailed ? { detailed: 1 } : {}) },
    })
  );

// POST /api/Product/save — multipart when files are present
export const saveProduct = async (payload) => {
  const hasFiles =
    payload?.product_image instanceof File ||
    (Array.isArray(payload?.images) && payload.images.some((f) => f instanceof File));

  if (!hasFiles) {
    return unwrap(apiClient.post("Product/save", payload));
  }

  const fd = new FormData();

  // ─── Scalar fields ───
  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (key === "images" || key === "product_image") return; // handled below
    if (Array.isArray(value) || typeof value === "object") {
      fd.append(key, JSON.stringify(value));
    } else {
      fd.append(key, value);
    }
  });

  // ─── Single file ───
  if (payload.product_image instanceof File) {
    fd.append("product_image", payload.product_image);
  }

  // ─── Multiple files + their meta ───
  if (Array.isArray(payload.images)) {
    const meta = [];
    payload.images.forEach((img) => {
      if (img?.file instanceof File) {
        fd.append("images[]", img.file);
        meta.push({
          variant_index: img.variant_index,
          is_primary: img.is_primary ? 1 : 0,
          sort_order: img.sort_order ?? 0,
        });
      }
    });
    if (meta.length) fd.append("images_meta", JSON.stringify(meta));
  }

  return unwrap(
    apiClient.post("Product/save", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

export const updateProduct = async (payload) => {
  const hasFile = payload?.product_image instanceof File;

  if (!hasFile) {
    return unwrap(apiClient.put("Product/update", payload));
  }

  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (key === "product_image") return;
    fd.append(key, value);
  });
  fd.append("product_image", payload.product_image);
  fd.append("_method", "PUT");

  return unwrap(
    apiClient.post("Product/update", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

export const deleteProduct = async (id) =>
  unwrap(apiClient.delete("Product/delete", { data: { id } }));