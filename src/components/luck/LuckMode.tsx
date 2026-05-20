import { useState } from 'react';
import LuckHub, { LuckTool } from './LuckHub';
import DiceTool from './DiceTool';
import CoinTool from './CoinTool';
import WheelTool from './WheelTool';
import BottleTool from './BottleTool';
import PickerTool from './PickerTool';
import TournamentTool from './TournamentTool';

interface LuckModeProps {
  onExit: () => void;
}

const LuckMode = ({ onExit }: LuckModeProps) => {
  const [tool, setTool] = useState<LuckTool | null>(null);

  if (!tool) return <LuckHub onBack={onExit} onPick={setTool} />;

  const back = () => setTool(null);
  switch (tool) {
    case 'dice':       return <DiceTool       onBack={back} />;
    case 'coin':       return <CoinTool       onBack={back} />;
    case 'wheel':      return <WheelTool      onBack={back} />;
    case 'bottle':     return <BottleTool     onBack={back} />;
    case 'picker':     return <PickerTool     onBack={back} />;
    case 'tournament': return <TournamentTool onBack={back} />;
  }
};

export default LuckMode;
