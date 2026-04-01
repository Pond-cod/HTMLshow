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
    let userRole = '';
    
    if (session) {
      try {
        const payload = await decrypt(session);
        isValid = true;
        userRole = payload.role as string;
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

    // Restricted to admin only
    if (path.startsWith('/admin/users') || path.startsWith('/api/admin/users')) {
      if (userRole !== 'admin') {
        return NextResponse.redirect(new URL('/admin/projects', request.url));
      }
    }

    // Role-based access for settings (admin, approver, adminuser can view/interact)
    const staffRoutes = ['/admin/settings', '/api/admin/settings'];
    if (staffRoutes.some(r => path.startsWith(r))) {
       if (!['admin', 'approver', 'adminuser'].includes(userRole)) {
          return NextResponse.redirect(new URL('/admin/projects', request.url));
       }
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
