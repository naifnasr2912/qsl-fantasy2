import Link from "next/link"; 

  

export default function HomePage() { 

  return ( 

    <div className="space-y-4"> 

      <section className="rounded-2xl shadow p-4 bg-white"> 

        <h1 className="text-xl font-semibold">Welcome to QSL Fantasy</h1> 

        <p className="text-sm opacity-70"> 

          Pick 11 each week. Extra points for underdog clubs. 

        </p> 

  

        <Link 

          href="/login" 

          className="mt-4 inline-flex items-center justify-center h-12 w-full rounded-2xl bg-black text-white font-medium" 

        > 

          Play Now 

        </Link> 

      </section> 

    </div> 

  ); 

} 