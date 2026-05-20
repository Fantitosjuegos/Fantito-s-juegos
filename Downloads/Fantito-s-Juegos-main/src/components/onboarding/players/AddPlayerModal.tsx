/**
 * players/AddPlayerModal.tsx
 * --------------------------
 * The bottom-sheet modal for naming and picking an emoji for a new player.
 * Extracted from PlayersRelationsScreen — zero logic change.
 */
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

const AddPlayerModal = ({ name, emoji, lang, onNameChange, onEmojiChange, onConfirm, onDismiss }: Props) => (
  <div
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    onClick={onDismiss}
  >
    <div
      className="w-full max-w-sm bg-card border border-white/[0.08] rounded-3xl p-5 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
      style={{ animation: 'pr-bubble-in .25s ease-out' }}
    >
      <h3 className="font-display font-bold text-lg text-foreground mb-3 text-center">
        New player
      </h3>

      <input
        autoFocus
        value={name}
        onChange={(e) => onNameChange(e.target.value.slice(0, 20))}
        onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
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

export default AddPlayerModal;