// src/pages/Signup.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User as UserIcon, UserCog } from "lucide-react";

import TextInput from "../components/TextInput";
import SelectInput from "../components/SelectInput";
import LoadingButton from "../components/LoadingButton";
import AlertMessage from "../components/AlertMessage";

import { showSuccessToast, showErrorToast } from "../Helper/TosterHelper";
import apiClient from "../Axios/axiosConfig";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    password_confirmation: "",
    user_type_id: "",
  });
  const [userTypes, setUserTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState({});

  // Public endpoint to feed the "User Type" dropdown
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get("public/user-types");
        setUserTypes(res.data?.data || []);
      } catch {
        // silent — dropdown stays empty
      }
    })();
  }, []);

  const setField = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
    if (formError) setFormError("");
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Invalid email";
    if (!form.username.trim()) errs.username = "Username is required";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6) errs.password = "Min 6 characters";
    if (form.password !== form.password_confirmation)
      errs.password_confirmation = "Passwords do not match";
    if (!form.user_type_id) errs.user_type_id = "Select a user type";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showErrorToast("Please fix the highlighted fields");
      return;
    }

    setLoading(true);
    setFormError("");
    try {
      const res = await apiClient.post("auth/signup", {
        ...form,
        user_type_id: Number(form.user_type_id),
      });
      if (res.data?.success) {
        setSuccess(res.data.message || "Signup submitted for approval.");
        showSuccessToast("Signup submitted");
      } else {
        throw new Error(res.data?.message || "Signup failed");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "Signup failed";
      setFormError(msg);
      showErrorToast(msg);
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    { value: "", label: "— Select a user type —" },
    ...userTypes.map((t) => ({
      value: String(t.id),
      label: t.company?.name ? `${t.name} (${t.company.name})` : t.name,
    })),
  ];

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertMessage type="success" message={success} />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You'll be able to log in once an administrator approves your account.
          </p>
          <Link
            to="/login"
            className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
          Create your account
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Your account needs approval from an administrator.
        </p>

        {formError && (
          <div className="mb-4">
            <AlertMessage type="danger" message={formError} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <TextInput
            label="Full Name"
            name="name"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            icon={UserIcon}
            required
            error={errors.name}
          />

          <TextInput
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            icon={Mail}
            required
            error={errors.email}
          />

          <TextInput
            label="Username"
            name="username"
            value={form.username}
            onChange={(e) => setField("username", e.target.value)}
            required
            error={errors.username}
          />

          <TextInput
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={(e) => setField("password", e.target.value)}
            icon={Lock}
            required
            error={errors.password}
          />

          <TextInput
            label="Confirm Password"
            name="password_confirmation"
            type="password"
            value={form.password_confirmation}
            onChange={(e) => setField("password_confirmation", e.target.value)}
            icon={Lock}
            required
            error={errors.password_confirmation}
          />

          <SelectInput
            label="User Type"
            name="user_type_id"
            value={form.user_type_id}
            onChange={(e) => setField("user_type_id", e.target.value)}
            options={typeOptions}
            required
            error={errors.user_type_id}
          />

          <LoadingButton
            isLoading={loading}
            text="Sign Up"
            type="submit"
            className="w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
          />

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}