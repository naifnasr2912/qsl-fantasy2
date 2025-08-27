"use client"; 

  

import { useEffect, useState, type FormEvent } from "react"; 

import { useRouter } from "next/navigation"; 

import {supabase} from "@/lib/supabaseClient"; 

  

export default function UpdatePasswordClient() { 

  const router = useRouter(); 

  const [email, setEmail] = useState<string | null>(null); 

  const [pw1, setPw1] = useState(""); 

  const [pw2, setPw2] = useState(""); 

  const [msg, setMsg] = useState(""); 

  const [loading, setLoading] = useState(false); 

  

  // Load current session email from Supabase (magic link sets it) 

  useEffect(() => { 

    let mounted = true; 

  

    async function load() { 

      const { data } = await supabase.auth.getSession(); 

      if (mounted) { 

        setEmail(data.session?.user?.email ?? null); 

      } 

    } 

    load(); 

  

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { 

      if (mounted) setEmail(session?.user?.email ?? null); 

    }); 

  

    return () => { 

      mounted = false; 

      sub.subscription.unsubscribe(); 

    }; 

  }, []); 

  

  async function handleSubmit(e: FormEvent) { 

    e.preventDefault(); 

    setMsg(""); 

  

    if (pw1.length < 6) { 

      setMsg("Password must be at least 6 characters."); 

      return; 

    } 

    if (pw1 !== pw2) { 

      setMsg("Passwords do not match."); 

      return; 

    } 

  

    setLoading(true); 

    try { 

      const { error } = await supabase.auth.updateUser({ password: pw1 }); 

      if (error) { 

        setMsg(`Error: ${error.message}`); 

        return; 

      } 

  

      setMsg("✅ Password updated. Redirecting to login…"); 

  

      // Give the user 2s to read, then sign out + redirect 

      setTimeout(async () => { 

        try { 

          await supabase.auth.signOut(); 

        } finally { 

          router.replace("/login"); 

        } 

      }, 2000); 

    } finally { 

      setLoading(false); 

    } 

  } 

  return (
      <div className="max-w-sm mx-auto mt-20 p-6 border rounded-2xl shadow bg-white"> 

      <h1 className="text-xl font-semibold mb-1">Set a new password</h1> 

      <p className="text-sm text-gray-600 mb-4"> 

        {email ? ( 

          <>for <span className="font-medium">{email}</span></> 

        ) : ( 

          "Checking session…" 

        )} 

      </p> 

      <form onSubmit={handleSubmit} className="space-y-4"> 

        <input 

          type="password" 

          placeholder="New password" 

          value={pw1} 

          onChange={(e) => setPw1(e.target.value)} 

          className="w-full border rounded-xl p-3" 

          required 

        /> 

       <input 

          type="password" 

          placeholder="Confirm new password" 

          value={pw2} 

          onChange={(e) => setPw2(e.target.value)} 

          className="w-full border rounded-xl p-3" 

          required 

        /> 

        <button 

          type="submit" 

          disabled={loading} 

          className="w-full h-12 rounded-2xl bg-black text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed" 

        > 

          {loading ? "Updating…" : "Update Password"} 

        </button> 

      </form> 

 

      {msg && ( 

        <div 

          role="alert" 

          className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 text-center" 

        > 

          {msg} 

        </div> 

      )} 

  

      {!email && ( 

        <p className="mt-3 text-xs text-center text-gray-500"> 

          If you opened this page directly, request a new link from{" "} 

          <a href="/reset-password" className="underline">Reset Password</a>. 

        </p> 

      )} 

    </div> 

  ); 

} 