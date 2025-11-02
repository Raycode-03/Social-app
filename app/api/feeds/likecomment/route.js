import { NextResponse } from "next/server";
import {likecomment} from "@/backend/services/comments";
export async function POST(req){
    try {
        const {commentId , liked , email} =await req.json();  
        const result = await likecomment(commentId , liked , email);
        return NextResponse.json(result, { status: 200}); 
    } catch (err) {
        console.log(err)
      const isDbError = err.message?.includes('MongoNetworkError') || err.message?.includes('ENOTFOUND');
                    console.error("Error adding like:", err);
                    return NextResponse.json({ error: isDbError ? "Network unavailable" : "Internal server error" }, {status: 500});
    }
}