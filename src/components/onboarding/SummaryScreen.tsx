import { useMemo } from 'react';
import { Wand2, Pencil, Heart } from 'lucide-react';
import { OnboardingState, Language, VIBES, GAME_MODES, CONSUMPTION_TYPES } from '@/lib/onboarding-types';
import type { TranslationKey } from '@/lib/translations';
import { isRTL, t as tr } from '@/lib/translations';
import OnboardingLayout from './OnboardingLayout';

interface SummaryScreenProps {
  step: number;
  lang: Language;
  state: OnboardingState;
  onBack: () => void;
  onStart: () => void;
  /** Jump back to a previous onboarding step to edit a section. */
  onJumpToStep: (step: number) => void;
}

const I18N: Record<Language, {
  ready: string; launch: string; tonight: string;
  mode: string; vibes: string; scene: string;
  consumption: string; details: string; players: string;
  none: string; lvl: string; tapToEdit: string; squad: string;
}> = {
  en: { ready: 'Press start when ready.', launch: 'Start the chaos', tonight: "Tonight's setup", mode: 'Mode', vibes: 'Vibes', scene: 'Scene', consumption: 'Consumption', details: 'Details', players: 'Players', none: '—', lvl: 'lvl', tapToEdit: 'Tap to edit', squad: 'Squad' },
  es: { ready: 'Pulsa start cuando estés listo.', launch: 'Empezar el caos', tonight: 'Tu partida', mode: 'Modo', vibes: 'Vibras', scene: 'Escena', consumption: 'Consumo', details: 'Detalles', players: 'Jugadores', none: '—', lvl: 'nv', tapToEdit: 'Toca para editar', squad: 'Equipo' },
  fr: { ready: 'Appuie sur start quand tu es prêt.', launch: 'Lancer le chaos', tonight: 'Ta partie', mode: 'Mode', vibes: 'Ambiance', scene: 'Scène', consumption: 'Consommation', details: 'Détails', players: 'Joueurs', none: '—', lvl: 'niv', tapToEdit: 'Touche pour modifier', squad: 'Équipe' },
  de: { ready: 'Drück Start, wenn du bereit bist.', launch: 'Chaos starten', tonight: 'Deine Runde', mode: 'Modus', vibes: 'Stimmung', scene: 'Szene', consumption: 'Konsum', details: 'Details', players: 'Spieler', none: '—', lvl: 'lv', tapToEdit: 'Tippen zum Bearbeiten', squad: 'Crew' },
  pt: { ready: 'Carrega start quando estiveres pronto.', launch: 'Começar o caos', tonight: 'A tua partida', mode: 'Modo', vibes: 'Vibes', scene: 'Cena', consumption: 'Consumo', details: 'Detalhes', players: 'Jogadores', none: '—', lvl: 'nv', tapToEdit: 'Toca para editar', squad: 'Equipa' },
  it: { ready: 'Premi start quando sei pronto.', launch: 'Avvia il caos', tonight: 'La tua partita', mode: 'Modalità', vibes: 'Vibe', scene: 'Scena', consumption: 'Consumo', details: 'Dettagli', players: 'Giocatori', none: '—', lvl: 'liv', tapToEdit: 'Tocca per modificare', squad: 'Squadra' },
  ar: { ready: 'اضغط ابدأ عندما تكون جاهزاً.', launch: 'أطلق الفوضى', tonight: 'إعداد الليلة', mode: 'الوضع', vibes: 'الأجواء', scene: 'المشهد', consumption: 'الاستهلاك', details: 'تفاصيل', players: 'اللاعبون', none: '—', lvl: 'مس', tapToEdit: 'اضغط للتعديل', squad: 'الفريق' },
};

