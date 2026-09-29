// src/pages/UserManagement/UserDetails.jsx
import { useEffect, useMemo, useState } from "react";
import {
  User,
  Users,
  Home,
  HeartPulse,
  Save,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

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

// ─── Steps config ──────────────────────────────────────
const STEPS = [
  { id: 1, title: "Personal Info",     icon: User },
  { id: 2, title: "Contact & Address", icon: Home },
  { id: 3, title: "Family & Identity", icon: Users },
  { id: 4, title: "Emergency & Misc",  icon: HeartPulse },
];

const STEP_FIELDS = {
  1: ["full_name", "gender", "date_of_birth", "marital_status", "spouse_name", "blood_group", "religion", "nationality"],
  2: ["contact", "present_address", "permanent_address"],
  3: ["father_name", "mother_name", "nid_number", "birth_number"],
  4: ["emergency_contact_name", "emergency_contact_relation", "emergency_contact_phone", "emergency_contact_address"],
};

// Empty form template — used when no record exists yet
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

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [original, setOriginal] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);

  // Whether this is a brand-new profile (no DB record yet)
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

      // If the API returns empty data (no record), fall back to blank form
      if (!data || !data.id) {
        setForm(EMPTY_FORM);
        setOriginal(EMPTY_FORM);
      } else {
        setForm(data);
        setOriginal(data);
      }
      setImageFile(null);
    } catch (err) {
      // 404 / "not found" → treat as a blank form instead of an error
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
  const currentStepFields = STEP_FIELDS[step] || [];

  const stepChanges = useMemo(() => {
    const out = {};
    currentStepFields.forEach((k) => {
      if ((form[k] ?? "") !== (original[k] ?? "")) out[k] = form[k];
    });
    return out;
  }, [form, original, currentStepFields]);

  const stepDirty = Object.keys(stepChanges).length > 0 || !!imageFile;

  // ─── FIELD HANDLER ───────────────────────────────────
  const setField = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ─── SAVE ────────────────────────────────────────────
  const saveStep = async () => {
    // For an existing record → update only changed fields of this step
    // For a new record      → send every field on this step (create/upsert)
    let payload;

    if (isNew) {
      // On first save, collect current step's values (all fields of the step)
      payload = {};
      currentStepFields.forEach((k) => {
        if (form[k] !== undefined && form[k] !== null && form[k] !== "") {
          payload[k] = form[k];
        }
      });
    } else {
      payload = { id: form.id, ...stepChanges };
    }

    if (imageFile) payload.image = imageFile;

    // Nothing to save?
    if (Object.keys(payload).length === 0) {
      showInfoToast("Nothing to save on this step.");
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

  // ─── NAVIGATION ──────────────────────────────────────
  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length));
  const goPrev = () => setStep((s) => Math.max(s - 1, 1));

  const Stepper = () => (
    <div className="flex items-center justify-between mb-4 gap-2 overflow-x-auto">
      {STEPS.map((s, idx) => {
        const Icon = s.icon;
        const active = step === s.id;
        const done = step > s.id;

        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
              active
                ? "bg-blue-600 border-blue-600 text-white"
                : done
                ? "bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
            <span className="hidden sm:inline">{s.title}</span>
            <span className="sm:hidden">Step {s.id}</span>
            {idx < STEPS.length - 1 && (
              <ChevronRight className="w-4 h-4 opacity-50 ml-1" />
            )}
          </button>
        );
      })}
    </div>
  );

  // ═══════════════════════════════════════════════════
  // STEP CONTENT
  // ═══════════════════════════════════════════════════
  const renderStep1 = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2 flex items-center gap-4">
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

      <Field label="Full Name" required>
        <TextInput value={form.full_name} onChange={setField("full_name")} />
      </Field>

      <Field label="Gender" required>
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

      <Field label="Date of Birth" required>
        <TextInput
          type="date"
          value={form.date_of_birth || ""}
          onChange={setField("date_of_birth")}
        />
      </Field>

      <Field label="Marital Status" required>
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

      <Field label="Nationality" required>
        <TextInput value={form.nationality} onChange={setField("nationality")} />
      </Field>
    </div>
  );

  const renderStep2 = () => (
    <div className="grid grid-cols-1 gap-4">
      <Field label="Contact Number" required>
        <TextInput value={form.contact} onChange={setField("contact")} />
      </Field>

      <Field label="Present Address" required>
        <TextArea value={form.present_address} onChange={setField("present_address")} />
      </Field>

      <Field label="Permanent Address" required>
        <TextArea value={form.permanent_address} onChange={setField("permanent_address")} />
      </Field>
    </div>
  );

  const renderStep3 = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Father's Name" required>
        <TextInput value={form.father_name} onChange={setField("father_name")} />
      </Field>

      <Field label="Mother's Name" required>
        <TextInput value={form.mother_name} onChange={setField("mother_name")} />
      </Field>

      <Field label="NID Number">
        <TextInput value={form.nid_number} onChange={setField("nid_number")} />
      </Field>

      <Field label="Birth Certificate Number">
        <TextInput value={form.birth_number} onChange={setField("birth_number")} />
      </Field>
    </div>
  );

  const renderStep4 = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="sm:col-span-2 mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
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
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
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
        onClickGuide={() => showInfoToast("Fill each step and save.")}
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
              message="You haven't filled your profile yet. Fill each step and click Save to create it."
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
            <Stepper />

            <div className="mt-4">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">
                Step {step}: {STEPS.find((s) => s.id === step)?.title}
              </h3>

              {renderStep()}
            </div>

            {stepDirty && (
              <div className="mt-3">
                <AlertMessage
                  type="warning"
                  message={`You have unsaved changes on step ${step}.`}
                />
              </div>
            )}

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={step === 1}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  disabled={step === STEPS.length}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <LoadingButton
                isLoading={saving}
                text={saving ? "Saving…" : isNew ? "Create Profile" : "Save Step"}
                icon={Save}
                onClick={saveStep}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold uppercase disabled:opacity-60"
              />
            </div>
          </>
        )}
      </CardBox>
    </div>
  );
}