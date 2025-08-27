"use client"; 

  

import Link from "next/link"; 

import { usePathname } from "next/navigation"; 

  

const items = [ 

  { href: "/", label: "Home", icon: "🏠" }, 

  { href: "/pick", label: "Pick", icon: "📝" }, 

  { href: "/points", label: "Points", icon: "📊" }, 

  { href: "/leagues", label: "Leagues", icon: "🏆" }, 

]; 

  

export default function BottomNav() { 

  const pathname = usePathname(); 

  return ( 

    <nav className="fixed bottom-0 left-0 right-0 h-16 border-t bg-white"> 

      <div className="mx-auto max-w-screen-sm h-full px-4 flex items-center justify-between"> 

        {items.map((it) => { 

          const active = pathname === it.href; 

          return ( 

            <Link 

              key={it.href} 

              href={it.href} 

              className="flex flex-col items-center text-xs" 

            > 

              <div className={`text-xl ${active ? "" : "opacity-60"}`}> 

                {it.icon} 

              </div> 

              <div className={active ? "font-semibold" : "opacity-60"}> 

                {it.label} 

              </div> 

            </Link> 

          ); 

        })} 

      </div> 

    </nav> 

  ); 

} 