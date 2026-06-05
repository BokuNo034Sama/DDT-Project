import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register") ||
    request.nextUrl.pathname.startsWith("/accept-invite");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");
  const isLandingPage = request.nextUrl.pathname === "/";
  const isPublicRoute = isAuthPage || isApiRoute || isLandingPage;


  // If user is not logged in and trying to access a protected route
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user is logged in and trying to access an auth page (except accept-invite)
  if (
    user &&
    isAuthPage &&
    !request.nextUrl.pathname.startsWith("/accept-invite")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
