import { NextResponse } from "next/server";
import {likecomment} from "@/backend/services/comments";
export async function POST(){
    try {
        const {commentId , liked , email} =await req.body;  
        const result = await likecomment(commentId , liked , email);
        return NextResponse.json(result, { status: 200}); 
    } catch (err) {
        console.log(err)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}