const SCENE_LABELS: Record<string, { emoji: string; key: 'houseParty'|'atABar'|'roadTrip'|'pregame'|'chillNight'|'vacation'|'afterparty'|'coffeeShop' }> = {
  'house-party': { emoji: '🏠', key: 'houseParty' },
  'bar':         { emoji: '🍻', key: 'atABar' },
  'road-trip':   { emoji: '🚗', key: 'roadTrip' },
  'pregame':     { emoji: '🎉', key: 'pregame' },
  'chill-night': { emoji: '🛋️', key: 'chillNight' },
  'vacation':    { emoji: '🌴', key: 'vacation' },
  'afterparty':  { emoji: '🌙', key: 'afterparty' },
  'coffee-shop': { emoji: '☕', key: 'coffeeShop' },
};

const SummaryScreen = ({ step, lang, state, onBack, onStart, onJumpToStep }: SummaryScreenProps) => {
  const rtl = isRTL(lang);
  const t = I18N[lang] ?? I18N.en;

  const modeInfo = GAME_MODES.find(m => m.id === state.gameMode);
  const sceneInfo = state.contextState ? SCENE_LABELS[state.contextState] : undefined;
  const detailsText = state.freeTextDetails?.trim();

  // Pair relations per player to render small heart-badge under the avatar.
  const relationCountById = useMemo(() => {
    const m = new Map<string, number>();
    state.relations.forEach(r => {
      m.set(r.player1Id, (m.get(r.player1Id) ?? 0) + 1);
      m.set(r.player2Id, (m.get(r.player2Id) ?? 0) + 1);
    });
    return m;
  }, [state.relations]);

  return (
    <OnboardingLayout step={step} onBack={onBack}>
      <style>{`
        @keyframes sm-scan { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes sm-pulse-glow { 0%,100% { box-shadow: 0 0 0 0 hsl(var(--primary)/0.35); } 50% { box-shadow: 0 0 26px 4px hsl(var(--primary)/0.5); } }
        @keyframes sm-blink { 0%,60%,100% { opacity: 1 } 80% { opacity: .2 } }
        @keyframes sm-card-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sm-tilt { 0%,100% { transform: rotate(-1deg) } 50% { transform: rotate(1deg) } }
        .sm-card { animation: sm-card-in .4s ease-out both; }
        .sm-press { transition: transform .12s ease; }
        .sm-press:active { transform: scale(.97) }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className={`relative flex-1 flex flex-col gap-3 pt-1 overflow-y-auto ${rtl ? 'direction-rtl' : ''}`}>
        {/* ===== Arcade header ===== */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animation: 'sm-blink 1.4s ease-in-out infinite' }} />
            <span className="text-[10px] font-display font-black uppercase tracking-[0.22em] text-primary">
              {t.tonight}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">{t.ready}</p>
        </div>

        {/* ===== Squad frame — horizontal scroll roster ===== */}
        {state.players.length > 0 && (
          <button
            type="button"
            onClick={() => onJumpToStep(1)}
            aria-label={t.tapToEdit}
            className="sm-card sm-press relative w-full rounded-2xl border-2 border-primary/40 bg-gradient-to-b from-card to-background overflow-hidden text-left p-3"
            style={{ boxShadow: 'inset 0 0 30px hsl(var(--primary)/0.1), 0 12px 36px -22px hsl(var(--primary)/0.6)' }}
          >
            {/* CRT scanline */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-1/3 opacity-30"
              style={{
                background: 'linear-gradient(90deg, transparent, hsl(var(--primary)/0.18), transparent)',
                animation: 'sm-scan 3.6s linear infinite',
              }}
            />

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-display font-black uppercase tracking-[0.22em] text-primary/90">
                  {t.squad}
                </span>
                <span className="text-[10px] font-display font-bold text-muted-foreground">
                  · {state.players.length}/12
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[9px] font-display font-bold uppercase tracking-wider text-muted-foreground">
                <Pencil className="w-2.5 h-2.5" /> {t.tapToEdit}
              </span>
            </div>

            <div className="flex items-end gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
              {state.players.map((p, i) => {
                const rels = relationCountById.get(p.id) ?? 0;
                return (
                  <div key={p.id} className="flex flex-col items-center shrink-0 w-[60px]" style={{ animation: `sm-card-in .4s ease-out ${i * 60}ms both` }}>
                    <div
                      className="relative w-12 h-12 rounded-xl border border-primary/40 bg-background/80 backdrop-blur flex items-center justify-center text-2xl"
                      style={{ boxShadow: '0 0 14px -4px hsl(var(--primary)/0.55)' }}
                    >
                      {p.emoji}
                      {rels > 0 && (
                        <span className="absolute -bottom-1.5 -right-1.5 inline-flex items-center gap-0.5 text-[8.5px] font-display font-black bg-primary text-primary-foreground rounded-full px-1 py-px border border-background">
                          <Heart className="w-2 h-2 fill-current" />
                          {rels}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-center text-[10px] font-display font-bold text-foreground/90 max-w-[60px] truncate">
                      {p.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </button>
        )}

        {/* ===== Choice cards (tap to edit) — menu style ===== */}
        <div className="grid grid-cols-2 gap-2">
          <SummaryCard
            label={t.mode}
            emoji={modeInfo?.emoji ?? '🎉'}
            value={modeInfo ? tr(lang, modeInfo.labelKey) : state.gameMode}
            onClick={() => onJumpToStep(1)}
            delay={40}
          />
          <SummaryCard
            label={t.vibes}
            emoji="✨"
            value={
              state.vibes.length
                ? state.vibes
                    .map(v => VIBES.find(vv => vv.id === v))
                    .filter(Boolean)
                    .map(v => v!.emoji)
                    .join(' ')
                : t.none
            }
            onClick={() => onJumpToStep(2)}
            delay={80}
          />
          <SummaryCard
            label={t.scene}
            emoji={sceneInfo?.emoji ?? '🎬'}
            value={sceneInfo ? tr(lang, sceneInfo.key as TranslationKey) : t.none}
            onClick={() => onJumpToStep(2)}
            delay={120}
          />
          <SummaryCard
            label={t.consumption}
            emoji="🍻"
            value={
              state.selectedConsumptions.length
                ? `${state.selectedConsumptions
                    .map(c => CONSUMPTION_TYPES.find(x => x.id === c)?.emoji)
                    .join(' ')} · ${t.lvl} ${state.consumptionLevel}/5`
                : t.none
            }
            onClick={() => onJumpToStep(2)}
            delay={160}
          />
          <SummaryCard
            label={t.details}
            emoji="📝"
            value={detailsText ? (detailsText.length > 38 ? detailsText.slice(0, 36) + '…' : detailsText) : t.none}
            onClick={() => onJumpToStep(2)}
            delay={200}
            wide
          />
        </div>

        {/* CTA — arcade Start button */}
        <div className="mt-auto pt-2 pb-1">
          <button
            onClick={onStart}
            className="relative w-full overflow-hidden rounded-2xl py-4 font-display font-black text-base uppercase tracking-[0.18em] text-primary-foreground transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(120deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
              animation: 'sm-pulse-glow 2.4s ease-in-out infinite',
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Wand2 className="w-4 h-4" />
              ▶ {t.launch}
            </span>
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
};

const SummaryCard = ({
  label, emoji, value, onClick, delay = 0, wide = false,
}: {
  label: string; emoji: string; value: string; onClick: () => void; delay?: number; wide?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`sm-card sm-press group relative text-left rounded-xl border border-primary/20 bg-card hover:border-primary/50 transition-colors p-3 overflow-hidden ${wide ? 'col-span-2' : ''}`}
    style={{ animationDelay: `${delay}ms`, boxShadow: 'inset 0 0 12px hsl(var(--primary)/0.06)' }}
  >
    <span
      aria-hidden
      className="absolute top-0 right-0 w-1 h-full"
      style={{ background: 'linear-gradient(180deg, hsl(var(--primary)/0.5), transparent)' }}
    />
    <div className="flex items-start gap-2.5">
      <span className="text-2xl leading-none mt-0.5">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[9.5px] font-display font-black uppercase tracking-[0.18em] text-primary/80">
          {label}
        </div>
        <div className="text-[13px] font-display font-bold text-foreground truncate mt-0.5">
          {value}
        </div>
      </div>
      <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
    </div>
  </button>
);

export default SummaryScreen;