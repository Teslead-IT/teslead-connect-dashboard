"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
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
import gsap from "gsap";

function LoginPageContent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const returnToUrl = searchParams.get('returnTo') || '/dashboard';
    const returnTo = `/organization?returnTo=${encodeURIComponent(returnToUrl)}`;

    const { user: auth0User, isLoading: isAuth0Loading } = useAuth0User();
    const { data: backendUser, isLoading: isBackendLoading, isFetching } = useUser();

    useEffect(() => {
        if (isAuth0Loading || isBackendLoading || isFetching) return;

        if (backendUser && !isBackendLoading) {
            if (backendUser?.accountStatus === 'UNVERIFIED' || backendUser?.emailVerified === false) return;
            router.replace(returnTo);
        }
    }, [backendUser, isBackendLoading, isFetching, isAuth0Loading, router, returnTo]);

    useEffect(() => {
        // Entrance animation
        const ctx = gsap.context(() => {
            gsap.fromTo(imageRef.current,
                { x: "-100%", opacity: 0 },
                { x: "0%", opacity: 1, duration: 1, ease: "power3.out" }
            );
            gsap.fromTo(formRef.current,
                { x: "100%", opacity: 0 },
                { x: "0%", opacity: 1, duration: 1, ease: "power3.out", delay: 0.2 }
            );
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const { mutate: login, isPending: isLoading, error } = useLogin();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login({ identifier: email, password }, {
            onSuccess: (data) => {
                if (data.user.accountStatus === 'UNVERIFIED') {
                    setShowVerifyModal(true);
                } else {
                    setIsRedirecting(true);
                    setTimeout(() => router.push(returnTo), 1000);
                }
            }
        });
    };

    const handleSignupNavigation = (e: React.MouseEvent) => {
        e.preventDefault();
        gsap.to(imageRef.current, { x: "100%", duration: 0.8, ease: "power3.inOut" });
        gsap.to(formRef.current, {
            x: "-100%", duration: 0.8, ease: "power3.inOut", onComplete: () => {
                router.push(returnToUrl !== '/dashboard' ? `/auth/register?returnTo=${encodeURIComponent(returnToUrl)}` : "/auth/register");
            }
        });
    };

    const showSocialLogin = isAuth0Configured();
    const errorMessage = error ? (error as any)?.response?.data?.message || (error as any)?.message || 'Login failed' : null;

    if (isAuth0Loading || isBackendLoading || isFetching || isRedirecting) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <Loader size={200} />
            </div>
        );
    }

    return (
        <div ref={containerRef} className="h-screen w-full flex bg-[#f8fafc] font-sans overflow-hidden">
            {/* Left Side - Visuals */}
            <div ref={imageRef} className="hidden lg:flex w-1/2 relative overflow-hidden">
                <Image
                    src="/login.jpg"
                    alt="Login Visual"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-blue-900/10 backdrop-blur-[1px]"></div>

                {/* Visual Accent */}
                <div className="absolute bottom-12 left-12 right-12 z-20 text-white">
                    <h2 className="text-4xl font-bold leading-tight">Empowering your <br /><span className="text-blue-400">Project Management</span></h2>
                    <p className="mt-4 text-lg text-gray-200">The next generation tool for high-performance teams.</p>
                </div>
            </div>

            {/* Right Side - Form Container */}
            <div ref={formRef} className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-10 relative z-10 bg-white shadow-2xl">
                <div className="w-full max-w-md space-y-8">


                    <div className="text-center lg:text-left space-y-2">
                        <div className="flex items-center gap-3 justify-center lg:justify-start mb-3">
                            <Image src="/logo/single-logo.png" alt="Logo" width={26} height={26} className="object-contain" />
                            <h1 className="text-2xl font-bold tracking-tight text-blue-600">
                                Welcome Back
                            </h1>
                        </div>
                        <p className="text-gray-500 text-base">
                            Sign in with your email, phone, or username
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                                    Email, Phone, or Username
                                </label>
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-none bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all duration-300 outline-none text-sm"
                                    placeholder="Your Name"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-none bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all duration-300 outline-none text-sm pr-12"
                                        placeholder="••••••••"
                                        required
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end">
                            <Link
                                href="/auth/forgot-password"
                                className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {errorMessage && (
                            <div className="p-4 rounded-none bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                                </svg>
                                {errorMessage}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full cursor-pointer !bg-blue-600 !hover:bg-blue-700 text-white font-bold py-3 rounded-none shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-1 transition-all duration-300 text-base"
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>

                        <>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-100"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-400 font-medium uppercase tracking-wider text-[10px]">Or continue with</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <SocialLoginButton provider="google" disabled={isLoading} />
                                <SocialLoginButton provider="github" disabled={isLoading} />
                            </div>
                        </>

                        <p className="text-center text-gray-500 text-base mt-8">
                            Don't have an account?{' '}
                            <button
                                onClick={handleSignupNavigation}
                                className="font-bold cursor-pointer text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                            >
                                Sign up now
                            </button>
                        </p>
                    </form>
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
