import { useEffect, useState } from 'react';
import { cloudDbService, CloudDbConfig } from '../services/cloudDatabaseService';

export function useSyncStatus(): CloudDbConfig {
  const [config, setConfig] = useState<CloudDbConfig>(() => cloudDbService.getConfig());
  useEffect(() => {
    const unsubscribe = cloudDbService.subscribe(setConfig);
    return () => {
      unsubscribe();
    };
  }, []);
  return config;
}
