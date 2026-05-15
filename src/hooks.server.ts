// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('session_token');
	const isAuthPath = event.url.pathname.startsWith('/auth');
	const isLoginPath = event.url.pathname === '/login' || event.url.pathname === '/register';

	// Simple route protection
	if (!token && !isAuthPath && !isLoginPath && event.url.pathname !== '/') {
		// If no token and trying to access protected route, redirect to login
		// return Response.redirect(`${event.url.origin}/login`, 302);
	}

	const response = await resolve(event);
	return response;
};
