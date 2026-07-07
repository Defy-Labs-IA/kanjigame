import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const form = await req.formData();
  const pass = String(form.get("password") || "");
  const expected = process.env.ADMIN_PASSWORD || "kanji-admin";

  if (pass !== expected) {
    return NextResponse.redirect(new URL("/admin/login?erro=1", req.url), 303);
  }

  const res = NextResponse.redirect(new URL("/admin", req.url), 303);
  res.cookies.set("kmg_admin", "ok", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8h
  });
  return res;
}
