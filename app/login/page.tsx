// app/login/page.tsx 

"use client"; 

  

import Link from "next/link"; 

import { Suspense, useEffect, useState, type FormEvent } from "react"; 

import { useRouter, useSearchParams } from "next/navigation"; 

import {supabase} from "@/lib/supabaseClient"; 

import { ensureAndGetProfile } from "@/lib/profile"; 

  

export default function LoginPage() { 

  // Only the form (which uses useSearchParams) is rendered inside Suspense 

  return ( 

    <Suspense fallback={null}> 

      <LoginForm /> 

    </Suspense> 

  ); 

} 

  

function LoginForm() { 

  const router = useRouter(); 

  const searchParams = useSearchParams(); 

  const next = searchParams.get("next") ?? "/pick"; 

  

  // UI state 

  const [email, setEmail] = useState(""); 

  const [password, setPassword] = useState(""); 

  const [msg, setMsg] = useState<string>(""); 

  const [loading, setLoading] = useState(false); 

  

  // Helpful hint: show which account is currently signed in 

  const [currentEmail, setCurrentEmail] = useState<string | null>(null); 

  

  // If already signed in, skip this page and go to ?next= or /pick 

  useEffect(() => { 

    let ignore = false; 

  

    (async () => { 

      const { data } = await supabase.auth.getSession(); 

      if (ignore) return; 

  

      const sessionEmail = data.session?.user?.email ?? null; 

      setCurrentEmail(sessionEmail); 

  

      if (sessionEmail) { 

        router.replace(next); 

      } 

    })(); 

  

    return () => { 

      ignore = true; 

    }; 

  }, [router, next]); 

  

  async function handleAuth(e: FormEvent) { 

    e.preventDefault(); 

    setMsg(""); 

    setLoading(true); 

  

    try { 

      // 1) Try sign-in 

      const { data: signInData, error: signInErr } = 

        await supabase.auth.signInWithPassword({ email, password }); 

  

      if (!signInErr && signInData.user) { 

        try { 

          await ensureAndGetProfile(); 

        } catch {} 

        setCurrentEmail(email); 

        router.replace(next); 

        return; 

      } 

  

      // 2) If sign-in failed, attempt sign-up 

      const { error: signUpErr } = await supabase.auth.signUp({ email, password }); 

  

      if (signUpErr) { 

        setMsg(`Sign up error: ${signUpErr.message}`); 

        setCurrentEmail(email); 

        return; 

      } 

  

      // 3) Create/fetch profile and redirect if a session exists 

      try { 

        await ensureAndGetProfile(); 

      } catch {} 

  

      const { data: check } = await supabase.auth.getSession(); 

      if (check.session) { 

        router.replace(next); 

        return; 

      } 

  

      // Email confirmation likely required 

      setMsg("Account created. Please verify your email, then sign in."); 

      setCurrentEmail(email); 

    } finally { 

      setLoading(false); 

    } 

  } 
 return (
     <div className="space-y-4"> 

      <form onSubmit={handleAuth} className="rounded-2xl shadow p-4 bg-white space-y-3"> 

        <h1 className="text-xl font-semibold">Login</h1> 

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
   {/* Forgot password directly under password input */} 
    <div className="mt-2 text-right"> 
      <Link href="/reset-password" className="text-sm text-blue-600 underline hover:text-blue-800"> 
        Forgot password? 
      </Link> 
    </div> 
        <button 

          type="submit" 

          disabled={loading} 

          aria-busy={loading} 

          className="mt-4 w-full h-12 rounded-2xl bg-black text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed" 

        > 

          {loading ? "Please wait…" : "Continue"} 

        </button> 

   {/* Status message */} 
    {msg ? ( 
      <div 
        role="alert" 
        className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700" 
      > 
       {msg} 
      </div> 
    ) : null} 
 
    {/* Sign up link */} 
    <p className="mt-2 text-center text-sm text-gray-600"> 
      Don’t have an account?{" "} 
      <a href="/signup" className="text-blue-600 underline hover:text-blue-800"> 
        Sign up 
      </a> 
    </p> 
 
    {/* Logged-in hint */} 
    {currentEmail && ( 
      <p className="mt-2 text-center text-sm text-gray-600"> 
        Logged in as: <span className="font-medium">{currentEmail}</span> 
      </p> 
    )} 
  </form> 
</div> 
  

); } 