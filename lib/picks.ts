// lib/picks.ts 
import { createClient } from "@supabase/supabase-js"; 

export async function setCaptainClient( 
    supabase: ReturnType<typeof createClient>, 
    gameweekId: number, 
    playerId: number 
) { 
    // 1) Who's the current user? 
    const { data: authData, error: authErr } = await supabase.auth.getUser(); 
    if (authErr || !authData.user) throw new Error("Not signed in"); 
    const userId = authData.user.id; 

    // 2) Find the current captain row for this user+GW 
    const { data: currentCaptain, error: selErr } = await supabase 
        .from("picks") 
        .select("id") 
        .eq("user_id", userId) 
        .eq("gameweek_id", gameweekId) 
        .eq("is_captain", true) 
        .maybeSingle(); 

    if (selErr) throw selErr; 

    // 3) Unset old captain (if any) 
    if (currentCaptain?.id) { 
        const { error: unsetErr } = await supabase 
        .from("picks") 
        .update({ is_captain: false }) 
        .eq("id", currentCaptain.id); 
        if (unsetErr) throw unsetErr; 
    } 

    // 4) Set new captain. 
    // Try UPDATE first (if the player is already selected), 
    // otherwise INSERT (if user tapped "C" before pressing "Add"). 
    const { data: updData, error: updErr } = await supabase 
        .from("picks") 
        .update({ is_captain: true }) 
        .eq("user_id", userId) 
        .eq("gameweek_id", gameweekId) 
        .eq("player_id", playerId) 
        .select("id"); 

    if (updErr) throw updErr; 

    if (!updData || updData.length === 0) { 
        // no row existed → insert it as selected + captain 
        const { error: insErr } = await supabase.from("picks").insert([ 
            { 
                user_id: userId, 
                gameweek_id: gameweekId, 
                player_id: playerId, 
                is_captain: true, 
            }, 
        ]); 
        if (insErr) { 
            // If a race condition hits the unique index, surface a friendly message 
            // (DB constraint name: picks_unique_captain_per_gw) 
            if ( 
                typeof insErr.message === "string" && 
                insErr.message.includes("picks_unique_captain_per_gw") 
            ) { 
                throw new Error("Captain already set; please try again."); 
            } 
            throw insErr; 
        } 
    } 

    // 5) Done – return ok so UI can refresh 
    return { ok: true }; 
} 

 