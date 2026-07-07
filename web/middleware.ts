import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protege /admin/* exigindo o cookie de sessao. /admin/login fica liberado.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  const ok = req.cookies.get("kmg_admin")?.value === "ok";
  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
