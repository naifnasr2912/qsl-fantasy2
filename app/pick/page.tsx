"use client"; 

import React, { useEffect, useMemo, useState } from "react"; 
import { useRouter } from "next/navigation"; 
import { supabase } from "@/lib/supabaseClient"; 
import { useRequireAuth } from "@/lib/useRequireAuth"; 
import { t } from "@/lib/i18n"; 

/** 

* QSL Fantasy — Pick Page (Redesigned) 
* Implements: 
* - Toggle: "Create Fantasy Team" 
* - Formation: 1 GK, 3 DEF, 5 MID, 2 FWD 
* - Bench: 1 GK + 3 outfield 
* - Budget: 100m cap 
* - Captain & Vice (must be different) 
* - Boosters: Double Captain (2 uses), Wildcard (2 uses) 
*/ 

type Position = "GK" | "DEF" | "MID" | "FWD"; 

type Player = { 
  id: number | string; 
  name: string; 
  club?: string; 
  position: Position; 
  price: number; // in millions 
}; 

type BoosterState = { 
  doubleCaptainLeft: number; 
  wildcardLeft: number; 
}; 

// ---- Constants ---- 
const FORMATION: Record<Position, number> = { GK: 1, DEF: 3, MID: 5, FWD: 2 }; 
const BENCH_GK_REQUIRED = 1; 
const BENCH_OUTFIELD_REQUIRED = 3; 
const BUDGET_CAP = 100; 

const STORAGE_KEY = (uid: string) => `qsl_fantasy_builder_${uid}`; 
const BOOSTERS_KEY = (uid: string) => `qsl_fantasy_boosters_${uid}`; 

function initialBoosters(): BoosterState { 
  return { doubleCaptainLeft: 2, wildcardLeft: 2 }; 
} 

function fromAnyPrice(v: any): number { 
  if (typeof v === "number") return v; 
  if (typeof v === "string") return parseFloat(v) || 0; 
  return 0; 
} 

function normalizePlayerRow(row: any): Player | null { 
  if (!row) return null; 
  const pos = (row.position || "").toUpperCase(); 
  if (!["GK", "DEF", "MID", "FWD"].includes(pos)) return null; 
  const price = fromAnyPrice(row.price ?? row.cost ?? row.value); 
  return { id: row.id, name: row.name, club: row.club, position: pos as Position, price }; 
} 

function useLocalBoosters(userId?: string | null) { 
  const [boosters, setBoosters] = useState(initialBoosters()); 
  useEffect(() => { 
    if (!userId) return; 
    try { 
      const raw = localStorage.getItem(BOOSTERS_KEY(userId)); 
      if (raw) setBoosters(JSON.parse(raw)); 
    } catch {} 
  }, [userId]); 
  useEffect(() => { 
    if (userId) localStorage.setItem(BOOSTERS_KEY(userId), JSON.stringify(boosters)); 
  }, [boosters, userId]); 
  return { boosters, setBoosters }; 
} 

function useLocalSquad(userId?: string | null) { 
  const [data, setData] = useState<any | null>(null); 
  useEffect(() => { 
    if (!userId) return; 
    try { 
      const raw = localStorage.getItem(STORAGE_KEY(userId)); 
      if (raw) setData(JSON.parse(raw)); 
    } catch {} 
  }, [userId]); 
  useEffect(() => { 
    if (userId) localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(data ?? {})); 
  }, [data, userId]); 
  return { data, setData }; 
} 

// --- Supabase helpers for persistence --- 

  

async function getCurrentGW(): Promise<number> { 

  // Assumes a `gameweeks` table with `id` and `is_active` 

  const { data, error } = await supabase 

    .from("gameweeks") 

    .select("id") 

    .eq("is_active", true) 

    .order("id", { ascending: false }) 

    .limit(1) 

    .maybeSingle(); 

  

  if (error) { 

    console.warn("getCurrentGW error:", error.message); 

  } 

  return data?.id ?? 1; // fallback if your table is empty 

} 

  

