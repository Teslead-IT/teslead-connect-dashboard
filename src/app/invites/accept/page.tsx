'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser as useAuth0User } from '@auth0/nextjs-auth0/client';
import { useUser } from '@/hooks/use-auth';
import { invitationsApi } from '@/services/invitations.service';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function AcceptInviteContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const router = useRouter();

    // Check both Auth0 and Backend authentication
    const { user: auth0User, isLoading: isAuth0Loading } = useAuth0User();
    const { data: backendUser, isLoading: isBackendLoading, isFetching: isBackendFetching } = useUser();

    const [status, setStatus] = useState<'validating' | 'accepting' | 'success' | 'error'>('validating');
    const [message, setMessage] = useState('Verifying invitation...');

    useEffect(() => {
        // 1. Check if token exists
        if (!token) {
            setStatus('error');
            setMessage('Invalid invitation link. No token provided.');
            return;
        }

        // 2. Wait for auth to load
        // If we don't have a user yet, and we are fetching (e.g. verifying token), wait.
        if (isAuth0Loading || isBackendLoading || (!backendUser && isBackendFetching)) return;

        // 3. Check if user is logged in (strictly check backend session for tokens)
        const isAuthenticated = !!backendUser;

        if (!isAuthenticated) {
            // Redirect to custom login with return url to come back here
            const returnUrl = encodeURIComponent(`/invites/accept?token=${token}`);
            router.push(`/auth/login?returnTo=${returnUrl}`);
            return;
        }

        // 4. If logged in, automatically accept the invite
        if (isAuthenticated) {
            handleAccept();
        }
    }, [auth0User, backendUser, isAuth0Loading, isBackendLoading, isBackendFetching, token, router]);

    const handleAccept = async () => {
        if (!token) return;

        setStatus('accepting');
        setMessage('Joining organization...');

        try {
            await invitationsApi.acceptInvite(token);
            setStatus('success');
            setMessage('Successfully joined the organization!');

            // Redirect to dashboard after delay
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (error: any) {
            setStatus('error');
            // Extract error message safely
            const errorMsg = error?.response?.data?.message || error?.message || 'Failed to accept invitation.';
            setMessage(errorMsg);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 text-center">

                    {/* Status Icons */}
                    <div className="flex justify-center mb-6">
                        {(status === 'validating' || status === 'accepting' || ((isAuth0Loading || isBackendLoading || isBackendFetching) && token)) && (
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-25"></div>
                                <div className="relative bg-blue-50 p-4 rounded-full">
                                    <Loader2 className="w-8 h-8 text-[#091590] animate-spin" />
                                </div>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="bg-green-50 p-4 rounded-full">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="bg-red-50 p-4 rounded-full">
                                <XCircle className="w-8 h-8 text-red-600" />
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {status === 'success' ? 'Welcome Aboard!' : 'Invitation'}
                    </h1>

                    {/* Message */}
                    <p className="text-gray-500 mb-8">
                        {message}
                    </p>

                    {/* Actions */}
                    {status === 'success' && (
                        <Button
                            className="w-full justify-center bg-[#091590] hover:bg-[#071170]"
                            onClick={() => router.push('/dashboard')}
                        >
                            Go to Dashboard
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}

                    {status === 'error' && (
                        <div className="space-y-3">
                            <Button
                                className="w-full justify-center"
                                variant="secondary"
                                onClick={() => router.push('/dashboard')}
                            >
                                Go to Dashboard
                            </Button>
                            <p className="text-xs text-gray-400 mt-4">
                                If you believe this is an error, please ask the administrator to resend the invitation.
                            </p>
                        </div>
                    )}

                    {/* Auth Loading State */}
                    {(!auth0User && !backendUser && (isAuth0Loading || isBackendLoading || isBackendFetching)) && (
                        <p className="text-xs text-gray-400 mt-4">Checking authentication...</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen grid place-items-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
        }>
            <AcceptInviteContent />
        </Suspense>
    );
}
