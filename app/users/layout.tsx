
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import {auth } from "../api/auth/[...nextauth]/auth"
import Navbar from "@/components/users/navbar"
import { AppSidebar } from "@/components/users/sidebar"
import {connect_db} from "@/lib/mongodb"
import { redirect } from "next/navigation"
// import Sidebarmenu from "@/components/users/sidebarmenu" 
export default async function Layout({ children }: { children: React.ReactNode }) {
   const NAVBAR_HEIGHT = 84;
   await connect_db();
    const session = await auth();
      const user = session?.user;
      
        if (!session?.user) {
          redirect("/auth/login")
        }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
           <Navbar user={user}/>
        <div style={{ paddingTop: NAVBAR_HEIGHT }}>
          {children}
        </div>
      </SidebarInset>
      
    </SidebarProvider>
  )
}