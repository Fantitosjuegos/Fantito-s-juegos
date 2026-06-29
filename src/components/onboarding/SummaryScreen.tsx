import { useMemo } from 'react';
import { Pencil, Heart } from 'lucide-react';
import { OnboardingState, Language, VIBES, GAME_MODES, CONSUMPTION_TYPES, PLAYER_AVATAR_MAP, SCENES } from '@/lib/onboarding-types';
import type { TranslationKey } from '@/lib/translations';
import { isRTL, t as tr } from '@/lib/translations';
import OnboardingLayout from './OnboardingLayout';

// Scene icons — real SVG imports (not Lovable CDN)
import bannerDetailsIcon from '@/assets/banner-icons/extra-details.svg';

interface SummaryScreenProps {
  step: number;
  lang: Language;
  state: OnboardingState;
  onBack: () => void;
  onStart: () => void;
  onJumpToStep: (step: number) => void;
}

const I18N: Record<Language, {
  mode: string; vibes: string; scene: string;
  consumption: string; details: string; players: string;
  none: string; lvl: string; tapToEdit: string; squad: string;
  title: string; subtitle: string;
}> = {
  en: { mode: 'Mode', vibes: 'Vibes', scene: 'Scene', consumption: 'Consumption', details: 'Details', players: 'Players', none: '—', lvl: 'lvl', tapToEdit: 'Tap to edit', squad: 'Squad', title: 'The final setup', subtitle: 'Tap any badge to edit.' },
  es: { mode: 'Modo', vibes: 'Vibras', scene: 'Escena', consumption: 'Consumo', details: 'Detalles', players: 'Jugadores', none: '—', lvl: 'nv', tapToEdit: 'Toca para editar', squad: 'Equipo', title: 'El setup final', subtitle: 'Toca cualquier insignia para editar.' },
  fr: { mode: 'Mode', vibes: 'Ambiance', scene: 'Scène', consumption: 'Consommation', details: 'Détails', players: 'Joueurs', none: '—', lvl: 'niv', tapToEdit: 'Touche pour modifier', squad: 'Équipe', title: 'Le setup final', subtitle: 'Touche un badge pour modifier.' },
  de: { mode: 'Modus', vibes: 'Stimmung', scene: 'Szene', consumption: 'Konsum', details: 'Details', players: 'Spieler', none: '—', lvl: 'lv', tapToEdit: 'Tippen zum Bearbeiten', squad: 'Crew', title: 'Das finale Setup', subtitle: 'Tippe ein Badge zum Bearbeiten.' },
  pt: { mode: 'Modo', vibes: 'Vibes', scene: 'Cena', consumption: 'Consumo', details: 'Detalhes', players: 'Jogadores', none: '—', lvl: 'nv', tapToEdit: 'Toca para editar', squad: 'Equipa', title: 'O setup final', subtitle: 'Toca num badge para editar.' },
  it: { mode: 'Modalità', vibes: 'Vibe', scene: 'Scena', consumption: 'Consumo', details: 'Dettagli', players: 'Giocatori', none: '—', lvl: 'liv', tapToEdit: 'Tocca per modificare', squad: 'Squadra', title: 'Il setup finale', subtitle: 'Tocca un badge per modificare.' },
  ar: { mode: 'الوضع', vibes: 'الأجواء', scene: 'المشهد', consumption: 'الاستهلاك', details: 'تفاصيل', players: 'اللاعبون', none: '—', lvl: 'مس', tapToEdit: 'اضغط للتعديل', squad: 'الفريق', title: 'الإعداد النهائي', subtitle: 'اضغط أي شارة للتعديل.' },
};

