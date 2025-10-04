import  {allfeeds}  from "@/backend/services/allfeeds";
import { NextResponse } from "next/server";
import { auth } from '@/app/api/auth/[...nextauth]/auth'
export async function GET(req) {
   const session = await auth();

   if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
   const email = session?.user.email;

  // offline work
  //const { searchParams } = new URL(req.url);
  
 // const email = searchParams.get("email");
  const feeds = await allfeeds(email);
  return NextResponse.json(feeds, { status: 200 });
}