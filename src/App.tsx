import React, { useState, useEffect } from 'react';
import { detectAppRole, AppRoleMode } from './services/appRouter';
import { AdminApp } from './components/admin/AdminApp';
import { TrainerApp } from './components/trainer/TrainerApp';
import { ClientApp } from './components/client/ClientApp';
import { DevSyncSimulator } from './components/sync/DevSyncSimulator';

export const App: React.FC = () => {
  const [role, setRole] = useState<AppRoleMode>(() => detectAppRole());

  useEffect(() => {
    const handleRouteUpdate = () => {
      setRole(detectAppRole());
    };

    window.addEventListener('hashchange', handleRouteUpdate);
    window.addEventListener('popstate', handleRouteUpdate);
    return () => {
      window.removeEventListener('hashchange', handleRouteUpdate);
      window.removeEventListener('popstate', handleRouteUpdate);
    };
  }, []);

  useEffect(() => {
    if (role === 'admin') {
      document.title = 'Jawan Admin | Director Console';
    } else if (role === 'trainer') {
      document.title = 'Jawan Trainer | Coach Portal';
    } else if (role === 'dev-sync') {
      document.title = 'Jawan Developer Simulator';
    } else {
      document.title = 'Jawan Fitness | Member Portal';
    }
  }, [role]);

  // 1. ADMIN PRODUCTION APPLICATION (e.g. jawanfitnessadmin.com or /admin)
  if (role === 'admin') {
    return <AdminApp />;
  }

  // 2. TRAINER PRODUCTION APPLICATION (e.g. jawanfitnesstrainer.com or /trainer)
  if (role === 'trainer') {
    return <TrainerApp />;
  }

  // 3. INTERNAL DEVELOPER TEST BENCH (/dev-sync or /#sync)
  if (role === 'dev-sync') {
    return <DevSyncSimulator />;
  }

  // 4. CLIENT USER PRODUCTION APPLICATION (Android APK, jawanfitness.com, app.jawanfitness.com, or /client)
  return <ClientApp />;
};

export default App;
