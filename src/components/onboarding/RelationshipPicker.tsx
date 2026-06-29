import { useState, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Player, RelationType, FamilyRole, RELATION_TYPES, FAMILY_ROLES, PLAYER_AVATAR_MAP, Language } from '@/lib/onboarding-types';
import { t } from '@/lib/translations';
import type { TranslationKey } from '@/lib/translations';

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
    if (type === 'family') { setFamilyMode(true); return; }
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
        <button onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-muted-foreground"
          aria-label="Close">
          <X className="w-4 h-4" />
        </button>

        {/* Header: A ✦ B — with SVG avatars */}
        <div className="flex items-center justify-center gap-3 mb-4 pt-1">
          {[playerA, playerB].map((p, idx) => (
            <div key={p.id} className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-background border border-white/[0.1] overflow-hidden flex items-center justify-center">
                {PLAYER_AVATAR_MAP[p.emoji]
                  ? <img src={PLAYER_AVATAR_MAP[p.emoji]} alt="" className="w-full h-full object-contain" />
                  : <span className="text-2xl">{p.emoji}</span>}
              </div>
              <span className="text-[11px] mt-1 font-display font-semibold text-foreground/80 max-w-[80px] truncate">{p.name}</span>
              {idx === 0 && <span className="sr-only">and</span>}
            </div>
          ))}
          <span className="text-xl text-muted-foreground animate-pulse absolute">✦</span>
        </div>

        {!familyMode ? (
          <>
            <p className="text-center text-xs text-muted-foreground mb-3 font-display font-semibold uppercase tracking-wider">
              {t(lang, 'pickRelationship') || 'Pick the vibe'}
            </p>
            {/* Relation type grid — transparent style like Fanta's vibe cards */}
            <div className="grid grid-cols-3 gap-2.5">
              {RELATION_TYPES.map((rt, i) => {
                const isExisting = existingType === rt.id;
                return (
                  <button key={rt.id} onClick={() => handleType(rt.id)} aria-pressed={isExisting}
                    className={`group relative flex flex-col items-center justify-start gap-1 p-1 bg-transparent border-0 transition-transform active:scale-90 ${isExisting ? 'scale-[1.06]' : 'opacity-95 hover:opacity-100'}`}
                    style={{ animation: `pkr-tile-in .25s ease-out ${i * 25}ms backwards` }}>
                    {rt.icon
                      ? <img src={rt.icon} alt=""
                          className={`w-full aspect-square object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.35)] ${isExisting ? 'drop-shadow-[0_0_14px_hsl(var(--primary)/0.55)]' : ''}`}
                          draggable={false} />
                      : <span className="text-5xl leading-none">{rt.emoji}</span>}
                    <span className={`text-[10.5px] text-center leading-tight font-display font-bold ${isExisting ? 'text-primary' : rt.color}`}>
                      {t(lang, rt.labelKey as TranslationKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3 px-1">
              <button onClick={() => setFamilyMode(false)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
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
                  <button key={fr.id} onClick={() => handleFamilyRole(fr.id)}
                    className={`group relative flex flex-col items-center justify-start gap-1 p-1 bg-transparent border-0 transition-transform active:scale-90 ${isExisting ? 'scale-[1.06]' : 'opacity-95 hover:opacity-100'}`}
                    style={{ animation: `pkr-tile-in .25s ease-out ${i * 25}ms backwards` }}>
                    {fr.icon
                      ? <img src={fr.icon} alt=""
                          className={`w-full aspect-square object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.35)] ${isExisting ? 'drop-shadow-[0_0_14px_hsl(var(--primary)/0.55)]' : ''}`}
                          draggable={false} />
                      : <span className="text-5xl leading-none">{fr.emoji}</span>}
                    <span className={`text-[10.5px] text-center leading-tight font-display font-bold ${isExisting ? 'text-primary' : 'text-green-300'}`}>
                      {t(lang, fr.labelKey as TranslationKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-4 flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-xs font-display font-semibold text-muted-foreground hover:text-foreground hover:bg-white/[0.04]">
            {t(lang, 'cancel') || 'Cancel'}
          </button>
          {existingType && onRemove && (
            <button onClick={() => { navigator.vibrate?.(8); onRemove(); }}
              className="flex-1 py-2.5 rounded-xl border border-destructive/40 bg-destructive/10 text-xs font-display font-bold text-destructive hover:bg-destructive/20">
              {t(lang, 'removeLink') || 'Remove'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelationshipPicker;