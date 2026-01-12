import { handleAuth, handleLogin, handleCallback, handleLogout } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

// 1. Define the Callback Logic (Server-Side Token Exchange)
const afterCallback = async (req: any, session: any, state: any) => {
    const { accessToken } = session;

    try {
        // 2. Send Auth0 Token to NestJS Backend
        // Backend verifies it and returns its own JWTs
        const backendResponse = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ auth0Token: accessToken }),
        });

        if (backendResponse.ok) {
            const data = await backendResponse.json();

            // 3. Store the NestJS Tokens in the Auth0 Session
            // We overwrite the session's accessToken with the Backend's token
            // so the client retrieves the Backend token automatically.
            return {
                ...session,
                user: {
                    ...session.user,
                    ...data.user, // Merge backend user data if any
                },
                accessToken: data.accessToken, // Replace with NestJS Access Token
                refreshToken: data.refreshToken, // Store NestJS Refresh Token (if needed)
                // Store original auth0 token if you need it later, e.g. in protected props
                // auth0AccessToken: accessToken 
            };
        } else {
            console.error('Backend Login Failed:', await backendResponse.text());
            throw new Error('Failed to exchange token with backend. Login aborted.');
        }
    } catch (error) {
        console.error('Error exchanging token with backend:', error);
        throw error;
    }

    return session;
};

// 4. Create the Handlers using @auth0/nextjs-auth0
const authHandler = handleAuth({
    login: async (req: any, res: any) => {
        const { searchParams } = new URL(req.url);
        const connection = searchParams.get('connection');

        // Robustly determine audience
        const audience = process.env.AUTH0_AUDIENCE || process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;
        console.log('Initiating Auth0 Login with Audience:', audience);

        return handleLogin({
            authorizationParams: {
                audience: audience,
                scope: 'openid profile email offline_access',
                ...(connection && { connection }),
            },
            returnTo: '/dashboard',
        })(req, res);
    },
    callback: handleCallback({
        afterCallback,
    }),
    logout: handleLogout({
        returnTo: '/auth/login',
    })
});

// 5. NEXT.JS 16 COMPATIBILITY WRAPPER
// Next.js 16 passes params as a Promise, but v3 library expects an object.
export const GET = async (req: NextRequest, props: { params: Promise<{ auth0: string[] }> }) => {
    const params = await props.params;
    return authHandler(req, { params });
};
