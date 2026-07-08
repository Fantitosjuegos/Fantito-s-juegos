import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { storage } from '@/lib/storage';

interface DeleteAccountModalProps {
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteAccountModal({ onClose, onDeleted }: DeleteAccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = async () => {
    if (!confirmed) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.error) throw new Error(res.error.message);

      // Clear all local storage
      await storage.remove('fantito:anonGamesPlayed');
      await storage.remove('fantito_age_confirmed');
      await supabase.auth.signOut();
      onDeleted();
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

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
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{
          fontWeight: 700, fontSize: '20px',
          color: 'hsl(var(--foreground))', marginBottom: '12px',
        }}>
          Delete Account
        </h2>
        <p style={{
          fontSize: '14px', color: 'hsl(var(--muted-foreground))',
          lineHeight: 1.6, marginBottom: '20px',
        }}>
          This will permanently delete your account and all your data — game history, credits, and preferences. This cannot be undone.
        </p>

        <label style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '24px', cursor: 'pointer', textAlign: 'left',
        }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '13px', color: 'hsl(var(--foreground))' }}>
            I understand this is permanent and cannot be undone
          </span>
        </label>

        {error && (
          <p style={{
            fontSize: '13px', color: '#E24B4A',
            marginBottom: '16px', padding: '10px',
            background: '#FCEBEB', borderRadius: '8px',
          }}>
            {error}
          </p>
        )}

        <button
          onClick={handleDelete}
          disabled={!confirmed || loading}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px',
            background: confirmed ? '#A32D2D' : 'hsl(var(--muted))',
            color: 'white', fontWeight: 700, fontSize: '15px',
            border: