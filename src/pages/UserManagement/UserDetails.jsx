// src/pages/UserManagement/UserDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { User, Save, RefreshCw } from "lucide-react";

import PageHeader from "../../components/PageHeader";
import CardBox from "../../components/CardBox";
import AlertMessage from "../../components/AlertMessage";
import LoadingButton from "../../components/LoadingButton";

import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from "../../Helper/TosterHelper";

import {
  fetchUserDetailByUserId,
  updateUserDetails,
  saveUserDetails,
} from "../../services/UserDetailServices";

import { useAuth } from "../../context/AuthContext";

// ─── Empty form ────────────────────────────────────────
const EMPTY_FORM = {
  id: null,
  full_name: "",
  gender: "",
  date_of_birth: "",
  marital_status: "",
  spouse_name: "",
  blood_group: "",
  religion: "",
  nationality: "",
  contact: "",
  present_address: "",
  permanent_address: "",
  father_name: "",
  mother_name: "",
  nid_number: "",
  birth_number: "",
  emergency_contact_name: "",
  emergency_contact_relation: "",
  emergency_contact_phone: "",
  emergency_contact_address: "",
  joining_date: "",
  resignation_date: "",
  image_url: "",
};

// ─── Small input wrappers ──────────────────────────────
function Field({ label, children, required = false }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}

function TextInput({ value, onChange, type = "text", disabled = false, placeholder = "" }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 disabled:bg-gray-100 disabled:dark:bg-gray-900 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}

