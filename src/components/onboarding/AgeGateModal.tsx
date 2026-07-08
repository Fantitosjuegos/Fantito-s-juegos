import { storage } from '@/lib/storage';

const AGE_GATE_KEY = 'fantito_age_confirmed';

export async function hasConfirmedAge(): Promise<boolean> {
  try {
    const result = await storage.get(AGE_GATE_KEY);
    return result === 'true';
  } catch {
    return false;
  }
}

export async function confirmAge(): Promise<void> {
  await storage.set(AGE_GATE_KEY, 'true');
}

interface AgeGateModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function AgeGateModal({ onConfirm, onCancel }: AgeGateModalProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '20px',
        padding: '32px 24px',
        maxWidth: '340px',
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔞</div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '20px',
          color: 'hsl(var(--foreground))',
          marginBottom: '12px',
        }}>
          Adult Content
        </h2>
        <p style={{
          fontSize: '14px',
          color: 'hsl(var(--muted-foreground))',
          lineHeight: 1.6,
          marginBottom: '24px',
        }}>
          Nasty +18 mode contains sexual themes, explicit content, and adult humour. 
          By continuing you confirm you are <strong>18 years or older</strong>.
        </p>
        <button
          onClick={async () => { await confirmAge(); onConfirm(); }}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            background: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            fontWeight: 700,
            fontSize: '15px',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '10px',
          }}
        >
          I am 18 or older — Continue
        </button>
        <button
          onClick={onCancel}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            background: 'transparent',
            color: 'hsl(var(--muted-foreground))',
            fontWeight: 600,
            fontSize: '14px',
            border: '1px solid hsl(var(--border))',
            cursor: 'pointer',
          }}
        >
          Go back
        </button>
      </div>
    </div>
  );
}