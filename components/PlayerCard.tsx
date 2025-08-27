"use client"; 

  

type PlayerVM = { 

  id: number; 

  name: string; 

  club: string; 

  position: "GK" | "DEF" | "MID" | "FWD"; 

  underdog: boolean; 

}; 

  

export default function PlayerCard({ 

  player, selected, captain, onToggle, onCaptain, 

}: { 

  player: PlayerVM; 

  selected: boolean; 

  captain: boolean; 

  onToggle: () => void; 

  onCaptain: () => void; 

}) { 

  return ( 

    <div className="rounded-2xl shadow p-4 bg-white flex items-center justify-between"> 

      <div> 

        <div className="font-medium">{player.name}</div> 

        <div className="text-xs opacity-70">{player.position} · {player.club}</div> 

        {player.underdog && <span className="text-xs px-2 py-1 rounded-full bg-gray-100 inline-block mt-2">+25% Underdog</span>} 

      </div> 

      <div className="flex items-center gap-2"> 

        <button onClick={onCaptain} className={`text-xs px-3 py-2 rounded-full ${captain ? "bg-black text-white" : "bg-gray-100"}`}>C</button> 

        <button onClick={onToggle} className={`h-10 w-24 rounded-2xl font-medium ${selected ? "bg-gray-200" : "bg-black text-white"}`}> 

          {selected ? "Selected" : "Add"} 

        </button> 

      </div> 

    </div> 

  ); 

} 