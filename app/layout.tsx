// app/layout.tsx 

import "./globals.css"; 

import TopBar from "@/components/TopBar"; 

import BottomNav from "@/components/BottomNav"; 

import type { ReactNode } from "react"; 

  

export default function RootLayout({ children }: { children: ReactNode }) { 
  return (
    <html lang="en" suppressHydrationWarning> 

      <body suppressHydrationWarning> 

        <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur"> 

          <TopBar /> 

        </header> 

  

        <main className="mx-auto max-w-screen-sm px-4 pb-24 pt-4">{children}</main> 

  

        <BottomNav /> 

      </body> 

    </html> 

  ); 

} 