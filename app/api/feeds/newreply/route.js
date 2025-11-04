import { NextResponse } from "next/server";
import { replycomment } from "@/backend/services/comments";

export async function POST(req) {
  try {
    const { commentId, content, email, postId } = await req.json();
    const result = await replycomment({ commentId, content, email, postId });

    if (result && "error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error in newreply route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
