import { toast } from "react-toastify";

/**
 * TosterHelper — react-toastify wrappers
 * Usage:
 *   import { showSuccessToast, showErrorToast } from "../Helper/TosterHelper";
 *   showSuccessToast("Saved!");
 */

export const showSuccessToast = (message) =>
  toast.success(message || "Success", {
    position: "top-center",
    autoClose: 3000,
  });

export const showErrorToast = (message) =>
  toast.error(message || "Something went wrong!", {
    position: "top-center",
    autoClose: 4000,
  });

export const showWarningToast = (message) =>
  toast.warning(message || "Warning", {
    position: "top-center",
    autoClose: 3500,
  });

export const showInfoToast = (message) =>
  toast.info(message || "Information", {
    position: "top-center",
    autoClose: 3000,
  });