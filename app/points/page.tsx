"use client"; 
import { useEffect, useMemo, useState } from "react"; 
import { supabase } from "@/lib/supabaseClient"; 
import { scoreOne, PlayerRow } from "@/lib/scoring"; 
import {t , getLang } from "@/lib/i18n";
import { useRequireAuth } from "@/lib/useRequireAuth"; 
import { read } from "fs";

const GW = 1; 

type PickRow = { player_id: number; is_captain: boolean }; 

export default function PointsPage() { 
  const { ready, userId } = useRequireAuth("/points");  
  const lang = getLang(); 
  const [players, setPlayers] = useState<Record<number, PlayerRow>>({}); 
  const [picks, setPicks] = useState<PickRow[]>([]); 
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { 
    if (!ready || !userId) return;

    (async () => { 
      
      const { data: pickRows, error: pickErr } = await supabase 
        .from("picks") 
        .select("player_id,is_captain") 
        .eq("user_id", userId) 
        .eq("gameweek_id", GW);
      
      if (pickErr) { console.error(pickErr); setLoading(false); return; } 

      setPicks((pickRows ?? []) as PickRow[]); 

  

      const ids = (pickRows ?? []).map(r => r.player_id); 

      if (ids.length) { 

        const { data: pls, error: plErr } = await supabase 

          .from("players") 

          .select("id,name,club,position,underdog") 

          .in("id", ids); 

  

        if (plErr) { console.error(plErr); setLoading(false); return; } 

        const map: Record<number, PlayerRow> = {}; 

        (pls ?? []).forEach((p: any) => { map[p.id] = p; }); 

        setPlayers(map); 

      }
      
      setLoading(false); 

    })(); 

  }, [ready, userId]); 

  const total = useMemo(() => 

    picks.reduce((sum, pk) => { 

      const p = players[pk.player_id]; 

      return p ? sum + scoreOne(p, pk.is_captain) : sum; 

    }, 0), 

  [picks, players]);
  
  if (loading) return <div className="rounded-2xl shadow p-4 bg-white">{t("loading",lang)}</div>;
  if (!picks.length) return ( 

    <div className="rounded-2xl shadow p-4 bg-white"> 

      {t("noPicks",lang)}<a className="underline" href="/pick">Pick 11</a>. 

    </div>
  );

  if (!ready) return null;
  
  return ( 

    <div className="space-y-4"> 

      <div className="rounded-2xl shadow p-4 bg-white flex items-center justify-between"> 

        <div> 

          <div className="text-sm opacity-70">Gameweek {GW}</div> 

          <div className="text-2xl font-semibold">{total} pts</div> 

        </div> 

        <a href="/pick" className="h-12 px-4 rounded-2xl bg-black text-white font-medium flex items-center"> 

          {t("editPicks",lang)} 

        </a> 

      </div> 

      <div className="grid gap-3"> 

        {picks.map(pk => { 

          const p = players[pk.player_id]; 

          if (!p) return null; 

          const pts = scoreOne(p, pk.is_captain); 

          return ( 

            <div key={pk.player_id} className="rounded-2xl shadow p-4 bg-white flex items-center justify-between"> 

              <div> 

                <div className="font-medium"> 

                  {p.name} 

                  {pk.is_captain && <span className="ml-1 text-xs px-2 py-1 rounded-full bg-gray-100">C</span>} 

                </div> 

                <div className="text-xs opacity-70">{p.position} · {p.club} {p.underdog && "· +25% underdog"}</div> 

              </div> 

              <div className="text-lg font-semibold">{pts}</div> 

            </div> 

          ); 

        })} 

      </div> 

    </div> 

  ); 

} 