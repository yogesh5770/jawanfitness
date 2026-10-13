import React, { useState, useEffect, Suspense, lazy } from 'react';
import { detectAppRole } from './services/appRouter';
import { ClientApp } from './components/client/ClientApp';
import { UnifiedAuthGateway } from './components/auth/UnifiedAuthGateway';
import { IOSInstallBanner } from './components/common/IOSInstallBanner';
import { authService, AuthUser } from './services/authService';
import { syncedStore } from './services/syncedStore';
import { nativePlatform } from './services/nativePlatformService';
import { Loader2 } from 'lucide-react';

const AdminApp = lazy(() => import('./components/admin/AdminApp').then((m) => ({ default: m.AdminApp })));
const TrainerApp = lazy(() => import('./components/trainer/TrainerApp').then((m) => ({ default: m.TrainerApp })));

const RoleLoadingFallback: React.FC<{ label: string }> = ({ label }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-[#06080e] flex flex-col items-center justify-center p-4">
    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 p-2 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 animate-pulse">
      <img src="/logo-3d-tight.png" alt="Jawan Fitness" className="w-full h-full object-contain" />
    </div>
    <Loader2 className="w-6 h-6 text-amber-500 animate-spin mb-2" />
    <span className="text-xs text-slate-500 font-tech">{label}</span>
  </div>
);

export const App: React.FC = () => {
  // Only restore authenticated user if token is actually present
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const token = authService.getToken();
    const user = authService.getUser();
    return token && user ? user : null;
  });
  
  const [activeRole, setActiveRole] = useState<'CLIENT' | 'TRAINER' | 'ADMIN' | null>(() => {
    const token = authService.getToken();
    const user = authService.getUser();
    if (token && user && user.role) return user.role;
    return null;
  });

  // Verify backend session on mount & initialize platform bridge
  useEffect(() => {
    nativePlatform.init();

    async function verifyAuth() {
      const token = authService.getToken();
      if (!token) {
        setCurrentUser(null);
        setActiveRole(null);
        return;
      }
      const isValid = await authService.verifySession();
      if (isValid) {
        const verified = authService.getUser();
        setCurrentUser(verified);
        if (verified && verified.role) {
          setActiveRole(verified.role);
        }
      } else {
        authService.logout();
        setCurrentUser(null);
        setActiveRole(null);
      }
    }
    verifyAuth();
  }, []);

  // Update document title dynamically
  useEffect(() => {
    if (activeRole === 'ADMIN') {
      document.title = 'Jawan Admin | Director Console';
    } else if (activeRole === 'TRAINER') {
      document.title = 'Jawan Trainer | Coach Portal';
    } else if (activeRole === 'CLIENT') {
      document.title = 'Jawan Fitness | Member Portal';
    } else {
      document.title = 'Jawan Fitness | Unified Portal';
    }
  }, [activeRole]);

  // Re-render when the hash changes (navigateToRole dispatches hashchange).
  // Only affects the unauthenticated gateway — authenticated role comes from the
  // verified session token, never from the URL.
  const [, setHashTick] = useState(0);
  useEffect(() => {
    const onHashChange = () => setHashTick((t) => t + 1);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleLoginSuccess = (user: AuthUser, role: 'CLIENT' | 'TRAINER' | 'ADMIN') => {
    setCurrentUser(user);
    setActiveRole(role);
    syncedStore.syncFromCloud(true);
  };

  const handleUniversalLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setActiveRole(null);
    localStorage.removeItem('jawan_auth_session_token_v1');
    localStorage.removeItem('jawan_auth_user_v1');
    localStorage.removeItem('jawan_active_client_id_v1');
    localStorage.removeItem('jawan_trainer_session_id_v1');
    window.location.hash = '';
  };

  // 1. IF NOT AUTHENTICATED: Present the Unified Jawan Fitness 3-way Gateway
  if (!currentUser || !activeRole) {
    const detected = detectAppRole();
    const defaultInitial = detected === 'admin' ? 'ADMIN' : detected === 'trainer' ? 'TRAINER' : 'CLIENT';
    return (
      <>
        <UnifiedAuthGateway
          onLoginSuccess={handleLoginSuccess}
          initialRole={defaultInitial}
        />
        <IOSInstallBanner />
      </>
    );
  }

  // 2. ADMIN INTERFACE
  if (activeRole === 'ADMIN') {
    return (
      <Suspense fallback={<RoleLoadingFallback label="Accessing Director Console..." />}>
        <AdminApp currentUser={currentUser} onLogout={handleUniversalLogout} />
      </Suspense>
    );
  }

  // 3. TRAINER INTERFACE
  if (activeRole === 'TRAINER') {
    return (
      <Suspense fallback={<RoleLoadingFallback label="Accessing Coach Terminal..." />}>
        <TrainerApp currentUser={currentUser} onLogout={handleUniversalLogout} />
      </Suspense>
    );
  }

  // 4. MEMBER INTERFACE (Default)
  return <ClientApp currentUser={currentUser} onLogout={handleUniversalLogout} />;
};

export default App;
