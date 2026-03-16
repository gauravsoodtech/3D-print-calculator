import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "3D Print Cost Calculator",
  description: "Calculate true cost and selling price for FDM 3D print jobs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-zinc-950 text-zinc-100 min-h-screen`}>
        <NavBar />
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
