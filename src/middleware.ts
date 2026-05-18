import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (
    path.startsWith("/login") || path.startsWith("/register") ||
    path.startsWith("/api") || path.startsWith("/_next") ||
    path.startsWith("/_vercel") || path.includes(".")
  ) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.getAll().some(c =>
    c.name.startsWith("sb-")
  );

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};