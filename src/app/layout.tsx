import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import MainWrapper from "@/components/MainWrapper";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "miniory3d - printed creations",
  description: "Calculate true cost and selling price for FDM 3D print jobs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-zinc-950 text-zinc-100 min-h-screen`}>
        <NavBar />
        <MainWrapper>{children}</MainWrapper>
      </body>
    </html>
  );
}
