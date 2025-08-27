"use client"; 

  

import { useEffect, useState } from "react"; 

import { useRouter } from "next/navigation"; 

import { supabase } from "@/lib/supabaseClient"; 

  

export function useRequireAuth(next: string = "/") { 

  const router = useRouter(); 

  const [ready, setReady] = useState(false); 

  const [userId, setUserId] = useState<string | null>(null); 

  

  useEffect(() => { 

    async function check() { 

      const { data } = await supabase.auth.getUser(); 

      if (!data.user) { 

        router.replace(`/login?next=${encodeURIComponent(next)}`); 

        return; 

      } 

      setUserId(data.user.id); 

      setReady(true); 

    } 

    check(); 

  }, [router, next]); 

  

  return { ready, userId }; 

} 