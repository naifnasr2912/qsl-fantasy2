// app/update-password/page.tsx 

import { Suspense } from "react"; 

import  UpdatePasswordClient  from "./UpdatePasswordClient"; 

  

export default function Page() { 

  // Only the client component uses useSearchParams 

  return ( 

    <Suspense fallback={null}> 

      <UpdatePasswordClient /> 

    </Suspense> 

  ); 

} 