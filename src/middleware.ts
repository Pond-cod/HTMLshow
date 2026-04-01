import { NextRequest, NextResponse } from "next/server";
import { updateSession, decrypt } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const path = request.nextUrl.pathname;

  const isAdminRoute = path.startsWith('/admin');
  const isAdminApiRoute = path.startsWith('/api/admin');

  if (isAdminRoute || isAdminApiRoute) {
    if (path === '/admin/login' || path === '/api/admin/login') {
      return response;
    }
    
    const session = request.cookies.get("session")?.value;
    let isValid = false;
    
    if (session) {
      try {
        await decrypt(session);
        isValid = true;
      } catch (e: any) {
        console.error("Session decryption failed:", e.message);
      }
    }

    if (!isValid) {
      if (isAdminApiRoute) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Unauthorized' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        );
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
