import { NextResponse } from "next/server";
import { verify_email } from "@/backend/services/forgot_services";
import { validate_verify_email } from "@/backend/validations/forgot_password_validation";

export async function POST(req) {
  try {
    const body = await req.json();

    // Validate input
    const validationError = validate_verify_email(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Run service
    const serviceResult = await verify_email(body);

    if (serviceResult.error) {
      // Service returned an error case
      return NextResponse.json({ error: serviceResult.message }, { status: 400 });
    }

    // Success case
    return NextResponse.json({ message: serviceResult.message }, { status: 200 });

  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
