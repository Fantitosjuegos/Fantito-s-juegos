import { useMemo } from 'react';
import { Wand2 } from 'lucide-react';
import { OnboardingState, Language, VIBES, GAME_MODES, RELATION_TYPES } from '@/lib/onboarding-types';
import { cssVars } from '@/lib/css-utils';
import { isRTL } from '@/lib/translations';
import OnboardingLayout from './OnboardingLayout';
import MascotBubble from './MascotBubble';

interface SummaryScreenProps {
  step: number;
  lang: Language;
  state: OnboardingState;
  onBack: () => void;
  onStart: () => void;
}

const I18N: Record<Language, {
  ready: string; launch: string; tonight: string;
  mode: string; vibes: string; intensity: string; scene: string;
  consumption: string; players: string; host: string; driver: string;
  none: string; lvl: string;
}> = {
  en: { ready: 'All set. Tap to launch.', launch: 'Launch', tonight: "Tonight's setup", mode: 'Mode', vibes: 'Vibes', intensity: 'Intensity', scene: 'Scene', consumption: 'Consumption', players: 'Players', host: 'Host', driver: 'Driver', none: '—', lvl: 'lvl' },
  es: { ready: 'Todo listo. Toca para empezar.', launch: 'Empezar', tonight: 'Tu partida', mode: 'Modo', vibes: 'Vibras', intensity: 'Intensidad', scene: 'Escena', consumption: 'Consumo', players: 'Jugadores', host: 'Anfitrión', driver: 'Conductor', none: '—', lvl: 'nv' },
  fr: { ready: 'Tout est prêt. Touche pour lancer.', launch: 'Lancer', tonight: 'Ta partie', mode: 'Mode', vibes: 'Ambiance', intensity: 'Intensité', scene: 'Scène', consumption: 'Consommation', players: 'Joueurs', host: 'Hôte', driver: 'Conducteur', none: '—', lvl: 'niv' },
  de: { ready: 'Bereit. Tippe zum Starten.', launch: 'Start', tonight: 'Deine Runde', mode: 'Modus', vibes: 'Stimmung', intensity: 'Intensität', scene: 'Szene', consumption: 'Konsum', players: 'Spieler', host: 'Gastgeber', driver: 'Fahrer', none: '—', lvl: 'lv' },
  pt: { ready: 'Tudo pronto. Toca para começar.', launch: 'Começar', tonight: 'A tua partida', mode: 'Modo', vibes: 'Vibes', intensity: 'Intensidade', scene: 'Cena', consumption: 'Consumo', players: 'Jogadores', host: 'Anfitrião', driver: 'Condutor', none: '—', lvl: 'nv' },
  it: { ready: 'Tutto pronto. Tocca per iniziare.', launch: 'Avvia', tonight: 'La tua partita', mode: 'Modalità', vibes: 'Vibe', intensity: 'Intensità', scene: 'Scena', consumption: 'Consumo', players: 'Giocatori', host: 'Padrone di casa', driver: 'Autista', none: '—', lvl: 'liv' },
  ar: { ready: 'كل شيء جاهز. اضغط للبدء.', launch: 'ابدأ', tonight: 'إعداد الليلة', mode: 'الوضع', vibes: 'الأجواء', intensity: 'الشدة', scene: 'المشهد', consumption: 'الاستهلاك', players: 'اللاعبون', host: 'المضيف', driver: 'السائق', none: '—', lvl: 'مس' },
};

