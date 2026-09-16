import React, { useState, useEffect } from 'react';
import { detectAppRole, AppRoleMode } from './services/appRouter';
import { AdminApp } from './components/admin/AdminApp';
import { TrainerApp } from './components/trainer/TrainerApp';
import { ClientApp } from './components/client/ClientApp';
import { DevSyncSimulator } from './components/sync/DevSyncSimulator';
import { UnifiedAuthGateway } from './components/auth/UnifiedAuthGateway';
import { IOSInstallBanner } from './components/common/IOSInstallBanner';
import { authService, AuthUser } from './services/authService';
import { syncedStore } from './services/syncedStore';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getUser());
  const [activeRole, setActiveRole] = useState<'CLIENT' | 'TRAINER' | 'ADMIN' | null>(() => {
    const user = authService.getUser();
    if (user && user.role) return user.role;
    // URL or domain override if explicitly visited
    const detected = detectAppRole();
    if (detected === 'admin') return 'ADMIN';
    if (detected === 'trainer') return 'TRAINER';
    return null;
  });

  // Verify backend session on mount
  useEffect(() => {
    async function verifyAuth() {
      await authService.verifySession();
      const verified = authService.getUser();
      setCurrentUser(verified);
      if (verified && verified.role) {
        setActiveRole(verified.role);
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

  const handleLoginSuccess = (user: AuthUser, role: 'CLIENT' | 'TRAINER' | 'ADMIN') => {
    setCurrentUser(user);
    setActiveRole(role);
    syncedStore.syncFromCloud(true);
  };

  const handleUniversalLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setActiveRole(null);
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
    return <AdminApp onLogout={handleUniversalLogout} />;
  }

  // 3. TRAINER INTERFACE
  if (activeRole === 'TRAINER') {
    return <TrainerApp onLogout={handleUniversalLogout} />;
  }

  // 4. MEMBER INTERFACE (Default)
  return <ClientApp onLogout={handleUniversalLogout} />;
};

export default App;
