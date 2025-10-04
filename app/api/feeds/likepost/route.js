import { NextResponse } from "next/server";
import { likepost } from "@/backend/services/allfeeds";
// import { io } from "@/server"; // adjust path to server.js

export async function POST(req) {
  try {
      const { postId, liked, email } = await req.json();

      const result = await likepost(postId, liked, email);

      // 🔴 Emit the real-time event so all connected clients hear it
      //  io.emit("postLiked", result);

      return NextResponse.json(result, { status: 200});  
  } catch (err) {
      console.log(err)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  
}
