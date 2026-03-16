import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import MainWrapper from "@/components/MainWrapper";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "miniory3d - printed creations",
  description: "Custom 3D printed creations — get a quote for your next project.",
  openGraph: {
    title: "miniory3d - printed creations",
    description: "Custom 3D printed creations — get a quote for your next project.",
    url: "https://minory3d.vercel.app",
    siteName: "miniory3d",
    type: "website",
  },
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
