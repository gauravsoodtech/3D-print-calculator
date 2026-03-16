"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";

const BASE_LINKS = [
  { href: "/", label: "Calculator" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export default function NavBar() {
  const pathname = usePathname();
  const isAdmin = useIsAdmin();

  // Share/preview pages are standalone — no nav
  if (pathname.startsWith("/q/")) return null;

  const links = isAdmin
    ? [...BASE_LINKS, { href: "/admin", label: "Quotations" }]
    : BASE_LINKS;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-1">
        <div className="flex items-center gap-2 mr-5">
          <span className="text-orange-500 text-xl">⬡</span>
          <span className="font-bold text-sm tracking-tight">
            <span className="text-orange-400">miniory</span>
            <span className="text-zinc-100">3D</span>
          </span>
        </div>
        {links.map(({ href, label }) => {
          const active = pathname === href || (href === "/admin" && pathname.startsWith("/admin"));
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