function TextArea({ value, onChange, rows = 3, disabled = false }) {
  return (
    <textarea
      rows={rows}
      value={value ?? ""}
      onChange={onChange}
      disabled={disabled}
      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 disabled:bg-gray-100 disabled:dark:bg-gray-900 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}

function SelectInput({ value, onChange, options, disabled = false }) {
  return (
    <select
      value={value ?? ""}
      onChange={onChange}
      disabled={disabled}
      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 disabled:bg-gray-100 disabled:dark:bg-gray-900 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function UserDetails() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [original, setOriginal] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);

  const isNew = !form.id;

  // ─── LOAD ────────────────────────────────────────────
  const load = async () => {
    if (!userId) {
      setError("You must be logged in to view your details.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetchUserDetailByUserId(userId);
      const data = res?.data;

      if (!data || !data.id) {
        setForm(EMPTY_FORM);
        setOriginal(EMPTY_FORM);
      } else {
        setForm(data);
        setOriginal(data);
      }
      setImageFile(null);
    } catch (err) {
      const msg = String(err?.message || "").toLowerCase();
      const isNotFound =
        msg.includes("not found") ||
        msg.includes("no data") ||
        msg.includes("user details not found");

      if (isNotFound) {
        setForm(EMPTY_FORM);
        setOriginal(EMPTY_FORM);
        setError("");
      } else {
        setError(err.message || "Failed to load your details.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ─── DERIVED ─────────────────────────────────────────
  const changes = useMemo(() => {
    const out = {};
    Object.keys(EMPTY_FORM).forEach((k) => {
      if (k === "id" || k === "image_url") return;
      if ((form[k] ?? "") !== (original[k] ?? "")) out[k] = form[k];
    });
    return out;
  }, [form, original]);

  const dirty = Object.keys(changes).length > 0 || !!imageFile;

  // ─── FIELD HANDLER ───────────────────────────────────
  const setField = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ─── SAVE ────────────────────────────────────────────
  const handleSave = async () => {
    // Full name is the only required field
    if (!form.full_name || !form.full_name.trim()) {
      showErrorToast("Full name is required.");
      return;
    }

    let payload;
    if (isNew) {
      // Send everything that has a value on create
      payload = {};
      Object.keys(EMPTY_FORM).forEach((k) => {
        if (k === "id" || k === "image_url") return;
        if (form[k] !== undefined && form[k] !== null && form[k] !== "") {
          payload[k] = form[k];
        }
      });
    } else {
      payload = { id: form.id, ...changes };
    }

    if (imageFile) payload.image = imageFile;

    if (Object.keys(payload).length === 0) {
      showInfoToast("Nothing to save.");
      return;
    }

    setSaving(true);
    try {
      const res = isNew
        ? await saveUserDetails(payload)
        : await updateUserDetails(payload);

      const updated = res.data || {};
      setForm((prev) => ({ ...prev, ...updated }));
      setOriginal((prev) => ({ ...prev, ...updated }));
      setImageFile(null);
      showSuccessToast(isNew ? "Profile created." : "Saved.");
    } catch (err) {
      showErrorToast(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════
  return (
    <div>
      <PageHeader
        title="My Details"
        icon={User}
        breadcrumb
        onClickGuide={() => showInfoToast("Fill the form and click Save.")}
      />

      <CardBox
        title="Profile Information"
        icon={User}
        headerBgColor="light"
        buttons={[
          {
            text: "Refresh",
            icon: RefreshCw,
            color: "secondary",
            onClick: load,
          },
        ]}
      >
        {error && <AlertMessage type="danger" message={error} />}

        {isNew && !error && !loading && (
          <div className="mb-4">
            <AlertMessage
              type="info"
              message="You haven't filled your profile yet. Fill the form below and click Create Profile."
            />
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-gray-500">
            <RefreshCw className="inline-block animate-spin mb-2" />
            <div>Loading your details…</div>
          </div>
        ) : (
          <>
            {/* ─── Photo ─── */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              {imageFile ? (
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="preview"
                  className="w-20 h-20 rounded-lg object-cover border"
                />
              ) : form.image_url ? (
                <img
                  src={form.image_url}
                  alt="current"
                  className="w-20 h-20 rounded-lg object-cover border"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg border bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-400">
                  No Photo
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="text-xs"
                />
                {imageFile && (
                  <button
                    type="button"
                    onClick={() => setImageFile(null)}
                    className="ml-2 text-xs text-red-600 hover:underline"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* ─── Section: Personal Info ─── */}
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Personal Info
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Field label="Full Name" required>
                <TextInput value={form.full_name} onChange={setField("full_name")} />
              </Field>

              <Field label="Gender">
                <SelectInput
                  value={form.gender}
                  onChange={setField("gender")}
                  options={[
                    { value: "", label: "— Select —" },
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                    { value: "Other", label: "Other" },
                  ]}
                />
              </Field>

              <Field label="Date of Birth">
                <TextInput
                  type="date"
                  value={form.date_of_birth || ""}
                  onChange={setField("date_of_birth")}
                />
              </Field>

              <Field label="Marital Status">
                <SelectInput
                  value={form.marital_status}
                  onChange={setField("marital_status")}
                  options={[
                    { value: "", label: "— Select —" },
                    { value: "Single", label: "Single" },
                    { value: "Married", label: "Married" },
                    { value: "Divorced", label: "Divorced" },
                    { value: "Widowed", label: "Widowed" },
                  ]}
                />
              </Field>

              {form.marital_status === "Married" && (
                <Field label="Spouse Name">
                  <TextInput value={form.spouse_name} onChange={setField("spouse_name")} />
                </Field>
              )}

              <Field label="Blood Group">
                <TextInput value={form.blood_group} onChange={setField("blood_group")} />
              </Field>

              <Field label="Religion">
                <TextInput value={form.religion} onChange={setField("religion")} />
              </Field>

              <Field label="Nationality">
                <TextInput value={form.nationality} onChange={setField("nationality")} />
              </Field>
            </div>

            {/* ─── Section: Contact & Address ─── */}
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Contact & Address
            </h3>
            <div className="grid grid-cols-1 gap-4 mb-6">
              <Field label="Contact Number">
                <TextInput value={form.contact} onChange={setField("contact")} />
              </Field>

              <Field label="Present Address">
                <TextArea value={form.present_address} onChange={setField("present_address")} />
              </Field>

              <Field label="Permanent Address">
                <TextArea value={form.permanent_address} onChange={setField("permanent_address")} />
              </Field>
            </div>

            {/* ─── Section: Family & Identity ─── */}
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Family & Identity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Field label="Father's Name">
                <TextInput value={form.father_name} onChange={setField("father_name")} />
              </Field>

              <Field label="Mother's Name">
                <TextInput value={form.mother_name} onChange={setField("mother_name")} />
              </Field>

              <Field label="NID Number">
                <TextInput value={form.nid_number} onChange={setField("nid_number")} />
              </Field>

              <Field label="Birth Certificate Number">
                <TextInput value={form.birth_number} onChange={setField("birth_number")} />
              </Field>
            </div>

            {/* ─── Section: Emergency Contact ─── */}
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Field label="Emergency Contact Name">
                <TextInput
                  value={form.emergency_contact_name}
                  onChange={setField("emergency_contact_name")}
                />
              </Field>

              <Field label="Relation">
                <TextInput
                  value={form.emergency_contact_relation}
                  onChange={setField("emergency_contact_relation")}
                />
              </Field>

              <Field label="Emergency Phone">
                <TextInput
                  value={form.emergency_contact_phone}
                  onChange={setField("emergency_contact_phone")}
                />
              </Field>

              <Field label="Emergency Address">
                <TextInput
                  value={form.emergency_contact_address}
                  onChange={setField("emergency_contact_address")}
                />
              </Field>
            </div>

            {/* ─── Section: Administrative ─── */}
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-6">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
                Administrative (read-only)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Joining Date">
                  <TextInput value={form.joining_date || ""} disabled />
                </Field>
                <Field label="Resignation Date">
                  <TextInput value={form.resignation_date || ""} disabled />
                </Field>
              </div>
            </div>

            {dirty && (
              <div className="mb-4">
                <AlertMessage type="warning" message="You have unsaved changes." />
              </div>
            )}

            {/* ─── Save row ─── */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <LoadingButton
                isLoading={saving}
                text={saving ? "Saving…" : isNew ? "Create Profile" : "Save Changes"}
                icon={Save}
                onClick={handleSave}
                className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold uppercase disabled:opacity-60"
              />
            </div>
          </>
        )}
      </CardBox>
    </div>
  );
}