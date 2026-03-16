"use client";

import { useEffect, useState } from "react";

export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // admin_ui cookie is readable by JS (non-httpOnly)
    const match = document.cookie.match(/(?:^|;\s*)admin_ui=([^;]+)/);
    setIsAdmin(match !== null && match[1] === "1");
  }, []);

  return isAdmin;
}