type SquadShape = { 

  GK: Player[]; 

  DEF: Player[]; 

  MID: Player[]; 

  FWD: Player[]; 

  benchGK: Player[]; 

  benchOut: Player[]; 

  captainId?: Player["id"]; 

  viceId?: Player["id"]; 

  doubleCaptainOn?: boolean; 

}; 

  

function buildPicksPayload(opts: { 

  squad: SquadShape; 

  userId: string; 

  gameweekId: number; 

}) { 

  const { squad, userId, gameweekId } = opts; 

  

  const starters: Player[] = [ 

    ...squad.GK, 

    ...squad.DEF, 

    ...squad.MID, 

    ...squad.FWD, 

  ]; 

  

  const bench: Player[] = [...squad.benchGK, ...squad.benchOut]; 

  

  // order_index is useful if you want to keep XI order vs bench order 

  const starterRows = starters.map((p, i) => ({ 

    user_id: userId, 

    gameweek_id: gameweekId, 

    player_id: p.id, 

    is_bench: false, 

    order_index: i, 

    is_captain: p.id === squad.captainId, 

    is_vice: p.id === squad.viceId, 

  })); 

  

  const benchRows = bench.map((p, i) => ({ 

    user_id: userId, 

    gameweek_id: gameweekId, 

    player_id: p.id, 

    is_bench: true, 

    order_index: i, 

    is_captain: p.id === squad.captainId, 

    is_vice: p.id === squad.viceId, 

  })); 

  

  return [...starterRows, ...benchRows]; 

} 

  

async function persistSquadToSupabase(squad: SquadShape) { 

  // 1) Who is the user? 

  const { data: authData, error: authErr } = await supabase.auth.getUser(); 

  if (authErr || !authData?.user) throw new Error("Not signed in"); 

  const uid = authData.user.id; 

  

  // 2) Which GW to write to? 

  const gw = await getCurrentGW(); 
  if (!gw) throw new Error("No active Gameweek found. Seed one in the DB.");

  

  // 3) Build payload 

  const rows = buildPicksPayload({ squad, userId: uid, gameweekId: gw }); 

  

  // 4) Clear existing + insert 

  const del = await supabase 

    .from("picks") 

    .delete() 

    .eq("user_id", uid) 

    .eq("gameweek_id", gw); 

  if (del.error) throw del.error; 

  

  const ins = await supabase.from("picks").insert(rows); 

  if (ins.error) throw ins.error; 

  

  return { gameweekId: gw, total: rows.length }; 

} 

 


type DBPickRow = { 
  player_id: number | string; 
  is_bench: boolean; 
  is_captain: boolean; 
  is_vice: boolean; 
  order_index: number; 
}; 

function rebuildSquadFromDB(picks: DBPickRow[], players: Player[]) { 
  const byId = new Map(players.map(p => [String(p.id), p])); 
  const starters: Player[] = []; 
  const bench: Player[] = []; 
  let captainId: Player["id"] | undefined; 
  let viceId: Player["id"] | undefined; 

  // Keep the original ordering 
  const sorted = [...picks].sort((a, b) => 
    (a.is_bench === b.is_bench) 
    ? (a.order_index - b.order_index) 
    : (a.is_bench ? 1 : -1) 
  ); 

  for (const r of sorted) { 
    const p = byId.get(String(r.player_id)); 
    if (!p) continue; 
    (r.is_bench ? bench : starters).push(p); 
    if (r.is_captain) captainId = p.id; 
    if (r.is_vice) viceId = p.id; 
  } 

  // Respect formation limits 
  const GK = starters.filter(p => p.position === "GK").slice(0, 1); 
  const DEF = starters.filter(p => p.position === "DEF").slice(0, 3); 
  const MID = starters.filter(p => p.position === "MID").slice(0, 5); 
  const FWD = starters.filter(p => p.position === "FWD").slice(0, 2); 

  const benchGK = bench.filter(p => p.position === "GK").slice(0, 1); 
  const benchOut = bench.filter(p => p.position !== "GK").slice(0, 3); 

  return { GK, DEF, MID, FWD, benchGK, benchOut, captainId, viceId }; } 

 

