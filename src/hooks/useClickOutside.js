import { useEffect } from "react";

export default function useClickOutside(ref, handler) {
  useEffect(() => {
    function onPointerDown(e) {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") handler(e);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, handler]);
}