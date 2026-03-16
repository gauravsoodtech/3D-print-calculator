"use client";

import { usePathname } from "next/navigation";

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Share pages handle their own full-screen layout
  if (pathname.startsWith("/q/")) return <>{children}</>;

  return <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>;
}
