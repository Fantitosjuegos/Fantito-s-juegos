/**
 * players/AddPlayerModal.tsx
 * --------------------------
 * The bottom-sheet modal for naming and picking an emoji for a new player.
 *
 * iOS keyboard fix: when the input focuses, we scroll it into view so the
 * keyboard never covers it. The modal also shifts up by listening to the
 * Capacitor Keyboard events so it sits above the keyboard on all devices.
 */
import { useRef, useEffect, useState } from 'react';
import type { Language } from '@/lib/onboarding-types';
import { PLAYER_EMOJIS } from '@/lib/onboarding-types';
import { t } from '@/lib/translations';

interface Props {
  name: string;
  emoji: string;
  lang: Language;
  onNameChange: (name: string) => void;
  onEmojiChange: (emoji: string) => void;
  onConfirm: () => void;
  onDismiss: () => void;
}

const AddPlayerModal = ({ name, emoji, lang, onNameChange, onEmojiChange, onConfirm, onDismiss }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Listen to Capacitor keyboard events to shift the modal up
  useEffect(() => {
    let showHandler: { remove: () => void } | null = null;
    let hideHandler: { remove: () => void } | null = null;

    const setupListeners = async () => {
      try {
        const { Keyboard } = await import('@capacitor/keyboard');
        showHandler = await Keyboard.addListener('keyboardWillShow', (info) => {
          setKeyboardHeight(info.keyboardHeight);
        });
        hideHandler = await Keyboard.addListener('keyboardWillHide', () => {
          setKeyboardHeight(0);
        });
      } catch {
        // Not in Capacitor — no-op on web
      }
    };

    setupListeners();
    return () => {
      showHandler?.remove();
      hideHandler?.remove();
    };
  }, []);

  // Focus the input after the modal animates in
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  const handleFocus = () => {
    // Small delay so keyboard height is known before scrolling
    setTimeout(() => {
      inputRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 150);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center bg-black/60 backdrop-blur-sm p-4"
      style={{
        alignItems: keyboardHeight > 0 ? 'flex-start' : 'flex-end',
        paddingBottom: keyboardHeight > 0 ? 0 : 16,
        paddingTop: keyboardHeight > 0 ? Math.max(60, window.innerHeight - keyboardHeight - 360) : 0,
        transition: 'padding 0.25s ease',
      }}
      onClick={onDismiss}
    >
      <div
        ref={modalRef}
        className="w-full max-w-sm bg-card border border-white/[0.08] rounded-3xl p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'pr-bubble-in .25s ease-out' }}
      >
        <h3 className="font-display font-bold text-lg text-foreground mb-3 text-center">
          New player
        </h3>

        <input
          ref={inputRef}
          value={name}
          onChange={(e) => onNameChange(e.target.value.slice(0, 20))}
          onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
          onFocus={handleFocus}
          placeholder={t(lang, 'playerName')}
          className="w-full bg-background border border-white/[0.08] rounded-xl px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30 transition-colors"
        />

        <p className="text-[11px] text-muted-foreground mt-3 mb-2">Pick an emoji</p>

        <div className="grid grid-cols-6 gap-2">
          {PLAYER_EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => onEmojiChange(em)}
              className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all active:scale-90 ${
                emoji === em
                  ? 'bg-primary/20 border-2 border-primary scale-110'
                  : 'bg-background border border-white/[0.08]'
              }`}
              aria-label={`Choose ${em}`}
            >
              {em}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm font-display font-semibold text-muted-foreground active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-display font-bold active:scale-[0.98] disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPlayerModal;