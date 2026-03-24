"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { useSignup, useUser, usePhoneSignupRequest, usePhoneSignupVerify } from "@/hooks/use-auth";
import { useUser as useAuth0User } from "@auth0/nextjs-auth0/client";
import { SocialLoginButton } from "@/components/auth/social-login-button";
import { EmailVerificationModal } from "@/components/auth/email-verification-modal";
import { isAuth0Configured } from "@/lib/config";
import { Loader } from "@/components/ui/Loader";
import { Eye, EyeOff } from "lucide-react";
import gsap from "gsap";

type SignupMethod = 'email' | 'phone';
type PhoneStep = 'REQUEST' | 'VERIFY';

function RegisterPageContent() {
  const [signupMethod, setSignupMethod] = useState<SignupMethod>('email');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('REQUEST');

  // Form State
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");

  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToUrl = searchParams.get('returnTo') || '/dashboard';
  const returnTo = returnToUrl;

  const { user: auth0User, isLoading: isAuth0Loading } = useAuth0User();
  const { data: backendUser, isLoading: isBackendLoading, isFetching } = useUser();

  // Hooks
  const { mutate: signupEmail, isPending: isEmailLoading, error: emailError } = useSignup();
  const { mutate: requestPhoneOtp, isPending: isPhoneRequestLoading, error: phoneRequestError } = usePhoneSignupRequest();
  const { mutate: verifyPhoneSignup, isPending: isPhoneVerifyLoading, error: phoneVerifyError } = usePhoneSignupVerify();

  const isLoading = isEmailLoading || isPhoneRequestLoading || isPhoneVerifyLoading;
  const error = emailError || phoneRequestError || phoneVerifyError;

  useEffect(() => {
    if (isAuth0Loading || isBackendLoading || isFetching) return;

    if (backendUser && !isBackendLoading) {
      if (backendUser?.accountStatus === 'UNVERIFIED' || backendUser?.emailVerified === false) return;
      router.replace(returnTo);
    }
  }, [backendUser, isBackendLoading, isFetching, isAuth0Loading, router, returnTo]);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const isTransition = sessionStorage.getItem('authTransition') === 'true';
    if (isTransition) {
      sessionStorage.removeItem('authTransition');
      return;
    }

    // Entrance animation
    const ctx = gsap.context(() => {
      gsap.fromTo(formRef.current,
        { x: "-100%", opacity: 0 },
        { x: "0%", opacity: 1, duration: 1, ease: "power3.out" }
      );
      gsap.fromTo(imageRef.current,
        { x: "100%", opacity: 0 },
        { x: "0%", opacity: 1, duration: 1, ease: "power3.out", delay: 0.2 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (signupMethod === 'email') {
      signupEmail({ email, password, name }, {
        onSuccess: () => setShowVerifyModal(true)
      });
    } else {
      if (phoneStep === 'REQUEST') {
        requestPhoneOtp({ phone, name }, {
          onSuccess: () => setPhoneStep('VERIFY')
        });
      } else {
        verifyPhoneSignup({ phone, otp, password }, {
          onSuccess: () => router.replace(returnTo)
        });
      }
    }
  };

  const handleSigninNavigation = (e: React.MouseEvent) => {
    e.preventDefault();
    gsap.to(formRef.current, { x: "100%", duration: 0.8, ease: "power3.inOut" });
    gsap.to(imageRef.current, {
      x: "-100%", duration: 0.8, ease: "power3.inOut", onComplete: () => {
        sessionStorage.setItem('authTransition', 'true');
        const targetUrl = returnTo !== '/dashboard' 
          ? `/auth/login?returnTo=${encodeURIComponent(returnTo)}` 
          : "/auth/login";
        router.push(targetUrl);
      }
    });
  };

  const showSocialLogin = isAuth0Configured();
  const errorMessage = error ? (error as any)?.response?.data?.message || (error as any)?.message || 'Registration failed' : null;

  if (isAuth0Loading || (isBackendLoading && !backendUser)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <Loader size={200} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-screen w-full flex bg-[#f8fafc] font-sans overflow-hidden">
      {/* Left Side - Form Container */}
      <div ref={formRef} className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-10 relative z-10 bg-white shadow-2xl">
        <div className="w-full max-w-sm space-y-5">


          {/* Back Button for OTP Step */}
          {signupMethod === 'phone' && phoneStep === 'VERIFY' && (
            <div className="flex w-full mb-2">
              <button
                type="button"
                onClick={() => setPhoneStep('REQUEST')}
                className="flex items-center gap-2 py-2 px-0 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                Back to details
              </button>
            </div>
          )}

          <div className="text-center lg:text-left space-y-2">
            <div className="flex items-center gap-3 justify-center lg:justify-start">
              <Image src="/logo/single-logo.png" alt="Logo" width={26} height={26} className="object-contain" />
              <h1 className="text-2xl font-bold tracking-tight text-blue-600">
                Create your account
              </h1>
            </div>
            <p className="text-gray-500 text-sm">
              Sign up with {signupMethod === 'email' ? 'email' : 'phone'} to get started
            </p>
          </div>

          {/* Toggle Method */}
          <div className="flex bg-gray-100 p-1 rounded-none">
            <button
              type="button"
              onClick={() => setSignupMethod('email')}
              className={`flex-1 py-2 text-sm font-bold rounded-none transition-all duration-300 ${signupMethod === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => { setSignupMethod('phone'); setPhoneStep('REQUEST'); }}
              className={`flex-1 py-2 text-sm font-bold rounded-none transition-all duration-300 ${signupMethod === 'phone' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                }`}
            >
              Phone
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              {/* Common Name Field (Except Phone Step 2) */}
              {(signupMethod === 'email' || (signupMethod === 'phone' && phoneStep === 'REQUEST')) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-none bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all duration-300 outline-none text-sm"
                    placeholder="Your Name"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Email Input */}
              {signupMethod === 'email' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-none bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all duration-300 outline-none text-sm"
                    placeholder="john@example.com"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Phone Input */}
              {signupMethod === 'phone' && phoneStep === 'REQUEST' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 rounded-none bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all duration-300 outline-none text-sm"
                    placeholder="+919876543210"
                    pattern="^\+[1-9]\d{1,14}$"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* OTP Input for Phone */}
              {signupMethod === 'phone' && phoneStep === 'VERIFY' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                    Verification Code (OTP)
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-2 rounded-none bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all duration-300 outline-none text-sm"
                    placeholder="Enter 6-digit OTP"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Password Input (Email OR Phone Step 2) */}
              {(signupMethod === 'email' || (signupMethod === 'phone' && phoneStep === 'VERIFY')) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-none bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all duration-300 outline-none text-sm pr-14"
                      placeholder="Create a strong password"
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
              )}
            </div>

            <div className="flex items-start gap-3 mt-4">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  disabled={isLoading}
                  className="w-5 h-5 rounded-none border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors cursor-pointer"
                />
              </div>
              <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed pt-0.5">
                By signing up, you agree to our
                <Link href="/terms" className="font-bold text-blue-600 hover:text-blue-800 hover:underline mx-1">Terms</Link>
                &
                <Link href="/privacy" className="font-bold text-blue-600 hover:text-blue-800 hover:underline mx-1">Privacy Policy</Link>
              </label>
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
              className="w-full !bg-blue-600 cursor-pointer !hover:bg-blue-700 text-white font-bold py-3 rounded-none shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-1 transition-all duration-300 text-base mt-2"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : (signupMethod === 'email' ? "Sign Up" : phoneStep === 'REQUEST' ? "Get OTP" : "Verify & Sign Up")}
            </Button>
          </form>

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
            Already have an account?{' '}
            <button
              onClick={handleSigninNavigation}
              className="font-bold cursor-pointer text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>

      {/* Right Side - Visuals */}
      <div ref={imageRef} className="hidden lg:flex w-1/2 relative overflow-hidden">
        <Image
          src="/login2.png"
          alt="Register Visual"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-blue-900/10 backdrop-blur-[1px]"></div>

        {/* Logo Overlay */}

        {/* Visual Accent */}
        <div className="absolute bottom-12 left-12 right-12 z-20 text-white text-right">
          <h2 className="text-4xl font-bold leading-tight">Join the future of <br /><span className="text-blue-400">Collaborative Work</span></h2>
          <p className="mt-4 text-lg text-gray-200">Start your journey with Teslead Connect today.</p>
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

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <Loader size={200} />
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}
