"use client"; 

import { useEffect, useState } from "react"; 

import { getLang, setLang, type Lang } from "@/lib/i18n"; 

  

export default function LanguageToggle() { 

  const [lang, set] = useState<Lang>("en"); 

  

  useEffect(() => { 

    set(getLang()); 

    const onChange = (e: any) => set(e.detail); 

    window.addEventListener("lang-change", onChange as any); 

    return () => window.removeEventListener("lang-change", onChange as any); 

  }, []); 

  

  function toggle() { 

    const next = lang === "en" ? "ar" : "en"; 

    setLang(next); 

    set(next); 

    // flip direction for Arabic 

    if (typeof document !== "undefined") { 

      document.documentElement.dir = next === "ar" ? "rtl" : "ltr"; 

      document.documentElement.lang = next; 

    } 

  } 

  

  return ( 

    <button onClick={toggle} 

      className="h-10 px-3 rounded-xl bg-gray-100 text-sm"> 

      {lang === "en" ? "AR" : "EN"} 

    </button> 

  ); 

} 