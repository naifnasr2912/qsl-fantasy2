// components/TopBar.tsx 

"use client"; 

  

import Link from "next/link"; 

import LanguageToggle from "@/components/LanguageToggle"; 

import { supabase } from "@/lib/supabaseClient"; // if yours is named export, use { supabase } 

import { useRouter } from "next/navigation"; 

import { useEffect, useState } from "react"; 

  

// Simple dropdown using <details> (no extra deps) 

function UserMenu({ 

  email, 

  onLogout, 

}: { 

  email: string | null; 

  onLogout: () => Promise<void>; 

}) { 

  if (!email) { 

    return ( 

      <Link href="/login" className="text-sm underline"> 

        Login 

      </Link> 

    ); 

  } 

  

  const initial = email?.[0]?.toUpperCase() ?? "U"; 

return ( 

    <details className="relative"> 

      <summary 

        className="list-none flex items-center gap-2 cursor-pointer select-none" 

        aria-label="Open user menu" 

      > 

   <span 
      title={email} 
      className="hidden sm:block text-sm text-gray-600 max-w-[18ch] truncate" 
    > 
      {email} 
    </span> 
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white text-sm"> 
      {initial} 
    </span> 
  </summary> 
 
  <div 
    className="absolute right-0 mt-2 w-44 rounded-xl border bg-white shadow-lg p-1 z-50" 
    onClick={(e) => e.stopPropagation()} 
  > 
    <Link 
      href="/reset-password" 
      className="block w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-gray-50" 
    > 
      Change password 
    </Link> 
    {/* Add your profile/settings page later if you have one */} 
    {/* <Link href="/profile" className="block w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-gray-50">Profile</Link> */} 
    <button 
      onClick={onLogout} 
      className="block w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-gray-50" 
    > 
      Sign out 
    </button> 
  </div> 
</details> 
  

); } 

export default function TopBar() { 

  const router = useRouter(); 

  

  const [email, setEmail] = useState<string | null>(null); 

  const [mounted, setMounted] = useState(false); 

  

  // Read session on mount & listen for changes (prevents hydration mismatch) 

  useEffect(() => { 

    let active = true; 

  

    (async () => { 

      const { data } = await supabase.auth.getSession(); 

      if (!active) return; 

      setEmail(data.session?.user?.email ?? null); 

      setMounted(true); 

    })(); 

  

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { 

      if (!active) return; 

      setEmail(session?.user?.email ?? null); 

    }); 

  

    return () => { 

      active = false; 

      sub.subscription.unsubscribe(); 

    }; 

  }, []); 

if (!mounted) return null; 

  

  async function handleLogout() { 

    try { 

      await supabase.auth.signOut(); 

    } finally { 

      router.replace("/login"); 

    } 

  } 

return ( 

    <div className="mx-auto max-w-screen-sm px-4 h-14 flex items-center justify-between"> 

      {/* Left: brand/title */}  

      <Link href="/" className="font-semibold"> 

        QSL Fantasy 

      </Link> 

 

      {/* Right: Language + User menu */} 
      <div className="flex items-center gap-4"> 

        <LanguageToggle /> 

        <UserMenu email={email} onLogout={handleLogout} /> 

      </div> 

    </div> 

  ); 

} 