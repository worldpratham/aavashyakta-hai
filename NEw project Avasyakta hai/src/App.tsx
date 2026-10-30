import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { RouterProvider, useRouter, Link } from '@/router';
import { Header } from '@/components/Header';
import { LandingPage } from '@/pages/LandingPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { SignInPage } from '@/pages/SignInPage';
import { JobsPage } from '@/pages/JobsPage';
import { JobDetailPage } from '@/pages/JobDetailPage';
import { PostJobPage } from '@/pages/PostJobPage';
import { MyJobsPage } from '@/pages/MyJobsPage';
import { MyApplicationsPage } from '@/pages/MyApplicationsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AdminPage } from '@/pages/AdminPage';
import { TermsPage } from '@/pages/TermsPage';
import { isAdminUser } from '@/lib/api';
import { AiChatbot } from '@/components/AiChatbot';

function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-100">404</h1>
      <p className="mt-2 text-stone-500 dark:text-stone-400">Page not found.</p>
      <Link to="/" className="btn-primary mt-6">Go home</Link>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-400 dark:text-stone-500">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-stone-600 dark:text-stone-300">Please sign in to continue.</p>
        <Link to="/signin" className="btn-primary mt-4">Sign in</Link>
      </div>
    );
  }
  return <>{children}</>;
}

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-400 dark:text-stone-500">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }
  if (!profile || !isAdminUser(profile)) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center animate-fade-in">
        <p className="text-stone-600 dark:text-stone-300 font-medium">
          Access Denied: Only Manager / Owner (manager@gmail.com) can view this page.
        </p>
        <Link to="/signin" className="btn-primary mt-4 inline-flex">
          Sign in as Manager
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}

function Routes() {
  const { pathname } = useRouter();
  const currentPath = pathname.toLowerCase();

  const jobMatch = currentPath.match(/^\/jobs\/([^/]+)$/);

  if (currentPath === '/' || currentPath === '') return <LandingPage />;
  if (currentPath === '/jobs') return <JobsPage />;
  if (currentPath === '/signin') return <SignInPage />;
  if (currentPath === '/signup') return <SignUpPage />;
  if (currentPath === '/terms') return <TermsPage />;
  if (jobMatch) return <JobDetailPage jobId={jobMatch[1]} />;
  if (currentPath === '/post-job')
    return (
      <ProtectedRoute>
        <PostJobPage />
      </ProtectedRoute>
    );
  if (currentPath === '/my-jobs')
    return (
      <ProtectedRoute>
        <MyJobsPage />
      </ProtectedRoute>
    );
  if (currentPath === '/my-applications')
    return (
      <ProtectedRoute>
        <MyApplicationsPage />
      </ProtectedRoute>
    );
  if (currentPath === '/profile')
    return (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    );
  if (currentPath === '/admin')
    return (
      <AdminProtectedRoute>
        <AdminPage />
      </AdminProtectedRoute>
    );
  return <NotFound />;
}

function AppContent() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 transition-colors duration-300">
      <Header />
      <main className="flex-1">
        <Routes />
      </main>
      <footer className="border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 transition-colors duration-300">
        <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-stone-500 dark:text-stone-400">
          <div>
            Abasyakta (आवश्यकता है) — Connecting workers with work.
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link
              to="/terms"
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold hover:underline"
            >
              नियम, शर्तें एवं अस्वीकरण (Terms & Conditions)
            </Link>
          </div>
        </div>
      </footer>
      <AiChatbot />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <RouterProvider>
            <AppContent />
          </RouterProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
