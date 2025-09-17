import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import Navbar from "@/components/users/navbar"
import { AppSidebar } from "@/components/users/sidebar"
import {connect_db} from "@/lib/mongodb"
import { Toaster } from "sonner";
// import Sidebarmenu from "@/components/users/sidebarmenu" 
export default async function Layout({ children }: { children: React.ReactNode }) {
   const NAVBAR_HEIGHT = 84;
   await connect_db();
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
           <Navbar/>
        <div style={{ paddingTop: NAVBAR_HEIGHT }}>
          {children}
        </div>
      </SidebarInset>
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  )
}