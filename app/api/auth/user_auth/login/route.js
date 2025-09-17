import {validateuser} from "@/backend/validations/user_validation";
import { loginservices } from "@/backend/services/user_services";
import { NextResponse } from "next/server";
export async function POST(req){
    try{
        const body = await req.json()
        const validationerror = validateuser(body);
        if(validationerror){
            return NextResponse.json({error:validationerror} , {status:400})
        }
        // services for new user
                const serviceResult = await loginservices(body);
            if (typeof serviceResult === "string") {
              // This means service returned an error message
              return NextResponse.json({ error: serviceResult }, { status: 400 });
            }
        
            // 3. Success
            return NextResponse.json({ user: serviceResult }, { status: 201 });
        } catch (error) {
                console.error("Error registering user:", error);
                return NextResponse.json({ error: process.env.NODE_ENV==="development" ? error.message : "Internal server error" }, {status: 500});
            }
}