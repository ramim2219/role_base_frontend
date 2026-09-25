import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * TitleHandler — updates document.title based on route.
 *
 * Usage (in AppRoutes or App):
 *   <TitleHandler
 *     titles={{
 *       "/": "Dashboard",
 *       "/users": "Users",
 *       "/settings": "Settings",
 *       "/profile": "Profile",
 *       "/billing": "Billing",
 *       "/help": "Help & Support",
 *       "/login": "Login",
 *       "/lesson-plan/:sessionId": "Lesson Plan",
 *     }}
 *     appName="Admin Panel"
 *   />
 */
export default function TitleHandler({
  titles = {},
  appName = "Admin Panel",
  fallback = "Page",
}) {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = titles[path];

    // Handle dynamic routes like /lesson-plan/:sessionId
    if (!title) {
      const match = Object.keys(titles).find((key) => {
        if (!key.includes(":")) return false;
        const regex = new RegExp(
          "^" + key.replace(/:[^/]+/g, "[^/]+") + "$"
        );
        return regex.test(path);
      });
      if (match) title = titles[match];
    }

    document.title = `${title || fallback} | ${appName}`;
  }, [location.pathname, titles, appName, fallback]);

  return null;
}