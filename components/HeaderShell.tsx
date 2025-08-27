"use client"; 

  

import dynamic from "next/dynamic"; 

  

// Load TopBar on the client only 

const TopBar = dynamic(() => import("@/components/TopBar"), { ssr: false }); 

  

export default function HeaderShell() { 
    return ( 

    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur"> 

      <div className="mx-auto max-w-screen-sm px-4 h-14 flex items-center justify-between"> 

        <TopBar /> 

      </div> 

    </header> 

  ); 

} 