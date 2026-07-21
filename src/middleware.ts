import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user, role } = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/accept-invite");
  const isApiRoute = pathname.startsWith("/api");
  const isLandingPage = pathname === "/";
  const isPublicRoute = isAuthPage || isApiRoute || isLandingPage;

  // If user is not logged in and trying to access a protected route
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user is logged in and trying to access an auth page (except accept-invite and reset-password)
  if (
    user &&
    isAuthPage &&
    !pathname.startsWith("/accept-invite") &&
    !pathname.startsWith("/reset-password")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user is logged in and has the staff role, block manager-only routes
  if (user && role === "staff") {
    const isManagerOnly =
      pathname === "/projects" ||
      pathname === "/projects/new" ||
      (pathname.startsWith("/projects/") && pathname.endsWith("/edit")) ||
      pathname.startsWith("/staff") ||
      pathname.startsWith("/search") ||
      pathname.startsWith("/performance") ||
      pathname.startsWith("/admin") ||
      (pathname.startsWith("/settings") && pathname !== "/settings/profile");

    if (isManagerOnly) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
