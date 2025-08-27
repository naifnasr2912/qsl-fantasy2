"use client"; 

  

import { useEffect } from "react"; 

import { useRouter } from "next/navigation"; 

import { supabase } from "@/lib/supabaseClient"; 

  

export default function LogoutPage() { 

  const router = useRouter(); 

  

  useEffect(() => { 

    (async () => { 

      try { 

        await supabase.auth.signOut(); 

      } finally { 

        router.replace("/login"); 

      } 

    })(); 

  }, [router]); 

  

  return null; // no UI needed 

} 