import { newfeedsvaildate } from "@/backend/validations/feeds"
import { newfeed } from "@/backend/services/feeds";
import { NextResponse } from "next/server";

export const config = {
  api: {
    bodyParser: false,
     sizeLimit: '20mb', // Set desired value here
  },
};

export async function POST(req) {
  try {
    let data;

    // Detect content type (json vs formdata)
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      data = await req.json();
    } else if (contentType.includes("multipart/form-data")) {
      // Use FormData API which works with Web Request objects
      const formData = await req.formData();
      data = {
        text: formData.get('text') || '',
        email: formData.get('email') || '',
        images: formData.getAll('images'),
        video: formData.get('video'),
        file: formData.get('file'),
      };
    } else {
      return NextResponse.json(
        { error: "Unsupported content type" }, 
        { status: 415 }
      );
    }
      // ✅ Sanitize files here
    data.images = (data.images || []).filter(
      (file) => file && file.name && file.size > 0
    );
    if (data.video && (!data.video.name || data.video.size === 0)) {
      data.video = null;
    }
    if (data.file && (!data.file.name || data.file.size === 0)) {
      data.file = null;
    }
      console.log(data , "the data sent to the validation" , data.images.length , data.video)    
    // Validation
    const validationError = await newfeedsvaildate(data);
    if (validationError) {
      return NextResponse.json(
        { error: validationError }, 
        { status: 400 }
      );
    }

    // Service call
    const newfeedResult = await newfeed(data);
    
    if (newfeedResult && "error" in newfeedResult) {
      return NextResponse.json(
        { error: newfeedResult.error }, 
        { status: 400 }
      );
    }

    // Success response
    return NextResponse.json(
      { result: newfeedResult }, 
      { status: 201 }
    );

  } catch (error) {
    console.error("Error Creating Post:", error);
    return NextResponse.json(
      { 
        error: process.env.NODE_ENV === "development" 
          ? error.message 
          : "Internal server error" 
      }, 
      { status: 500 }
    );
  }
}