const SummaryScreen = ({ step, lang, state, onBack, onStart }: SummaryScreenProps) => {
  const rtl = isRTL(lang);
  const t = I18N[lang] ?? I18N.en;

  const playerLayout = useMemo(() => {
    const n = state.players.length;
    const cx = 50, cy = 50, r = n <= 4 ? 26 : 32;
    return state.players.map((p, i) => {
      const angle = (i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2;
      return { ...p, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
    });
  }, [state.players]);

  const idIndex = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    playerLayout.forEach(p => m.set(p.id, { x: p.x, y: p.y }));
    return m;
  }, [playerLayout]);

  const modeLabel = GAME_MODES.find(m => m.id === state.gameMode);
  const vibeChips = state.vibes
    .map(v => VIBES.find(vv => vv.id === v))
    .filter(Boolean)
    .map(v => `${v!.emoji} ${v!.labelKey}`)
    .join(' · ');
  const consumptionLabel = state.selectedConsumptions.length
    ? state.selectedConsumptions.join(' · ') + ` · ${t.lvl} ${state.consumptionLevel}/5`
    : t.none;
  const sceneLabel = state.contextState || t.none;
  const host = state.hostPlayerId ? state.players.find(p => p.id === state.hostPlayerId) : undefined;
  const driver = state.driverPlayerId ? state.players.find(p => p.id === state.driverPlayerId) : undefined;
  const detailsText = state.freeTextDetails?.trim();

  return (
    <OnboardingLayout step={step} onBack={onBack}>
      <div className="vs-atmosphere" style={cssVars({ '--vs-intensity': '0.6' })} />

      <div className={`relative flex-1 flex flex-col gap-4 pt-2 overflow-y-auto ${rtl ? 'direction-rtl' : ''}`}>
        <MascotBubble message={t.ready} size="sm" />

        {/* ===== Player ring graphic ===== */}
        {state.players.length > 0 && (
          <div className="vs-rise relative w-full aspect-[2/1] rounded-2xl border border-primary/25 bg-card overflow-hidden"
               style={{ boxShadow: '0 0 40px -16px hsl(var(--primary) / 0.5)' }}>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
              {state.relations.map((r, i) => {
                const pa = idIndex.get(r.player1Id);
                const pb = idIndex.get(r.player2Id);
                if (!pa || !pb) return null;
                const stroke =
                  r.type === 'lovers' || r.type === 'crush' || r.type === 'flirtyrel'
                    ? 'hsl(var(--primary))'
                    : r.type === 'beef' || r.type === 'enemies'
                    ? 'hsl(0 80% 60%)'
                    : 'hsl(var(--accent))';
                return (
                  <line
                    key={i}
                    x1={pa.x} y1={pa.y / 2}
                    x2={pb.x} y2={pb.y / 2}
                    stroke={stroke} strokeWidth={0.5} strokeDasharray="1.2 1" opacity={0.7}
                    style={{ filter: `drop-shadow(0 0 2px ${stroke})` }}
                  >
                    <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="3s" repeatCount="indefinite" />
                  </line>
                );
              })}
            </svg>

            {playerLayout.map((p, i) => (
              <div
                key={p.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 vs-float"
                style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${i * 0.18}s` }}
              >
                <div
                  className="w-11 h-11 rounded-full border bg-background/80 backdrop-blur flex items-center justify-center text-xl shadow-soft"
                  style={{
                    borderColor: 'hsl(var(--primary) / 0.5)',
                    boxShadow: '0 0 18px -2px hsl(var(--primary) / 0.6)',
                  }}
                >
                  {p.emoji}
                </div>
                <div className="mt-1 text-center text-[10px] font-display font-semibold text-foreground/90 max-w-[68px] truncate mx-auto">
                  {p.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== Choices grid ===== */}
        <div className="vs-rise" style={{ animationDelay: '60ms' }}>
          <h3 className="text-[11px] font-display font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            {t.tonight}
          </h3>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <Stat label={t.mode} value={modeLabel ? `${modeLabel.emoji} ${modeLabel.labelKey}` : state.gameMode} />
            <Stat label={t.intensity} value={`${state.consumptionLevel}/5`} />
            <Stat label={t.vibes} value={vibeChips || t.none} />
            <Stat label={t.scene} value={sceneLabel} />
            <Stat label={t.consumption} value={consumptionLabel} />
            <Stat label={t.players} value={String(state.players.length)} />
            {host && <Stat label={t.host} value={`${host.emoji} ${host.name}`} />}
            {driver && <Stat label={t.driver} value={`${driver.emoji} ${driver.name}`} />}
          </div>
          {detailsText && (
            <p className="mt-2 text-[11px] italic text-muted-foreground/90 px-1">"{detailsText}"</p>
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto pt-3 pb-1">
          <button
            onClick={onStart}
            className="relative w-full overflow-hidden rounded-xl py-4 font-display font-bold text-base text-primary-foreground transition-all active:scale-[0.98] vs-pulse-glow"
            style={{
              background: 'linear-gradient(120deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Wand2 className="w-4 h-4" />
              {t.launch}
            </span>
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-background/40 border border-white/[0.06]">
    <span className="text-[9.5px] font-display font-bold uppercase tracking-wider text-muted-foreground truncate">
      {label}
    </span>
    <span className="text-[11px] font-display font-bold text-foreground truncate">
      {value}
    </span>
  </div>
);

export default SummaryScreen;