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

  // Verify backend session on mount
  useEffect(() => {
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
    return <AdminApp currentUser={currentUser} onLogout={handleUniversalLogout} />;
  }

  // 3. TRAINER INTERFACE
  if (activeRole === 'TRAINER') {
    return <TrainerApp currentUser={currentUser} onLogout={handleUniversalLogout} />;
  }

  // 4. MEMBER INTERFACE (Default)
  return <ClientApp currentUser={currentUser} onLogout={handleUniversalLogout} />;
};

export default App;
