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

export const fetchCompanyTypes = async () =>
  unwrap(apiClient.get("CompanyType/get_all"));

export const fetchCompanyTypeById = async (id) =>
  unwrap(apiClient.get("CompanyType/get_by_id", { params: { id } }));

export const saveCompanyType = async (payload) =>
  unwrap(apiClient.post("CompanyType/save", payload));

export const updateCompanyType = async (payload) =>
  unwrap(apiClient.put("CompanyType/update", payload));

export const deleteCompanyType = async (id) =>
  unwrap(apiClient.delete("CompanyType/delete", { data: { id } }));