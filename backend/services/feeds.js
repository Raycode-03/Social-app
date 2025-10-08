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

async function uploadFileToCloudinaryWithRetry(file, folder, resourceType = "image", maxRetries = 3) {

  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxRetries} for ${file?.name || 'unknown'} (${resourceType})`);
      
      // Validate file first
      if (!file || !file.type || file.size === 0) {
        throw new Error('Invalid file provided');
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const base64String = buffer.toString('base64');
      const dataUri = `data:${file.type};base64,${base64String}`;

      const uploadOptions = {
        folder: folder,
        resource_type: resourceType,
        timeout: resourceType === 'video' ? 180000 : 60000,
        quality: "auto:best",  // ← Best quality for zoom
        fetch_format: "auto",
      };

      const result = await cloudinary.uploader.upload(dataUri, uploadOptions);
      console.log(`Upload successful on attempt ${attempt}`);
      return result;
      
    } catch (error) {
      lastError = error;
      
      // Safe logging
      console.warn(`Upload attempt ${attempt} failed:`, error?.message || error);
      
      // Simple retry logic - only retry on network issues
      const shouldRetry = attempt < maxRetries;
      
      if (shouldRetry) {
        const backoffTime = 2000 * attempt; // 2s, 4s, 6s
        console.log(`Retrying in ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      } else {
        break;
      }
    }
  }
  
  // Create a proper error message
  const errorMsg = lastError?.message || 'Upload failed after all retry attempts';
  throw new Error(errorMsg);
}

export async function newfeed(data) {
  const { text, images = [], video = null, file = null, email } = data;
  
  try {
    await connect_db();
    
    // Validation
    if (!text && images.length === 0 && !video && !file) {
      return  "Post cannot be empty. Please add text or media." ;
    }
    
    if (!text && (images.length > 0 || video || file)) {
      return  "Media posts must include text description." ;
    }

    let safetext = sanitizeHtml(text, {
      allowedTags: ["b", "i", "u", "em", "strong", "p", "br", "ul", "ol", "li", "blockquote", "h1", "h2", "a"],
      allowedAttributes: { a: ["href", "target"] },
    });

    let uploadedImages = [];
    let uploadedVideo = null;
    let uploadedFile = null;

    // Upload images (max 4 as you mentioned)
    if (images.length > 0) {
      console.log(`Uploading ${images.length} images...`);
      
      for (let i = 0; i < images.length; i++) {
        try {
          const result = await uploadFileToCloudinaryWithRetry(
            images[i], 
            "ray_social/images", 
            "image"
          );
          
          uploadedImages.push({
            url: result.secure_url,
            type: result.resource_type,
            size: result.bytes,
            name: result.original_filename|| img.name,
          });
          
          console.log(`Image ${i + 1}/${images.length} uploaded successfully`);
        } catch (error) {
          console.error(`Failed to upload image ${i + 1}:`, error.message);
          return { error: `Failed to upload image ${i + 1}. Please try again.` };
        }
      }
    }

    // Upload video (only if no images)
    else if (video) {
      try {
        console.log('Uploading video file...');
        const result = await uploadFileToCloudinaryWithRetry(
          video, 
          "ray_social/videos", 
          "video"
        );
        
        uploadedVideo = {
          url: result.secure_url,
          type: result.resource_type,
          size: result.bytes,
          name: result.original_filename|| video.name,
        };
        console.log('Video uploaded successfully');
      } catch (error) {
        console.error('Video upload failed:', error.message);
        return  "Video upload failed. Please check your internet connection and try again.";
      }
    }

    // Upload file (only if no images or video)
    else if (file) {
      try {
        console.log('Uploading document file...');
        const result = await uploadFileToCloudinaryWithRetry(
          file, 
          "ray_social/files", 
          "raw"
        );
        
        uploadedFile = {
          url: result.secure_url,
          type: result.resource_type,
          size: result.bytes,
          name: file.name,
        };
        console.log('File uploaded successfully');
      } catch (error) {
        console.error('File upload failed:', error.message);
        return "File upload failed. Please check your internet connection and try again." ;
      }
    }

    // Create post
    const db = await get_db();
    const result = await db.collection("posts").insertOne({
      email,
      content: safetext,
      images: uploadedImages,
      video: uploadedVideo,
      file: uploadedFile,
      createdAt: new Date(),
      likes: 0
    });

    console.log('Post created successfully with ID:', result.insertedId);
    return { insertedId: result.insertedId };

  } catch (error) {
    console.error("Post creation failed:", error);
    return { error: "Failed to create post. Please try again." };
  }
}