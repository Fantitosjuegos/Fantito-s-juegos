import { useEffect, useState } from 'react';
import { Network } from '@capacitor/network';

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let handle: { remove: () => void } | null = null;

    Network.getStatus().then(status => {
      setIsOnline(status.connected);
    });

    Network.addListener('networkStatusChange', status => {
      setIsOnline(status.connected);
    }).then(h => {
      handle = h;
    });

    return () => {
      handle?.remove();
    };
  }, []);

  return { isOnline };
}