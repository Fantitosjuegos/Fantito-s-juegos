import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface PrivacyModalProps {
  open: boolean;
  onClose: () => void;
}

const PrivacyModal = ({ open, onClose }: PrivacyModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-0 sm:pb-6"
      onClick={onClose}>
      <div className="w-full max-w-[430px] bg-card border border-white/[0.1] rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-white/[0.08] flex items-center justify-between px-5 py-4 rounded-t-3xl">
          <h2 className="font-display font-bold text-lg text-foreground">Privacy Policy</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p className="text-[11px] text-muted-foreground/60">Last updated: July 2026</p>

          <section>
            <h3 className="font-display font-bold text-foreground mb-1">Who we are</h3>
            <p>Fantito's Juegos is a party card game powered by AI. We are based in Spain and operate under EU and Spanish data protection law (GDPR / LOPDGDD).</p>
            <p className="mt-1">Contact: <span className="text-primary">privacy@fantitosjuegos.fun</span></p>
          </section>

          <section>
            <h3 className="font-display font-bold text-foreground mb-1">What data we collect</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong className="text-foreground">Email address</strong> — when you create an account</li>
              <li><strong className="text-foreground">Player names</strong> — names you type during the game</li>
              <li><strong className="text-foreground">Game session data</strong> — vibes, mode, and card feedback to improve recommendations</li>
              <li><strong className="text-foreground">Device data</strong> — anonymous usage data for performance</li>
            </ul>
          </section>

          <section>
            <h3 className="font-display font-bold text-foreground mb-1">Why we collect it</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>To provide and personalize the game experience</li>
              <li>To manage your account and credits</li>
              <li>To improve the AI card generation over time</li>
            </ul>
          </section>

          <section>
            <h3 className="font-display font-bold text-foreground mb-1">Third parties</h3>
            <p>We share data with the following trusted services:</p>
            <ul className="space-y-1 list-disc list-inside mt-1">
              <li><strong className="text-foreground">Supabase</strong> — database and authentication</li>
              <li><strong className="text-foreground">Google / Apple</strong> — optional sign-in only</li>
              <li><strong className="text-foreground">Google Gemini / OpenAI</strong> — AI card generation. Player names you enter are sent to these services to personalize your game cards.</li>
            </ul>
            <p className="mt-1">We do not sell your data. Ever.</p>
          </section>

          <section>
            <h3 className="font-display font-bold text-foreground mb-1">Your rights (GDPR)</h3>
            <p>You have the right to access, correct, export, or delete your data at any time.</p>
            <ul className="space-y-1 list-disc list-inside mt-1">
              <li><strong className="text-foreground">Delete account</strong> — available in your account settings inside the app</li>
              <li><strong className="text-foreground">Data requests</strong> — email us at privacy@fantitosjuegos.fun</li>
            </ul>
          </section>

          <section>
            <h3 className="font-display font-bold text-foreground mb-1">Data retention</h3>
            <p>We keep your data while your account is active. Inactive accounts are deleted after 2 years. You can delete your account at any time from the app.</p>
          </section>

          <section>
            <h3 className="font-display font-bold text-foreground mb-1">Age</h3>
            <p>This app is intended for users aged 14 and over (Spanish LOPDGDD). The Nasty +18 mode requires you to confirm you are 18 or older.</p>
          </section>

          <section>
            <h3 className="font-display font-bold text-foreground mb-1">Governing law</h3>
            <p>This policy is governed by Spanish law and EU GDPR. The supervisory authority is the AEPD (Agencia Española de Protección de Datos) at <span className="text-primary">aepd.es</span>.</p>
          </section>

          <p className="text-[11px] text-muted-foreground/60 pt-2 border-t border-white/[0.06]">
            For questions: privacy@fantitosjuegos.fun
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyModal;