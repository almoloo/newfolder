import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'better-auth.session_token';
const SECURE_SESSION_COOKIE = `__Secure-${SESSION_COOKIE}`;

function hasSession(request: NextRequest): boolean {
	return (
		request.cookies.has(SESSION_COOKIE) ||
		request.cookies.has(SECURE_SESSION_COOKIE)
	);
}

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const authenticated = hasSession(request);

	// Redirect authenticated users away from the homepage to the dashboard
	if (pathname === '/' && authenticated) {
		return NextResponse.redirect(new URL('/dashboard', request.url));
	}

	// Protect all non-homepage routes: unauthenticated → back to homepage
	if (pathname !== '/' && !authenticated) {
		return NextResponse.redirect(new URL('/', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all paths except:
		 * - /api/auth/* (better-auth endpoints must stay public)
		 * - /_next/* (Next.js internals)
		 * - /favicon.ico, /public assets
		 */
		'/((?!api/auth|_next/static|_next/image|favicon.ico|manifest\\.webmanifest|.*\\.svg$|.*\\.png$|.*\\.ico$|.*\\.jpg$|.*\\.webp$).*)',
	],
};
