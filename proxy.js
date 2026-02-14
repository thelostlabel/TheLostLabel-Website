
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(req) {
    const path = req.nextUrl.pathname;

    // Define protected routes
    const protectedRoutes = ['/dashboard', '/admin'];
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

    // Define admin-only routes
    const adminRoutes = ['/admin', '/api/admin'];
    const isAdminRoute = adminRoutes.some(route => path.startsWith(route));

    if (isProtectedRoute) {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!token) {
            const url = new URL('/auth/login', req.url);
            url.searchParams.set('callbackUrl', path);
            return NextResponse.redirect(url);
        }

        // Role-based access control for admin routes
        if (isAdminRoute && token.role !== 'admin') {
            // Redirect non-admins trying to access admin pages to dashboard
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        // Specific check: Block 'pending' users from accessing dashboard even if they have a token (double check)
        if (token.status !== 'approved' && token.role !== 'admin') {
            return NextResponse.redirect(new URL('/auth/login?error=AccountPending', req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/admin/:path*',
        '/api/admin/:path*'
    ]
};
