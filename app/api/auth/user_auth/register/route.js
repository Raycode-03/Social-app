    import { NextResponse } from "next/server";
    import {validateuser} from "@/backend/validations/user_validation";
    import { signin_services } from "@/backend/services/user_services";
    export async function POST(req) {
    try {
        const body = await req.json();

        // Validate user input
        const  validationerror = validateuser(body);
        if (validationerror) {
        return NextResponse.json({ error: validationerror}, {status: 400});
        }
        // services for new user
        const serviceResult = await signin_services(body);
    if (typeof serviceResult === "string") {
      // This means service returned an error message
      
      return NextResponse.json({ error: serviceResult }, { status: 400 });
    }

    // 3. Success
    return NextResponse.json({ user: serviceResult }, { status: 201 });
    } catch (error) {
        const isDbError = error.message?.includes('MongoNetworkError') || error.message?.includes('ENOTFOUND');
                    console.error("Error registering user:", error);
                    return NextResponse.json({ error: isDbError ? "Network unavailable" : "Internal server error" }, {status: 500});
    }
    }