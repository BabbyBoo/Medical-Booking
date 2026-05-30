import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/auth/register") ||
    pathname === "/"
  ) {
    // If already logged in, redirect to dashboard
    if (token && (pathname === "/login" || pathname === "/register")) {
      const role = token.role as string;
      if (role === "PATIENT") return NextResponse.redirect(new URL("/patient/dashboard", request.url));
      if (role === "DOCTOR") return NextResponse.redirect(new URL("/doctor/dashboard", request.url));
      if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protected routes - require authentication
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = token.role as string;

  // Role-based access
  if (pathname.startsWith("/patient") && role !== "PATIENT") {
    if (role === "DOCTOR") return NextResponse.redirect(new URL("/doctor/dashboard", request.url));
    if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/doctor") && role !== "DOCTOR") {
    if (role === "PATIENT") return NextResponse.redirect(new URL("/patient/dashboard", request.url));
    if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    if (role === "PATIENT") return NextResponse.redirect(new URL("/patient/dashboard", request.url));
    if (role === "DOCTOR") return NextResponse.redirect(new URL("/doctor/dashboard", request.url));
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/patient/:path*",
    "/doctor/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
