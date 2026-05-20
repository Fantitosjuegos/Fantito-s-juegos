/** Physics state for a single player bubble on the canvas */
export interface BubblePos {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    /** Timestamp used to trigger the bounce animation on placement */
    bounce: number;
  }