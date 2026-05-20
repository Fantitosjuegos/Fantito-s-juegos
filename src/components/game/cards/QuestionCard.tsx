import { GameCard } from '@/lib/game-types';
import { Mood } from '@/lib/card-mood';

interface Props { card: GameCard; mood: Mood }

const TYPE_LABEL: Record<string, string> = {
  question: 'Question', dare: 'Dare', scenario: 'Scenario',
  charade: 'Charade', tenbut: 'Ten but…', international: 'World card',
  truthslie: 'Two truths', oddoneout: 'Odd one out', confession: 'Confession',
  flirty: 'Flirty', family: 'Family', minigame: 'Mini-game', hottake: 'Hot take',
  secret: 'Secret', guess: 'Guess', duo: 'Duo', elim: 'Elimination',
  reaction: 'React fast', team: 'Team', whowould: 'Who would', vote: 'Vote',
};

const QuestionCard = ({ card, mood }: Props) => {
  const label = TYPE_LABEL[card.type] ?? card.type.toUpperCase();
  return (
    <>
      <div className="px-5 pt-6 pb-2 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-display font-bold px-2.5 py-1 rounded-md border uppercase tracking-wide"
          style={{
            color: `hsl(${mood.primary})`,
            borderColor: `hsl(${mood.primary} / 0.4)`,
            background:  `hsl(${mood.primary} / 0.10)`,
          }}
        >
          {label}
        </span>
        {mood.tag && (
          <span className="text-[10px] font-display font-semibold uppercase tracking-widest text-muted-foreground">
            · {mood.tag}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground ml-auto font-display">#{card.card_id}</span>
      </div>

      {card.target_player && (
        <div className="px-5 pt-3 pb-1 text-center">
          <span
            className="text-2xl font-display font-black"
            style={{ color: `hsl(${mood.primary})`, textShadow: `0 0 18px hsl(${mood.primary} / 0.5)` }}
          >
            {card.target_player}
          </span>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-6 pb-7 pt-3">
        <p className="font-display text-[19px] font-bold text-foreground leading-snug text-center vs-rise">
          {card.question}
        </p>
      </div>
    </>
  );
};

export default QuestionCard;
