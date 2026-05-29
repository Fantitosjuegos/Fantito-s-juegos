import { useNetwork } from '@/hooks/useNetwork';

export function OfflineBanner() {
  const { isOnline } = useNetwork();

  if (isOnline) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: '#A32D2D',
      color: '#ffffff',
      textAlign: 'center',
      padding: '10px 16px',
      fontSize: '14px',
      fontWeight: 500,
      fontFamily: 'sans-serif',
    }}>
      📡 No internet connection — some features may not work
    </div>
  );
}