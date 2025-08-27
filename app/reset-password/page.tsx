"use client"; 

import { useState } from "react"; 

import {supabase} from "@/lib/supabaseClient"; 

  

export default function ResetPasswordPage() { 

  const [email, setEmail] = useState(""); 

  const [loading, setLoading] = useState(false);

  const [msg, setMsg] = useState<string>(""); 

  

  async function handleSend(e: React.FormEvent) { 

    e.preventDefault(); 

    setMsg(""); 
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { 

        redirectTo: `${window.location.origin}/update-password`, 

    }); 

  

    if (error) { 

      setMsg(`Error: ${error.message}`); 

    } else {
      
      setMsg("Check your inbox for a password reset link."); 

    } 
  } finally {
      setLoading(false);  
  }
}


  return ( 

   <div className="max-w-sm mx-auto mt-20 p-6 border rounded-2xl shadow bg-white">  

      <h1 className="text-xl font-semibold mb-4">Reset your password</h1> 


      <form onSubmit={handleSend} className="space-y-4">

  

        <input 

          type="email" 

          className="w-full rounded-xl border p-3" 

          placeholder="you@example.com" 

          value={email} 

          onChange={(e) => setEmail(e.target.value)} 

          required 

        /> 

  

        <button 
          type="submit" 
          disabled={loading}
          aria-busy={loading}
          className="w-full h-12 rounded-2xl bg-black text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        > 

          {loading ? "Sending..." : "Send Reset Link"}

        </button> 

      </form> 

      {msg && ( 

        <div 

          role="alert" 

          className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 text-center" 

        > 

          {msg} 

        </div> 

      )} 

  

      <p className="mt-3 text-center text-sm text-gray-600"> 

        Remembered it?{" "} 

        <a href="/login" className="text-blue-600 underline hover:text-blue-800"> 

          Back to login 

        </a> 

      </p> 

    </div> 

  ); 

} 