export default function PickPage() { 
  const router = useRouter(); 
  const { ready, userId } = useRequireAuth("/pick"); 

  const [open, setOpen] = useState(false); 
  const [players, setPlayers] = useState<Player[]>([]); 
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState<string | null>(null); 

  const [squad, setSquad] = useState({ 
    GK: [], DEF: [], MID: [], FWD: [], 
    benchGK: [], benchOut: [], 
    captainId: undefined, viceId: undefined, doubleCaptainOn: false, 
  }); 

  const { boosters, setBoosters } = useLocalBoosters(userId); 
  const { data: persistedSquad, setData: setPersistedSquad } = useLocalSquad(userId); 

  // Load players 
  useEffect(() => { 
    if (!ready) return; 
    (async () => { 
      setLoading(true); 
      try { 
        const { data, error } = await supabase.from("players").select("*"); 
        if (error) throw error; 
        const normalized = (data ?? []).map(normalizePlayerRow).filter(Boolean) as Player[]; 
        setPlayers(normalized); 
      } catch (e: any) { 
        setError(e?.message || "Failed to load players"); 
      } finally { 
        setLoading(false); 
      } 
    })(); 
  }, [ready]); 

  // Hydrate UI from Supabase picks for the active GW once players are ready 
  useEffect(() => { 
    if (!ready || players.length === 0) return; 

    (async () => { 
      // who am i ? 
      const { data: auth } = await supabase.auth.getUser(); 
      const uid = auth?.user?.id; 
      if (!uid) return; 

      // current GW ?
      const gw = await getCurrentGW(); 
      if (!gw) return; 
      
      // Fetch saved picks
      const { data, error } = await supabase 
        .from("picks") 
        .select("player_id,is_bench,is_captain,is_vice,order_index") 
        .eq("user_id", uid) 
        .eq("gameweek_id", gw) 
        .order("is_bench", { ascending: true }) 
        .order("order_index", { ascending: true }); 
 
      if (error) { 
        console.warn("Load picks error:", error.message); 
        return; 
      } 
 
      if (data && data.length > 0) { 
        const next = rebuildSquadFromDB(data as DBPickRow[], players); 
        setSquad((s: any) => ({ ...s, ...next })); 
      } 
  })(); 
}, [ready, players]); 

 

  // Hydrate from localStorage 
  useEffect(() => { 
    if (!userId || !persistedSquad) return; 
    setSquad((s: any) => ({ ...s, ...persistedSquad })); 
  }, [userId, persistedSquad]); 

  const allSelected: Player[] = useMemo(() => 
    [...squad.GK, ...squad.DEF, ...squad.MID, ...squad.FWD, ...squad.benchGK, ...squad.benchOut], 
    [squad] 
  ); 

  const budgetUsed = allSelected.reduce((sum, p) => sum + (p?.price ?? 0), 0); 
  const budgetLeft = Math.max(0, BUDGET_CAP - budgetUsed); 

  const canSubmit = (() => { 
    const reqOk = 
      squad.GK.length === FORMATION.GK && 
      squad.DEF.length === FORMATION.DEF && 
      squad.MID.length === FORMATION.MID && 
      squad.FWD.length === FORMATION.FWD && 
      squad.benchGK.length === BENCH_GK_REQUIRED && 
      squad.benchOut.length === BENCH_OUTFIELD_REQUIRED; 
    const capOk = squad.captainId && squad.viceId && squad.captainId !== squad.viceId; 
    const budgetOk = budgetUsed <= BUDGET_CAP; 
    const uniqueOk = new Set(allSelected.map(p => p.id)).size === allSelected.length; 
    return reqOk && capOk && budgetOk && uniqueOk; 
  })(); 

  // Actions 
  function addPlayer(p: Player) { 
    if (allSelected.some(s => s.id === p.id)) return; 
    if (p.position === "GK") { 
      if (squad.GK.length < 1) return setSquad((s: any) => ({ ...s, GK: [...s.GK, p] })); 
      if (squad.benchGK.length < 1) return setSquad((s: any) => ({ ...s, benchGK: [...s.benchGK, p] })); 
      return; 
    } 
    const targetKey: "DEF" | "MID" | "FWD" = p.position; 
    if (squad[targetKey].length < FORMATION[targetKey]) { 
      return setSquad((s: any) => ({ ...s, [targetKey]: [...s[targetKey], p] })); 
    } 
    if (squad.benchOut.length < 3) { 
      return setSquad((s: any) => ({ ...s, benchOut: [...s.benchOut, p] })); 
    } 
  } 

  function removePlayer(p: Player) { 
    const remove = (arr: Player[]) => arr.filter(x => x.id !== p.id); 
    setSquad((s: any) => ({ 
      ...s, 
      GK: remove(s.GK), DEF: remove(s.DEF), MID: remove(s.MID), FWD: remove(s.FWD), 
      benchGK: remove(s.benchGK), benchOut: remove(s.benchOut), 
      captainId: s.captainId === p.id ? undefined : s.captainId,
      viceId: s.viceId === p.id ? undefined : s.viceId, 
    })); 
  } 

  function setCaptain(p: Player) { 
    setSquad((s: any) => ({ ...s, captainId: p.id, viceId: s.viceId === p.id ? undefined : s.viceId })); 
  } 

  function setVice(p: Player) { 
    setSquad((s: any) => ({ ...s, viceId: p.id, captainId: s.captainId === p.id ? undefined : s.captainId })); 
  } 

  function useDoubleCaptain() { 
    if (!squad.captainId) return alert("Choose a captain first."); 
    if (boosters.doubleCaptainLeft <= 0) return alert("No Double Captain left."); 
    setBoosters((b: any) => ({ ...b, doubleCaptainLeft: b.doubleCaptainLeft - 1 })); 
    setSquad((s: any) => ({ ...s, doubleCaptainOn: true })); 
  } 

  function useWildcard() { 
    if (boosters.wildcardLeft <= 0) return alert("No Wildcards left."); 
    setBoosters((b: any) => ({ ...b, wildcardLeft: b.wildcardLeft - 1 })); 
    alert("Wildcard activated for this session."); 
  } 

  async function handleSubmit() { 

  if (!canSubmit) return; 

  

  try { 

    // keep your local save so the UI is snappy 

    setPersistedSquad(squad); 

  

    // write to Supabase 

    const res = await persistSquadToSupabase(squad); 

  

    alert(`Squad submitted for GW ${res.gameweekId}. (${res.total} rows written)`); 

    // router.push("/points"); // optional redirect 

  } catch (e: any) { 

    console.error("Submit failed:", e, JSON.stringify(e, null, 2));
    const msg = 
      e?.message || 
      e?.hint ||
      e?.details ||
      (typeof e === "object" ? JSON.stringify(e) : String(e));
  
    alert(`Failed to submit squad: ${msg}`); 

  } 

} 

  return (

  <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6"> 
  {/* Toggle */} 
  <div className="flex items-center justify-between"> 
    <h1 className="text-2xl md:text-3xl font-semibold">Pick Team</h1> 
    <button onClick={() => setOpen(o => !o)} className="px-4 py-2 rounded-2xl border shadow"> 
      {open ? "Close" : "Create Fantasy Team"} 
    </button> 
  </div> 
  {!open ? ( 
    <div className="rounded-2xl border p-6 text-center"> 
      Click “Create Fantasy Team” to start building. 
    </div> 
  ) : ( 
    <div className="grid md:grid-cols-5 gap-6"> 
      {/* Squad */} 
      <div className="md:col-span-3 space-y-6"> 
        <BudgetBar used={budgetUsed} left={budgetLeft} cap={BUDGET_CAP} /> 
        <SquadSection title="Starting XI" slots={[ 
          { key: "GK", label: "Goalkeeper", count: 1 }, 
          { key: "DEF", label: "Defenders", count: 3 }, 
          { key: "MID", label: "Midfielders", count: 5 }, 
          { key: "FWD", label: "Forwards", count: 2 }, 
        ]} squad={squad} onRemove={removePlayer} onCaptain={setCaptain} onVice={setVice} /> 
        <SquadSection title="Bench" slots={[ 
          { key: "benchGK", label: "Bench GK", count: 1 }, 
          { key: "benchOut", label: "Bench Outfield", count: 3 }, 
        ]} squad={squad} onRemove={removePlayer} onCaptain={setCaptain} onVice={setVice} /> 
 
        {/* Boosters */} 
        <div className="rounded-2xl border p-4"> 
          <h3 className="font-semibold mb-2">Boosters</h3> 
          <button onClick={useDoubleCaptain} className="px-3 py-1 mr-2 rounded border">Double Captain ({boosters.doubleCaptainLeft})</button> 
          <button onClick={useWildcard} className="px-3 py-1 rounded border">Wildcard ({boosters.wildcardLeft})</button> 
        </div> 
 
        <button disabled={!canSubmit} onClick={handleSubmit} 
          className={`px-4 py-2 rounded-2xl ${canSubmit ? "bg-black text-white" : "bg-gray-300 text-gray-500"}`}> 
          Next & Submit 
        </button> 
      </div> 

           {/* Player Pool */} 
      <div className="md:col-span-2"> 
        <h3 className="font-semibold mb-2">Players</h3> 
        {loading && <div>Loading players…</div>} 
        {error && <div className="text-red-600">{error}</div>} 
        <div className="space-y-2 max-h-[70vh] overflow-auto"> 
          {players.map(p => { 
            const disabled = allSelected.some(x => x.id === p.id) || budgetLeft < p.price; 
            return ( 
              <div key={p.id} className="flex justify-between border rounded p-2"> 
                <div> 
                  <div>{p.name}</div> 
                  <div className="text-xs opacity-70">{p.position} • {p.club} • {p.price}m</div> 
                </div> 
                <button disabled={disabled} onClick={() => addPlayer(p)} className="px-2 py-1 border rounded"> 
                  {disabled ? "Added" : "Add"} 
                </button> 
              </div> 
            ); 
          })} 
        </div> 
      </div> 
    </div> 
  )} 
</div> 
); 
}

