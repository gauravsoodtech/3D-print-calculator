import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { signToken, COOKIE_NAME, COOKIE_UI_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";

  if (!adminPassword) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  let valid = false;
  try {
    const a = Buffer.from(password ?? "", "utf8");
    const b = Buffer.from(adminPassword, "utf8");
    if (a.length === b.length) {
      valid = timingSafeEqual(a, b);
    }
  } catch {
    valid = false;
  }

  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await signToken({ role: "admin" });
  const res = NextResponse.json({ ok: true });

  // httpOnly session cookie — enforced server-side
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  // Non-httpOnly UI cookie — for client-side admin detection only
  res.cookies.set(COOKIE_UI_NAME, "1", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}
