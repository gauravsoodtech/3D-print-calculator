"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Calculator", icon: "⬡" },
  { href: "/history", label: "History", icon: "⊞" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-1">
        <div className="flex items-center gap-2 mr-5">
          <span className="text-orange-500 text-xl">⬡</span>
          <span className="font-bold text-sm tracking-tight">
            <span className="text-orange-400">Print</span>
            <span className="text-zinc-100">Calc</span>
          </span>
        </div>
        {LINKS.map(({ href, label }) => {
          const active = pathname === href;
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
