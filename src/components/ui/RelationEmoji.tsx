import bestfriends from '@/assets/emojis/bestfriends.svg';
import complicated from '@/assets/emojis/complicated.svg';
import coworkers from '@/assets/emojis/coworkers.svg';
import crush from '@/assets/emojis/crush.svg';
import enemies from '@/assets/emojis/enemies.svg';
import family from '@/assets/emojis/family.svg';
import flirty from '@/assets/emojis/Flirty.svg';
import lovers from '@/assets/emojis/lovers.svg';
import roommates from '@/assets/emojis/roommates.svg';

const RELATION_EMOJIS: Record<string, string> = {
  best_friends: bestfriends,
  bestfriends:  bestfriends,
  complicated:  complicated,
  coworkers:    coworkers,
  crush:        crush,
  enemies:      enemies,
  family:       family,
  siblings:     family,
  flirty:       flirty,
  flirty_overlay: flirty,
  lovers:       lovers,
  roommates:    roommates,
  new_friends:  coworkers,
  exes:         complicated,
};

interface RelationEmojiProps {
  relation: string;
  size?: number;
  className?: string;
}

export function RelationEmoji({ relation, size = 24, className = '' }: RelationEmojiProps) {
  const src = RELATION_EMOJIS[relation.toLowerCase()];
  if (!src) return <span className={className}>{relation}</span>;
  return (
    <img
      src={src}
      alt={relation}
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', objectFit: 'contain' }}
    />
  );
}