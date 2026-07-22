import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in",
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up",
];

// Signed-in users without an org may still reach these — e.g. a student
// applying to start a club doesn't belong to any Clerk org yet.
const NO_ORG_REQUIRED_PATHS = ["/select-club", "/apply", "/api/institutions"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function isNoOrgRequiredPath(pathname: string) {
  return NO_ORG_REQUIRED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;
  const { userId, orgId } = await auth();

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!userId) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_url", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  if (!orgId && !isNoOrgRequiredPath(pathname)) {
    return NextResponse.redirect(new URL("/select-club", request.url));
  }

  if (orgId && pathname === "/select-club") {
    return NextResponse.redirect(new URL("/team", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
