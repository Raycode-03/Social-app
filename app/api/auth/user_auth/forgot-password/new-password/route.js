import {reset_password} from "@/backend/services/forgot_services"
import { validate_new_password } from "@/backend/validations/forgot_password_validation";
import { NextResponse } from "next/server";
export async function POST(req){
    try {
        const body = await req.json();
        // Validate user input
        const  validationerror = validate_new_password(body);
        if (validationerror) {
        return NextResponse.json({ error: validationerror}, {status: 400});
        }
        // services for new user
        const serviceResult = await reset_password(body);
    if (serviceResult.error) {
      // This means service returned an error message
      return NextResponse.json({ error: serviceResult.message }, { status: 400 });
    }

    // 3. Success
    return NextResponse.json({ message: serviceResult.message }, { status: 201 });
    } catch (error) {
        console.error("Error registering user:", error);
        return NextResponse.json({ error: process.env.NODE_ENV==="development" ? error.message : "Internal server error" }, {status: 500});
    }
}