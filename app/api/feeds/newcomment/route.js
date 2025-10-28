import { NextResponse } from "next/server";
import { newcommentvalidate } from "@/backend/validations/comments";
import {newcomment} from "@/backend/services/comments";
export async function POST(req) {
    try {
        const body = await req.json(); // ✅ Parse the request body
        const { content, postId, email } = body;
        const validationError = await newcommentvalidate(body);
        if (validationError) {
            return NextResponse.json(
                { error: validationError }, 
                { status: 400 }
            );
        }
        const result = await newcomment({ content, postId, email });
        if (result && "error" in result) {
            return NextResponse.json(
                { error: result.error },{ status: 400 });
        };
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
    const isDbError = error.message?.includes('MongoNetworkError') || error.message?.includes('ENOTFOUND');
                    console.error("Error registering user:", error);
                    return NextResponse.json({ error: isDbError ? "Network unavailable" : "Internal server error" }, {status: 500});
  }
}