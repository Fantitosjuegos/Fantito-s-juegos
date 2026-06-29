import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface PrivacyModalProps {
  open: boolean;
  onClose: () => void;
}

const PrivacyModal = ({ open, onClose }: PrivacyModalProps) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="max-w-[350px] rounded-3xl">
      <DialogHeader>
        <DialogTitle className="font-display text-xl">Privacy Policy</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 text-sm text-muted-foreground max-h-[60vh] overflow-y-auto pr-2">
        <p>At Fantito, we take your chaos seriously. We only collect the minimal data necessary to provide our services.</p>
        <p>We do not sell your personal data. We use Google Auth to securely manage your account and remember your game history.</p>
        <p>Your game data is stored securely and used exclusively to enhance your experience and generate new cards.</p>
      </div>
      <button 
        onClick={onClose}
        className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl"
      >
        Understood
      </button>
    </DialogContent>
  </Dialog>
);

export default PrivacyModal;