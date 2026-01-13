'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser as useAuth0User } from '@auth0/nextjs-auth0/client';
import { useUser } from '@/hooks/use-auth';
import { Loader } from '@/components/ui/Loader';

export default function HomePage() {
  const router = useRouter();
  const { user: auth0User, isLoading: isAuth0Loading } = useAuth0User();
  const { data: backendUser, isLoading: isBackendLoading } = useUser();

  useEffect(() => {
    const isLoading = isAuth0Loading || isBackendLoading;
    if (isLoading) return;

    if (auth0User || backendUser) {
      router.replace('/dashboard');
    } else {
      router.replace('/auth/login');
    }
  }, [auth0User, backendUser, isAuth0Loading, isBackendLoading, router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-white">
      <Loader size={200} />
    </div>
  );
}