const SummaryScreen = ({ step, lang, state, onBack, onStart, onJumpToStep }: SummaryScreenProps) => {
  const rtl = isRTL(lang);
  const t = I18N[lang] ?? I18N.en;

  const modeInfo   = GAME_MODES.find(m => m.id === state.gameMode);
  const sceneInfo  = state.contextState ? SCENES.find(s => s.id === state.contextState) : undefined;
  const detailsText = state.freeTextDetails?.trim();

  const selectedVibes = state.vibes
    .map(v => VIBES.find(vv => vv.id === v))
    .filter(Boolean) as (typeof VIBES)[number][];

  const selectedConsumptionInfos = state.selectedConsumptions
    .map(c => CONSUMPTION_TYPES.find(x => x.id === c))
    .filter(Boolean) as (typeof CONSUMPTION_TYPES)[number][];

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
        @keyframes sm-yalla-pulse { 0%, 100% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0.45); } 50% { box-shadow: 0 0 0 14px hsl(var(--primary) / 0); } }
        @keyframes sm-card-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .sm-card { animation: sm-card-in .4s ease-out both; }
        .sm-press { transition: transform .12s ease; }
        .sm-press:active { transform: scale(.96) }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className={`relative flex-1 flex flex-col gap-4 pt-1 overflow-y-auto ${rtl ? 'direction-rtl' : ''}`}>

        {/* Title */}
        <div className="text-center">
          <h1 className="font-display font-black text-3xl leading-tight text-foreground">
            {t.title}
          </h1>
          <p className="text-[11.5px] text-muted-foreground mt-1.5">{t.subtitle}</p>
        </div>

        {/* Squad */}
        {state.players.length > 0 && (
          <Section label={`${t.squad} · ${state.players.length}/12`} onEdit={() => onJumpToStep(1)}>
            <div className="flex items-end gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
              {state.players.map((p, i) => {
                const rels = relationCountById.get(p.id) ?? 0;
                const avatar = PLAYER_AVATAR_MAP[p.emoji];
                return (
                  <div key={p.id} className="flex flex-col items-center shrink-0 w-[60px]"
                    style={{ animation: `sm-card-in .4s ease-out ${i * 50}ms both` }}>
                    <div className="relative w-14 h-14 rounded-2xl bg-card border border-primary/20 flex items-center justify-center overflow-hidden"
                      style={{ boxShadow: 'inset 0 0 10px hsl(var(--primary)/0.08)' }}>
                      {avatar
                        ? <img src={avatar} alt="" className="w-full h-full object-contain p-1" draggable={false} />
                        : <span className="text-2xl">{p.emoji}</span>}
                      {rels > 0 && (
                        <span className="absolute -bottom-1.5 -right-1.5 inline-flex items-center gap-0.5 text-[8.5px] font-display font-black bg-primary text-primary-foreground rounded-full px-1 py-px border border-background">
                          <Heart className="w-2 h-2 fill-current" />{rels}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 text-center text-[10px] font-display font-bold text-foreground/90 max-w-[60px] truncate">
                      {p.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Mode */}
        <Section label={t.mode} onEdit={() => onJumpToStep(1)}>
          <div className="flex flex-wrap gap-2">
            {modeInfo
              ? <Badge icon={modeInfo.icon} label={tr(lang, modeInfo.labelKey as TranslationKey)} onClick={() => onJumpToStep(1)} />
              : <EmptyChip />}
          </div>
        </Section>

        {/* Vibes */}
        <Section label={t.vibes} onEdit={() => onJumpToStep(1)}>
          <div className="flex flex-wrap gap-2">
            {selectedVibes.length > 0
              ? selectedVibes.map((v, i) => (
                  <Badge key={v.id} icon={v.icon} label={tr(lang, v.labelKey as TranslationKey)} onClick={() => onJumpToStep(1)} delay={i * 40} />
                ))
              : <EmptyChip />}
          </div>
        </Section>

        {/* Scene */}
        <Section label={t.scene} onEdit={() => onJumpToStep(1)}>
          <div className="flex flex-wrap gap-2">
            {sceneInfo
              ? <Badge icon={sceneInfo.icon} label={tr(lang, sceneInfo.labelKey as TranslationKey)} onClick={() => onJumpToStep(1)} />
              : <EmptyChip />}
          </div>
        </Section>

        {/* Consumption */}
        <Section label={t.consumption} onEdit={() => onJumpToStep(1)}>
          <div className="flex flex-wrap items-center gap-2">
            {selectedConsumptionInfos.length > 0 ? (
              <>
                {selectedConsumptionInfos.map((c, i) => (
                  <Badge key={c.id} icon={c.icon} label={tr(lang, c.labelKey as TranslationKey)} onClick={() => onJumpToStep(1)} delay={i * 40} />
                ))}
                <span className="text-[10px] font-display font-black uppercase tracking-[0.18em] text-primary bg-primary/10 border border-primary/30 rounded-full px-2.5 py-1">
                  {t.lvl} {state.consumptionLevel}/5
                </span>
              </>
            ) : <EmptyChip />}
          </div>
        </Section>

        {/* Details */}
        <Section label={t.details} onEdit={() => onJumpToStep(1)}>
          <button type="button" onClick={() => onJumpToStep(1)}
            className="sm-press sm-card w-full flex items-center gap-3 p-2.5 rounded-2xl border border-primary/20 bg-card text-left"
            style={{ boxShadow: 'inset 0 0 10px hsl(var(--primary)/0.06)' }}>
            <img src={bannerDetailsIcon} alt=""
              className="w-12 h-12 shrink-0 object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.25)]"
              draggable={false} />
            <span className={`flex-1 min-w-0 text-[12.5px] font-display font-semibold ${detailsText ? 'text-foreground' : 'text-muted-foreground'}`}>
              {detailsText
                ? (detailsText.length > 90 ? detailsText.slice(0, 88) + '…' : detailsText)
                : t.none}
            </span>
            <Pencil className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </button>
        </Section>

        {/* CTA */}
        <div className="mt-auto pt-3 pb-1">
          <button onClick={onStart}
            className="relative w-full bg-primary text-primary-foreground rounded-full py-6 font-display font-bold text-2xl active:scale-[0.98] transition-transform"
            style={{ animation: 'sm-yalla-pulse 2.6s ease-in-out infinite' }}>
            Yalla !
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
};

/* ── Subcomponents ── */

const Section = ({ label, onEdit, children }: {
  label: string; onEdit?: () => void; children: React.ReactNode;
}) => (
  <div className="sm-card">
    <div className="flex items-center justify-between mb-1.5 px-0.5">
      <span className="text-[10px] font-display font-black uppercase tracking-[0.22em] text-primary/90">
        {label}
      </span>
      {onEdit && (
        <button type="button" onClick={onEdit}
          className="inline-flex items-center gap-1 text-[9px] font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
          <Pencil className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
    {children}
  </div>
);

const Badge = ({ icon, label, onClick, delay = 0 }: {
  icon: string; label: string; onClick: () => void; delay?: number;
}) => (
  <button type="button" onClick={onClick}
    className="sm-card sm-press flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border border-primary/20 bg-card min-w-[68px]"
    style={{ animationDelay: `${delay}ms`, boxShadow: 'inset 0 0 10px hsl(var(--primary)/0.06)' }}>
    <img src={icon} alt=""
      className="w-12 h-12 object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.25)]"
      draggable={false} />
    <span className="text-[10px] font-display font-bold text-foreground leading-tight text-center max-w-[80px] truncate">
      {label}
    </span>
  </button>
);

const EmptyChip = () => (
  <span className="inline-flex items-center justify-center min-w-[68px] h-[78px] rounded-2xl border border-dashed border-muted-foreground/30 bg-transparent text-muted-foreground text-base font-display font-bold">
    —
  </span>
);

export default SummaryScreen;