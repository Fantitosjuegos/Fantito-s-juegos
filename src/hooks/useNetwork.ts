import { useEffect, useState } from 'react';
import { Network } from '@capacitor/network';

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Get initial status
    Network.getStatus().then(status => {
      setIsOnline(status.connected);
    });

    // Listen for changes
    const listener = Network.addListener('networkStatusChange', status => {
      setIsOnline(status.connected);
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  return { isOnline };
}