"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { useLogin, useUser } from "@/hooks/use-auth";
import { useUser as useAuth0User } from "@auth0/nextjs-auth0/client";
import { SocialLoginButton } from "@/components/auth/social-login-button";
import { EmailVerificationModal } from "@/components/auth/email-verification-modal";
import { isAuth0Configured } from "@/lib/config";
import { Loader } from "@/components/ui/Loader";
import { Eye, EyeOff } from "lucide-react";

function LoginPageContent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const returnToUrl = searchParams.get('returnTo') || '/dashboard';
    const returnTo = `/organization?returnTo=${encodeURIComponent(returnToUrl)}`;

    const { user: auth0User, isLoading: isAuth0Loading } = useAuth0User();
    const { data: backendUser, isLoading: isBackendLoading, isFetching } = useUser();

    useEffect(() => {
        // Wait for both Auth0 and backend checks to complete before deciding
        if (isAuth0Loading || isBackendLoading || isFetching) {
            return; // Still loading, don't redirect yet
        }

        // Only redirect if we have a valid backend session (both user and tokens)
        const isBackendLoggedIn = backendUser && !isBackendLoading;

        if (isBackendLoggedIn) {
            // If unverified, don't redirect (allow modal to show)
            if (backendUser?.accountStatus === 'UNVERIFIED' || backendUser?.emailVerified === false) {
                return;
            }
            router.replace(returnTo);
        }
    }, [backendUser, isBackendLoading, isFetching, isAuth0Loading, router, returnTo]);

    const { mutate: login, isPending: isLoading, error } = useLogin();

    // Motivational quotes with Indian authors
    const quotes = [
        { text: "Dreams are not what you see in sleep. They are the things that do not let you sleep.", author: "A.P.J. Abdul Kalam" },
        { text: "You cannot believe in God until you believe in yourself.", author: "Swami Vivekananda" },
        { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
        { text: "None can destroy iron, but its own rust can. Likewise, none can destroy a person, but his own mindset can.", author: "Ratan Tata" },
        { text: "If you want to shine like a sun, first burn like a sun.", author: "A.P.J. Abdul Kalam" },
        { text: "Arise, awake, and stop not till the goal is reached.", author: "Swami Vivekananda" },
        { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
        { text: "Confidence and Hard work is the best medicine to kill the disease called failure.", author: "A.P.J. Abdul Kalam" },
        { text: "Take up one idea. Make that one idea your life - think of it, dream of it, live on that idea.", author: "Swami Vivekananda" },
        { text: "I measure the progress of a community by the degree of progress which women have achieved.", author: "B.R. Ambedkar" }
    ];

    const [quote, setQuote] = useState(quotes[0]);

    useEffect(() => {
        setMounted(true);
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login({
            identifier: email,
            password,
        }, {
            onSuccess: (data) => {
                if (data.user.accountStatus === 'UNVERIFIED') {
                    setShowVerifyModal(true);
                } else {
                    setIsRedirecting(true);
                    setTimeout(() => {
                        router.push(returnTo);
                    }, 1000);
                }
            }
        });
    };

    const showSocialLogin = isAuth0Configured();
    const errorMessage = error ? (error as any)?.response?.data?.message || (error as any)?.message || 'Login failed' : null;

    // Show loader while checking auth status to avoid flicker
    // Include isFetching to show loader during token sync
    if (isAuth0Loading || isBackendLoading || isFetching || isRedirecting) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <Loader size={200} />
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex bg-white font-sans overflow-hidden">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative z-10 h-full overflow-y-auto">
                <div className="w-full max-w-sm space-y-6">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-6">
                        <div className="w-16 h-16 relative flex items-center justify-center">
                            <Image src="/logo/single-logo.png" alt="Logo" width={64} height={64} className="object-contain" />
                        </div>
                    </div>

                    <div className="text-center lg:text-left space-y-1">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                            Welcome back
                        </h1>
                        <p className="text-gray-500 text-base">
                            Sign in with your email, phone, or username
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                                    Email, Phone, or Username
                                </label>
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-[#091590] focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 outline-none text-base font-medium"
                                    placeholder="Your Name"
                                    autoComplete="username"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-[#091590] focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 outline-none text-base font-medium pr-12"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        required
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#091590] transition-colors p-1"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <Link
                                href="/auth/forgot-password"
                                className="text-sm font-semibold text-[#091590] hover:text-[#071170] hover:underline transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {errorMessage && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
                                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                                </svg>
                                {errorMessage}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full cursor-pointer !bg-[#091590] !hover:bg-[#071170] text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-base"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2 ">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : "Sign in"}
                        </Button>

                        {showSocialLogin && (
                            <>
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-white text-gray-500">Or continue with</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <SocialLoginButton provider="google" disabled={isLoading} />
                                    <SocialLoginButton provider="github" disabled={isLoading} />
                                </div>
                            </>
                        )}

                        <p className="text-center text-gray-500 text-sm mt-6">
                            Don't have an account?{' '}
                            <Link href={returnToUrl !== '/dashboard' ? `/auth/register?returnTo=${encodeURIComponent(returnToUrl)}` : "/auth/register"} className="font-bold cursor-pointer text-[#091590] hover:text-[#071170] hover:underline transition-colors">
                                Sign up now
                            </Link>
                        </p>
                    </form>
                </div>
            </div>

            {/* Right Side - Visuals */}
            <div className="hidden lg:flex w-1/2 bg-[#091590] relative overflow-hidden items-center justify-center p-8">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)`, backgroundSize: '100px 100px' }}></div>

                <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto text-white space-y-12">
                    <div className="flex items-center justify-center p-4">
                        <Image src="/logo/Teslead-Logo.png" alt="Logo" width={120} height={120} className="object-contain" />
                    </div>

                    <div className="space-y-6">
                        <blockquote className="text-3xl md:text-2xl font-semibold leading-relaxed font-serif italic opacity-95">
                            "{mounted ? quote.text : quotes[0].text}"
                        </blockquote>
                        <div className="text-xl font-medium opacity-90 mt-4">
                            — {mounted ? quote.author : quotes[0].author}
                        </div>
                        <div className="flex gap-3 justify-center opacity-70 pt-6">
                            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                        </div>
                    </div>
                </div>
            </div>
            <EmailVerificationModal
                isOpen={showVerifyModal}
                onClose={() => setShowVerifyModal(false)}
                email={email}
            />
        </div>
    );
}

function LoginPage() {
    return (
        <Suspense fallback={
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <Loader size={200} />
            </div>
        }>
            <LoginPageContent />
        </Suspense>
    );
}

export default LoginPage;
