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

async function uploadFileToCloudinary(file, folder, resourceType = "auto") {
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
const limitpostsubmit=async (email ,limit)=>{
    const useremail= await get_db().collection("users").findOne({email}) || null;
    const postlimitperday= useremail.limit;
    if(postlimitperday<=3){
      
    }else{
      return {error:"You have reached your daily post limit. Please try again tomorrow."};
    }
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
     // Upload images to Cloudinary
  let uploadedImages = [];
  if (images.length > 0) {
    for (const img of images) {
      const result =await uploadFileToCloudinary(img, "ray_social/images");
      uploadedImages.push({
        url: result.secure_url,
        type: result.resource_type,
        size: result.bytes,
        name: result.original_filename,
      });
    }
  }

  // Upload video
  let uploadedVideo = null;
  if (video) {
    const result = await uploadFileToCloudinary(video, "ray_social/videos", "video");
    uploadedVideo = {
      url: result.secure_url,
      type: result.resource_type,
      size: result.bytes,
      name: result.original_filename,
    };
  }

  // Upload file (PDFs, docs, etc.)
  let uploadedFile = null;
  if (file) {
    const result = await uploadFileToCloudinary(file, "ray_social/files", "raw");
    uploadedFile = {  
      url: result.secure_url,
      type: result.resource_type,
      size: result.bytes,
      name: result.original_filename,
    };
  }

    const db = await get_db()
    const result = await db.collection("posts").insertOne({email ,content:text ,images: uploadedImages, video: uploadedVideo,file: uploadedFile, createdAt : new Date()});

    return { insertedId: result.insertedId };

}