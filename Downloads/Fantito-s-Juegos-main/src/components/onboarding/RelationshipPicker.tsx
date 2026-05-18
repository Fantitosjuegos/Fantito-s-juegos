import { useState, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Player, RelationType, FamilyRole, RELATION_TYPES, FAMILY_ROLES, Language } from '@/lib/onboarding-types';
import { t } from '@/lib/translations';

interface RelationshipPickerProps {
  open: boolean;
  lang: Language;
  playerA: Player | null;
  playerB: Player | null;
  existingType?: RelationType | null;
  existingFamilyRole?: FamilyRole | null;
  onClose: () => void;
  onPick: (type: RelationType, familyRole?: FamilyRole) => void;
  onRemove?: () => void;
}

const RelationshipPicker = ({
  open, lang, playerA, playerB, existingType, existingFamilyRole, onClose, onPick, onRemove,
}: RelationshipPickerProps) => {
  const [familyMode, setFamilyMode] = useState(false);

  useEffect(() => {
    if (open) setFamilyMode(false);
  }, [open]);

  if (!open || !playerA || !playerB) return null;

  const handleType = (type: RelationType) => {
    if (type === 'family') {
      setFamilyMode(true);
      return;
    }
    navigator.vibrate?.(12);
    onPick(type);
  };

  const handleFamilyRole = (role: FamilyRole) => {
    navigator.vibrate?.(12);
    onPick('family', role);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0 bg-black/60 backdrop-blur-sm"
      style={{ animation: 'pkr-fade .18s ease-out' }}
      onClick={onClose}
    >
      <style>{`
        @keyframes pkr-fade { from{opacity:0} to{opacity:1} }
        @keyframes pkr-pop { from{opacity:0;transform:translateY(20px) scale(.92)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes pkr-tile-in { from{opacity:0;transform:scale(.6)} to{opacity:1;transform:scale(1)} }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[400px] rounded-3xl bg-card border border-white/[0.1] p-5 shadow-2xl"
        style={{ animation: 'pkr-pop .26s cubic-bezier(.2,1.2,.4,1)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header: A ✦ B */}
        <div className="flex items-center justify-center gap-3 mb-4 pt-1">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-background border border-white/[0.1] flex items-center justify-center text-2xl">
              {playerA.emoji}
            </div>
            <span className="text-[11px] mt-1 font-display font-semibold text-foreground/80 max-w-[80px] truncate">{playerA.name}</span>
          </div>
          <span className="text-xl text-muted-foreground animate-pulse">✦</span>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-background border border-white/[0.1] flex items-center justify-center text-2xl">
              {playerB.emoji}
            </div>
            <span className="text-[11px] mt-1 font-display font-semibold text-foreground/80 max-w-[80px] truncate">{playerB.name}</span>
          </div>
        </div>

        {!familyMode ? (
          <>
            <p className="text-center text-xs text-muted-foreground mb-3 font-display font-semibold uppercase tracking-wider">
              {t(lang, 'pickRelationship') || 'Pick the vibe'}
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {RELATION_TYPES.map((rt, i) => {
                const isExisting = existingType === rt.id;
                return (
                  <button
                    key={rt.id}
                    onClick={() => handleType(rt.id)}
                    className={`relative aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 active:scale-90 transition-transform ${
                      isExisting
                        ? 'border-primary/70 bg-primary/15 ring-2 ring-primary/40'
                        : 'border-white/[0.1] bg-background/60 hover:bg-background'
                    }`}
                    style={{ animation: `pkr-tile-in .25s ease-out ${i * 25}ms backwards` }}
                  >
                    <span className="text-3xl leading-none">{rt.emoji}</span>
                    <span className={`text-[10px] font-display font-bold ${rt.color}`}>{t(lang, rt.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3 px-1">
              <button
                onClick={() => setFamilyMode(false)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> back
              </button>
              <p className="text-xs font-display font-semibold uppercase tracking-wider text-foreground/80">
                {t(lang, 'pickFamilyRole') || 'Family ties?'}
              </p>
              <span className="w-10" />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {FAMILY_ROLES.map((fr, i) => {
                const isExisting = existingType === 'family' && existingFamilyRole === fr.id;
                return (
                  <button
                    key={fr.id}
                    onClick={() => handleFamilyRole(fr.id)}
                    className={`aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 active:scale-90 transition-transform ${
                      isExisting
                        ? 'border-green-400/70 bg-green-500/10 ring-2 ring-green-400/40'
                        : 'border-white/[0.1] bg-background/60 hover:bg-background'
                    }`}
                    style={{ animation: `pkr-tile-in .25s ease-out ${i * 25}ms backwards` }}
                  >
                    <span className="text-3xl leading-none">{fr.emoji}</span>
                    <span className="text-[10px] font-display font-bold text-green-300">
                      {t(lang, fr.labelKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-xs font-display font-semibold text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
          >
            {t(lang, 'cancel') || 'Cancel'}
          </button>
          {existingType && onRemove && (
            <button
              onClick={() => { navigator.vibrate?.(8); onRemove(); }}
              className="flex-1 py-2.5 rounded-xl border border-destructive/40 bg-destructive/10 text-xs font-display font-bold text-destructive hover:bg-destructive/20"
            >
              {t(lang, 'removeLink') || 'Remove'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelationshipPicker;