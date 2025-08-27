export type PlayerRow = { 

  id: number; 

  name: string; 

  club: string; 

  position: "GK" | "DEF" | "MID" | "FWD"; 

  underdog: boolean; 

}; 

  

// Simple placeholder scoring you can tweak later. 

export function scoreOne(p: PlayerRow, isCaptain: boolean) { 

  let pts = 2; // base appearance points 

  if (p.underdog) pts = Math.round(pts * 1.25); // +25% underdog bonus 

  if (isCaptain) pts *= 2; // captain x2 

  return pts; 

} 