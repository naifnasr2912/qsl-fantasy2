"use client"; 

  

import { Suspense, useEffect, useState } from "react"; 

import { useRouter, useSearchParams } from "next/navigation"; 

import {supabase} from "@/lib/supabaseClient"; 

import { ensureAndGetProfile } from "@/lib/profile"; 

  

export default function SignupPage() { 

  return ( 

    <Suspense fallback={null}> 

      <SignupForm /> 

    </Suspense> 

  ); 

} 

  

function SignupForm() { 

  const router = useRouter(); 

  const searchParams = useSearchParams(); 

  const next = searchParams.get("next") ?? "/pick"; 

  

  const [email, setEmail] = useState(""); 

  const [password, setPassword] = useState(""); 

  const [msg, setMsg] = useState<string>(""); 

  const [currentEmail, setCurrentEmail] = useState<string | null>(null); 

  

  // Show current signed-in user (if any) 

  useEffect(() => { 

    let ignore = false; 

    (async () => { 

      const { data } = await supabase.auth.getSession(); 

      if (ignore) return; 

      const email = data.session?.user?.email ?? null;
      setCurrentEmail(email);

      // if already signed in, redirect to ?next= or /pick
      if (email) {
        router.replace(next);
        }

    })(); 

    return () => { ignore = true; }; 

  }, [router, next ]); 

  

  async function handleSignup(e: React.FormEvent) { 

    e.preventDefault(); 

    setMsg(""); 

  

    const { data, error } = await supabase.auth.signUp({ email, password }); 

    if (error) { 

      setMsg(`Sign up error: ${error.message}`); 

      return; 

    } 

  

    // Try to provision profile (best-effort) 

    try { await ensureAndGetProfile(); } catch {} 

  

    // If email confirmation is OFF, a session might exist → redirect 

    const { data: check } = await supabase.auth.getSession(); 

    if (check.session) { 

      router.replace(next); 

      return; 

    } 

  

    // Otherwise ask the user to verify 

    setMsg("Account created. Please verify your email, then log in."); 

  } 

  return ( 

<div className="space-y-4"> 

      <form onSubmit={handleSignup} className="rounded-2xl shadow p-4 bg-white space-y-3"> 

        <h1 className="text-xl font-semibold">Sign Up</h1> 

        {currentEmail && ( 

          <p className="text-sm text-gray-600 text-center"> 

            Currently signed in as <span className="font-medium">{currentEmail}</span>.{" "} 

            <a href="/logout" className="underline">Sign out</a> to switch accounts. 

          </p> 

        )} 

       <input 

          type="email" 

          className="w-full rounded-xl border p-3" 

          placeholder="you@example.com" 

          value={email} 

          onChange={(e) => setEmail(e.target.value)} 

          required 

        /> 

<input 
      type="password" 
      className="w-full rounded-xl border p-3" 
      placeholder="********" 
      value={password} 
      onChange={(e) => setPassword(e.target.value)} 
      required 
    /> 
 
    <button type="submit" className="w-full h-12 rounded-2xl bg-black text-white font-medium"> 
      Continue 
    </button> 
 
    <p className="mt-2 text-center text-sm text-gray-600"> 
      Already have an account?{" "} 
      <a href="/login" className="text-blue-600 underline">Log in</a> 
    </p> 
 
    {msg ? <p className="text-sm text-center opacity-80">{msg}</p> : null} 
  </form> 
</div> 
  

); } 
