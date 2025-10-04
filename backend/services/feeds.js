import sanitizeHtml from "sanitize-html"
import { connect_db, get_db } from "@/lib/mongodb";

import cloudinary from "@/lib/cloudinary";
import { JSDOM } from "jsdom";
export async function keywords(data){
    await connect_db() 
    
    const db =await get_db().collection("posts")
    if(!data.value) return []
     let results = await db.find(
         {content : {$regex: data.value, $options: 'i'}}
        ).limit(30).toArray()
        if(results.length === 0){
            const allwords = data.value.split(/\s+/);
                  results = await db.find({$or: allwords.flatMap((word) => [
                { content: { $regex: word, $options: "i" } },
              ])}).limit(15).toArray();
            return results
        } 
        const keylimit = 40;
              // Add snippet to each post but keep the full post data
        const result = results.map((post) => {
         const content = post.content || ""; // avoid undefined
          const dom = new JSDOM(content);
          const text = dom.window.document.body.textContent || "";
        const snippet =
          text.length <= keylimit ? text : text.slice(0, keylimit) + "...";
          return { ...post, snippet };
        });

        return result;

} 

async function uploadFileToCloudinary(file, folder, resourceType = "image" | "video" | "raw" ) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}


export async function newfeed(data) {
    const { text, images=[], video= null, file= null , email} = data
    await connect_db();
    if (!text && images.length === 0 && !video && !file ) {
        return { error: "Post cannot be empty. Please add text or media." };
    }
    if(!text && (images.length >0 || video || file)){
        return { error: "Media posts must include text description. " };
    }
    let safetext= sanitizeHtml(text, {
       allowedTags: [
        "b", "i", "u", "em", "strong", 
        "p", "br", 
        "ul", "ol", "li", 
        "blockquote", 
        "h1", "h2",
        "a"
      ],
        allowedAttributes: {
          a: ["href", "target"],
        },
    });
    // Upload media (wrap each upload in try/catch or handle errors)
    let uploadedImages = [];
    if (images.length > 0) {
      for (const img of images) {
        try {
          const result = await uploadFileToCloudinary(img, "ray_social/images");
          uploadedImages.push({
            url: result.secure_url,
            type: result.resource_type,
            size: result.bytes,
            name: result.original_filename,
          });
        } catch (err) {
          console.error("Cloudinary image upload failed:", err);
          return { error: "Failed to upload image. Try again." };
        }
      }
    }

    let uploadedVideo = null;
    if (video) {
      try {
        const result = await uploadFileToCloudinary(video, "ray_social/videos", "video");
        uploadedVideo = {
          url: result.secure_url,
          type: result.resource_type,
          size: result.bytes,
          name: result.original_filename,
        };
      } catch (err) {
        console.error("Cloudinary video upload failed:", err);
        return { error: "Failed to upload video. Try again." };
      }
    }

    let uploadedFile = null;
    if (file) {
      try {
        const result = await uploadFileToCloudinary(file, "ray_social/files", "raw");
        uploadedFile = {
          url: result.secure_url,
          type: result.resource_type,
          size: result.bytes,
          name: result.original_filename,
        };
      } catch (err) {
        console.error("Cloudinary file upload failed:", err);
        return { error: "Failed to upload file. Try again." };
      }
    }

    const db = await get_db()
    const result = await db.collection("posts").insertOne({email ,content:safetext ,images: uploadedImages, video: uploadedVideo,file: uploadedFile, createdAt : new Date(), likes:0});

    return { insertedId: result.insertedId };
      }