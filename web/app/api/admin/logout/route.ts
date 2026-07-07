import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/admin/login", req.url), 303);
  res.cookies.set("kmg_admin", "", { path: "/", maxAge: 0 });
  return res;
}
