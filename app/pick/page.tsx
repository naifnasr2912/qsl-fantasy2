"use client"; 
import { useEffect, useMemo, useState } from "react"; 
import { supabase } from "@/lib/supabaseClient"; 
import PlayerCard from "@/components/PlayerCard"; 
import FilterBar, { Filters } from "@/components/FilterBar"; 
import { t, getLang } from "@/lib/i18n";
import { useRouter } from "next/navigation"; 
import { useRequireAuth } from "@/lib/useRequireAuth"; 

type PlayerRow = { 

  id: number; 

  name: string; 

  club: string; 

  position: "GK" | "DEF" | "MID" | "FWD"; 

  underdog: boolean; 

}; 

type PickRow = { player_id: number; is_captain: boolean }; 

const GW = 1;

export default function PickPage() { 
  const { ready, userId } = useRequireAuth("/pick"); 
 

 
  const router = useRouter(); 

   

  const lang = getLang()

  const [players, setPlayers] = useState<PlayerRow[]>([]); 

  const [clubs, setClubs] = useState<string[]>([]); 

  const [loading, setLoading] = useState(true); 

  const [selected, setSelected] = useState<number[]>([]); 

  const [captain, setCaptain] = useState<number | null>(null); 

  

  const [saving, setSaving] = useState(false); 

  
  
  const [filters, setFilters] = useState<Filters>({ q: "", pos: "ALL", club: "ALL" }); 


  
  

  // load user + players (and existing picks, if any) 

  useEffect(() => { 
    if (!ready || !userId) return; // wait until auth is ready 

    (async () => { 
      // players 
      const { data: pls, error } = await supabase .from("players") .select("id,name,club,position,underdog") .order("club", { ascending: true }); 

if (error) {  
  console.error(error);  
  alert("Could not load players");  
  setLoading(false);  
  return;  
} 
 
setPlayers(pls as PlayerRow[]); 
setClubs(Array.from(new Set((pls ?? []).map(p => p.club))).sort()); 
 
// existing picks for this GW 
const { data: picks } = await supabase 
  .from("picks") 
  .select("player_id,is_captain") 
  .eq("user_id", userId)           // ← use hook value 
  .eq("gameweek_id", GW); 
 
if (picks && picks.length) { 
  setSelected(picks.map(p => p.player_id)); 
  const cap = picks.find(p => p.is_captain)?.player_id ?? null; 
  setCaptain(cap); 
} 
 
setLoading(false); 
  

})(); }, [ready, userId]); // ← depend on these 

  // filtering 

  const filtered = useMemo(() => { 

    const q = filters.q.trim().toLowerCase(); 

    return players.filter(p => { 

      if (filters.pos !== "ALL" && p.position !== filters.pos) return false; 

      if (filters.club !== "ALL" && p.club !== filters.club) return false; 

      if (q && !(`${p.name} ${p.club}`.toLowerCase().includes(q))) return false; 

      return true; 

    }); 

  }, [players, filters]);

  // helper for 3-per-club rule 

  const countByClub = useMemo(() => { 

    const m = new Map<string, number>(); 

    selected.forEach(id => { 

      const p = players.find(x => x.id === id); 

      if (p) m.set(p.club, (m.get(p.club) || 0) + 1); 

    }); 

    return m; 

  }, [selected, players]);

  function toggle(id: number) { 

    const exists = selected.includes(id); 

    if (exists) { 

      setSelected(prev => prev.filter(x => x !== id)); 

      if (captain === id) setCaptain(null); 

      return; 

    } 

    const p = players.find(x => x.id === id)!; 

    if (selected.length >= 11) return alert("11 players max"); 

    if ((countByClub.get(p.club) || 0) >= 3) return alert("Max 3 per club"); 

    setSelected(prev => [...prev, id]); 

  }
  
  async function confirm() { 

    if (!userId) return alert("Please login first"); 

    if (selected.length !== 11) return alert("Pick 11 players"); 

    if (!captain) return alert("Choose a captain");

    setSaving(true); 
    // wipe & insert 
    await supabase.from("picks").delete().eq("user_id", userId).eq("gameweek_id", GW); 
    const rows: PickRow[] = selected.map(pid => ({ player_id: pid, is_captain: pid === captain })); 
    const payload = rows.map(r => ({ user_id: userId, gameweek_id: GW, ...r })); 
    const { error } = await supabase.from("picks").insert(payload); 
    setSaving(false);
    
    if (error) { console.error(error); alert("Could not save picks"); } 
    else alert(t("Saved",lang)); 

  }

  if (!ready) return null; // or a spinner
  
  if (loading) return <div className="rounded-2xl shadow p-4 bg-white">{t("loading",lang)}</div>;

  
  
  return (
    <div className="space-y-4">
      {/* Header card */} 
      <div className="rounded-2xl shadow p-4 bg-white flex items-center justify-between"> 

        <div> 
          <div className="text-sm opacity-70">{t("selected",lang)}</div> 

          <div className="text-2xl font-semibold">{selected.length}/11</div> 

          <div className="text-xs opacity-70 mt-1"> 
            {captain  

    ? `${t("captain", lang)}: ${players.find((p) => p.id === captain)?.name}` 

    : t("noCaptain", lang)} 
          </div> 

        </div> 

        <button 

          className="h-12 px-4 rounded-2xl bg-black text-white font-medium disabled:opacity-60" 

          onClick={confirm} 

          disabled={saving} 

        >
          {saving ? t("saving",lang) : t("confirm",lang)}
        </button> 

      </div> 

      {/* Filters */} 

      <FilterBar clubs={clubs} onChange={setFilters} />    

      
      {/* Player list */} 

      <div className="grid grid-cols-1 gap-3">
        {filtered.map(p => ( 

          <PlayerCard 

            key={p.id} 

            player={p} 

            selected={selected.includes(p.id)} 

            captain={captain === p.id} 

            onToggle={() => toggle(p.id)} 

            onCaptain={() => setCaptain(p.id)} 

          /> 

        ))} 

      </div> 

    </div> 

  ); 

} 


 