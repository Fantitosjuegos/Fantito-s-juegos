import mascotAvatar from '@/assets/mascot-avatar.png';

interface MascotBubbleProps {
  message: string;
  size?: 'sm' | 'md';
}

// Mascot bubbles must never contain emojis — strip any pictographs that slipped in.
const stripEmoji = (s: string) =>
  s
    .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u200D\uFE0F]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

const MascotBubble = ({ message, size = 'md' }: MascotBubbleProps) => {
  const avatarSize = size === 'sm' ? 'w-10 h-10' : 'w-14 h-14';
  const clean = stripEmoji(message);

  return (
    <div className="flex items-start gap-3 animate-slide-up">
      <img
        src={mascotAvatar}
        alt="El Fantito"
        className={`${avatarSize} rounded-full bg-card border border-white/[0.08] flex-shrink-0 object-cover`}
        loading="lazy"
        width={512}
        height={512}
      />
      <div className="bg-card border border-white/[0.08] rounded-2xl rounded-tl-md px-4 py-3 max-w-[280px]">
        <p className="text-sm text-foreground/90 leading-relaxed">{clean}</p>
      </div>
    </div>
  );
};

export default MascotBubble;
