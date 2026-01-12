import { getAccessToken, getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export const GET = withApiAuthRequired(async function GET(req) {
    try {
        // 1. Get the session (which contains the swapped NestJS token)
        // We pass empty Response as second arg required by v3 getSession
        const session = await getSession(req, new NextResponse());

        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'No session found' }, { status: 401 });
        }

        // 2. Return the NestJS Token to the client
        return NextResponse.json({
            accessToken: session.accessToken,
            refreshToken: session.refreshToken
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
});
