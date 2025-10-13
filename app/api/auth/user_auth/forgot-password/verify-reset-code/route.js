import {verify_resetcode} from "@/backend/services/forgot_services"
import { validate_reset_code } from "@/backend/validations/forgot_password_validation";
import { NextResponse } from "next/server";
export async function POST(req){
    try {
        const body = await req.json();
        // Validate user input
        const  validationerror = validate_reset_code(body);
        if (validationerror) {
        return NextResponse.json({ error: validationerror}, {status: 400});
        }
        // services for new user
        const serviceResult = await verify_resetcode(body);
    if (serviceResult.error) {
      // This means service returned an error message
      return NextResponse.json({ error: serviceResult.message }, { status: 400 });
    }
    // 3. Success
    return NextResponse.json({ message: serviceResult.message }, { status: 201 });
    } catch (error) {
        const isDbError = error.message?.includes('MongoNetworkError') || error.message?.includes('ENOTFOUND');
                    console.error("Error registering user:", error);
                    return NextResponse.json({ error: isDbError ? "Network unavailable" : "Internal server error" }, {status: 500});
    }
}