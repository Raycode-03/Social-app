import  {allcomments}  from "@/backend/services/comments";
import { NextResponse } from "next/server";
import { auth } from '@/app/api/auth/[...nextauth]/auth'
export async function POST(req) {
  try {
     const session = await auth();
   if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
    const body = await req.json(); // ✅ Parse the request body
    const { postId  , email} = body;
    const feeds = await allcomments(postId , email);
    return NextResponse.json(feeds, { status: 200 });
  } catch (error) {
    const isDbError = error.message?.includes('MongoNetworkError') || error.message?.includes('ENOTFOUND');
                    console.error("Error commenting post:", error);
                    return NextResponse.json({ error: isDbError ? "Network unavailable" : "Internal server error" }, {status: 500});
  }
  
}