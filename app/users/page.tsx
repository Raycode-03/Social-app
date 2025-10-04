"use server"
import React from 'react'
import { auth } from '../api/auth/[...nextauth]/auth'
import { redirect } from 'next/navigation'
import Posts from "@/components/users/posts"
import Newpost from '@/components/users/newpost'
async function page() {
    const session = await auth();
    const email= session?.user.email || null
    //const email = "akereleolasun7@gmail.com";
    
   if(session?.user){

              return(
                <div className='px-7 py-4'>
                    <Newpost useremail={email}/>
                    <Posts email={email} />

                    {/*dont forget to send this to the user account settigns to signout  */}
                    {/* <button className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-md transition-all duration-200 border border-amber-400 flex items-center gap-2">
                        <SignOutBtn />
                    </button> */}

                </div>
              )
  }
  redirect("/auth/login")
}

export default page
