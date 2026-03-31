import { NextRequest, NextResponse } from "next/server";
import { updateSession, decrypt } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (request.nextUrl.pathname === '/admin/login') {
      return response;
    }
    
    const session = request.cookies.get("session")?.value;
    let isValid = false;
    
    if (session) {
      try {
        await decrypt(session);
        isValid = true;
      } catch (e) {}
    }

    if (!isValid) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Also protect admin API routes
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    if (request.nextUrl.pathname === '/api/admin/login') {
      return response;
    }
    const session = request.cookies.get("session")?.value;
    let isValid = false;
    if (session) {
      try {
        await decrypt(session);
        isValid = true;
      } catch (e) {}
    }

    if (!isValid) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
