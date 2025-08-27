"use client";


import { useRequireAuth } from "@/lib/useRequireAuth"; 


export default function LeaguesPage() { 
  const { ready, userId } = useRequireAuth("/leagues"); 

  if (!ready) return null; 

  return ( 

    <div className="rounded-2xl shadow p-4 bg-white"> 

      <h2 className="text-lg font-semibold">Leagues</h2> 

      <div className="flex gap-2 mt-2"> 

        <button className="h-12 px-4 rounded-2xl bg-black text-white font-medium">Create League</button> 

        <button className="h-12 px-4 rounded-2xl bg-gray-200 font-medium">Join League</button> 

      </div> 

    </div> 

  ); 

} 