// ---- UI Helpers ---- 

function BudgetBar({ used, left, cap }: { used: number; left: number; cap: number }) { 

  const pct = Math.min(100, Math.round((used / cap) * 100)); 

  return ( 

    <div className="rounded-2xl border p-4"> 

      <div className="flex justify-between mb-1"><span>Budget</span><span>{used.toFixed(1)} / {cap}m</span></div> 

      <div className="w-full bg-gray-100 h-3 rounded"><div className="bg-black h-3" style={{ width: `${pct}%` }} /></div> 

      <div className="text-xs">Remaining: {left.toFixed(1)}m</div> 

    </div> 

  ); 

} 

function SquadSection({ title, slots, squad, onRemove, onCaptain, onVice }: any) { 

  return ( 

    <div className="rounded-2xl border p-4 space-y-3"> 

      <h3 className="font-semibold">{title}</h3> 

      {slots.map(({ key, label, count }: any) => ( 

        <SlotRow key={key} label={label} players={squad[key]} required={count} 

          onRemove={onRemove} onCaptain={onCaptain} onVice={onVice} 

          captainId={squad.captainId} viceId={squad.viceId} /> 

      ))} 

    </div> 

  ); 

} 

 

function SlotRow({ label, players, required, onRemove, onCaptain, onVice, captainId, viceId }: any) { 

  const placeholders = required - players.length; 

  return ( 

    <div> 

      <div className="text-sm mb-1">{label}</div> 

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"> 

        {players.map((p: Player) => ( 

          <div key={p.id} className="border rounded p-2"> 

            <div>{p.name}</div> 

            <div className="text-xs opacity-70">{p.position} • {p.club} • {p.price}m</div> 

            <div className="flex gap-1 mt-1 text-xs"> 

              <button onClick={() => onCaptain(p)} className={captainId === p.id ? "bg-black text-white px-2" : "border px-2"}>C</button> 

              <button onClick={() => onVice(p)} className={viceId === p.id ? "bg-black text-white px-2" : "border px-2"}>VC</button> 

              <button onClick={() => onRemove(p)} className="border px-2">Remove</button> 

            </div> 

          </div> 

        ))} 

        {Array.from({ length: placeholders }).map((_, i) => ( 

          <div key={i} className="border-dashed border rounded p-6 text-center text-sm opacity-60">Empty</div> 

        ))} 

      </div> 

    </div> 

  ); 

} 

 
 
 