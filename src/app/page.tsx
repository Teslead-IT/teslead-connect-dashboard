import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to login page. 
  // The login page will handle redirecting to dashboard if user is already authenticated.
  redirect('/auth/login');
}
