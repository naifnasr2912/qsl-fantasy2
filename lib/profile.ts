import { supabase } from "@/lib/supabaseClient"; 

/** Create a row in profiles for the signed-in user if missing, then return it. */ 
export async function ensureAndGetProfile() { 
    const { data: u } = await supabase.auth.getUser(); 
    const user = u?.user; 
    if (!user) throw new Error("Not signed in"); 

// create if missing (or keep existing) 
    const { error: upsertErr } = await supabase 
    .from("profiles") 
    .upsert( 
        { id: user.id, email: user.email ?? null }, // we can set display_name later 
        { onConflict: "id" } ); 
    if (upsertErr) throw upsertErr; 

    const { data: profile, error } = await supabase 
    .from("profiles") 
    .select("*") 
    .eq("id", user.id) 
    .single(); 

if (error) throw error; 
return profile; 
} 