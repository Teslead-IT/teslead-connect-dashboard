"use client";

import React, { useState, useEffect } from "react";
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

type SignupMethod = 'email' | 'phone';
type PhoneStep = 'REQUEST' | 'VERIFY';

export default function RegisterPage() {
  const [signupMethod, setSignupMethod] = useState<SignupMethod>('email');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('REQUEST');

  // Form State
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [otp, setOtp] = useState("");

  const [mounted, setMounted] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  const { user: auth0User, isLoading: isAuth0Loading } = useAuth0User();
  const { data: backendUser, isLoading: isBackendLoading, isFetching } = useUser();

  // Hooks
  const { mutate: signupEmail, isPending: isEmailLoading, error: emailError } = useSignup();
  const { mutate: requestPhoneOtp, isPending: isPhoneRequestLoading, error: phoneRequestError } = usePhoneSignupRequest();
  const { mutate: verifyPhoneSignup, isPending: isPhoneVerifyLoading, error: phoneVerifyError } = usePhoneSignupVerify();

  const isLoading = isEmailLoading || isPhoneRequestLoading || isPhoneVerifyLoading;
  const error = emailError || phoneRequestError || phoneVerifyError;

  useEffect(() => {
    // Wait for all loading states to complete
    if (isAuth0Loading || isBackendLoading || isFetching) {
      return;
    }

    // Only redirect if valid backend session exists
    const isBackendLoggedIn = backendUser && !isBackendLoading;

    if (isBackendLoggedIn) {
      if (backendUser?.accountStatus === 'UNVERIFIED' || backendUser?.emailVerified === false) {
        return;
      }
      router.replace(returnTo);
    }
  }, [backendUser, isBackendLoading, isFetching, isAuth0Loading, router, returnTo]);

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

  const showSocialLogin = isAuth0Configured();
  const errorMessage = error ? (error as any)?.response?.data?.message || (error as any)?.message || 'Registration failed' : null;

  // Show loader while checking auth status to avoid flicker
  if (isAuth0Loading || isBackendLoading || isFetching) {
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

          {/* Back Button for OTP Step */}
          {signupMethod === 'phone' && phoneStep === 'VERIFY' && (
            <div className="flex w-full mb-2">
              <button
                type="button"
                onClick={() => setPhoneStep('REQUEST')}
                className="flex items-center gap-2 py-4 px-0 text-sm font-medium text-gray-500 hover:text-[#091590] transition-colors cursor-pointer z-10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform group-hover:-translate-x-1"
                >
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>
          )}

          <div className="text-center lg:text-left space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Create your account
            </h1>
            <p className="text-gray-500 text-base">
              Sign up with {signupMethod === 'email' ? 'email' : 'phone'} to get started
            </p>
          </div>

          {/* Toggle Method */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSignupMethod('email')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${signupMethod === 'email' ? 'bg-white text-[#091590] shadow-sm' : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                }`}
            >
              Email
            </button>
            <button
              type="button"
              // disabled={true}
              onClick={() => { setSignupMethod('phone'); setPhoneStep('REQUEST'); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${signupMethod === 'phone' ? 'bg-white text-[#091590] shadow-sm' : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                }`}
            >
              Phone
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="space-y-4">
              {/* Common Name Field (Except Phone Step 2) */}
              {(signupMethod === 'email' || (signupMethod === 'phone' && phoneStep === 'REQUEST')) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-[#091590] focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 outline-none text-base font-medium"
                    placeholder="Your Name"
                    autoComplete="name"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Email Input */}
              {signupMethod === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-[#091590] focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 outline-none text-base font-medium"
                    placeholder="john@example.com"
                    autoComplete="email"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Phone Input */}
              {signupMethod === 'phone' && phoneStep === 'REQUEST' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-[#091590] focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 outline-none text-base font-medium"
                    placeholder="+919876543210"
                    pattern="^\+[1-9]\d{1,14}$"
                    title="Phone number must be in E.164 format (e.g., +1234567890)"
                    autoComplete="tel"
                    required
                    disabled={isLoading}
                  />
                  {/* <p className="text-xs text-gray-500 mt-1 ml-1">Format: +[CountryCode][Number] (e.g., +919000000000)</p> */}
                </div>
              )}

              {/* OTP Input for Phone */}
              {signupMethod === 'phone' && phoneStep === 'VERIFY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                    Verification Code (OTP)
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-[#091590] focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 outline-none text-base font-medium"
                    placeholder="Enter 6-digit OTP"
                    required
                    disabled={isLoading}
                  />
                  <div className="mt-1 text-right">
                    {/* Resend OTP button could go here in future */}
                  </div>
                </div>
              )}

              {/* Password Input (Email OR Phone Step 2) */}
              {(signupMethod === 'email' || (signupMethod === 'phone' && phoneStep === 'VERIFY')) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-[#091590] focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 outline-none text-base font-medium"
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>

            <div className="flex items-start gap-3 mt-4">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors cursor-pointer"
                />
              </div>
              <label htmlFor="terms" className="text-sm text-gray-600 leading-tight pt-0.5">
                By signing up, you agree to our
                <Link href="/terms" className="font-semibold text-[#091590] hover:text-[#071170] hover:underline mx-1">Terms</Link>
                &
                <Link href="/privacy" className="font-semibold text-[#091590] hover:text-[#071170] hover:underline mx-1">Privacy Policy</Link>
              </label>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                </svg>
                {errorMessage}
              </div>
            )}

            <Button
              type="submit"
              className="w-full !bg-[#091590] cursor-pointer !hover:bg-[#071170] text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (signupMethod === 'email' ? "Sign Up" : phoneStep === 'REQUEST' ? "Get OTP" : "Verify & Sign Up")}
            </Button>
          </form>

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
            Already have an account?{' '}
            <Link
              href={returnTo !== '/dashboard' ? `/auth/login?returnTo=${encodeURIComponent(returnTo)}` : "/auth/login"}
              className="font-bold text-[#091590] hover:text-[#071170] hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Visuals */}
      <div className="hidden lg:flex w-1/2 bg-[#091590] relative overflow-hidden items-center justify-center p-8">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)`, backgroundSize: '100px 100px' }}></div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto text-white space-y-12">
          <div className="flex items-center justify-center p-4">
            <Image src="/logo/Teslead-Logo.png" alt="Logo" width={120} height={120} className="object-contain" />
          </div>

          <div className="space-y-4">
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
