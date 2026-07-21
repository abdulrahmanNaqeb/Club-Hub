import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in",
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
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
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (!orgId && pathname !== "/select-club") {
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
