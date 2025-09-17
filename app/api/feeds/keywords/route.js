import { keywords } from "@/backend/services/feeds";
import { NextResponse } from "next/server";

export async function GET(req) {
    try{
        const {searchParams} = new URL(req.url);
        const query = searchParams.get("query") || ""
        const result = await keywords({value : query})
       return NextResponse.json(result, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

}