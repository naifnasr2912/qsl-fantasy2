"use client"; 

import { useState, useEffect } from "react"; 
import { t, getLang } from "@/lib/i18n"; 

  

export type Filters = { 

  q: string; 

  pos: "ALL" | "GK" | "DEF" | "MID" | "FWD"; 

  club: "ALL" | string; 

}; 

  

export default function FilterBar({  

  clubs, onChange, 


}: { 

  clubs: string[]; 

  onChange: (f: Filters) => void; 

}) { 
  const lang = getLang()

  const [q, setQ] = useState(""); 

  const [pos, setPos] = useState<Filters["pos"]>("ALL"); 

  const [club, setClub] = useState<Filters["club"]>("ALL"); 

  

  useEffect(() => onChange({ q, pos, club }), [q, pos, club]); // eslint-disable-line 

  

  return ( 

    <div className="rounded-2xl shadow p-3 bg-white grid gap-2"> 

      <input 

        value={q} 

        onChange={(e)=>setQ(e.target.value)} 

        placeholder={t("search",lang)} 

        className="h-11 rounded-xl border px-3" 

      /> 

      <div className="flex gap-2"> 

        {(["ALL","GK","DEF","MID","FWD"] as const).map(p => ( 

          <button key={p} 

            onClick={()=>setPos(p)} 

            className={`h-10 px-3 rounded-xl text-sm ${pos===p?"bg-black text-white":"bg-gray-100"}`}> 

            {p} 

          </button> 

        ))} 

        <select 

          className="h-10 px-3 rounded-xl bg-gray-100 text-sm ml-auto" 

          value={club} 

          onChange={(e)=>setClub(e.target.value as any)} 

        > 

          <option value="ALL">All clubs</option> 

          {clubs.map(c => <option key={c} value={c}>
            {c}
            </option>)} 

        </select> 

      </div> 

    </div> 

  ); 

} 