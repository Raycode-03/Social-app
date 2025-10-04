import validator from "validator"

export function keywordsvalidate(data) {
    const {keywords} = data 
    if ( ! validator.isString(keywords)){
        return "Keywords is not a string"
    }
}


function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ""); // remove all tags
}
export function newfeedsvaildate(data){
    const {text , images =[],  email, video, file} = data;
    // config/limits.js
    const MAX_TEXT_LENGTH = 2500;
    const MAX_IMAGE_COUNT = 4;
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
    const ALLOWED_FILE_TYPES = [
      "application/pdf",
      "text/plain",
      "application/msword"
    ];

     // Check if email exists and is a non-empty string before validating
  if (email && typeof email === 'string' && email.trim() !== '') {
    if (!validator.isEmail(email)) {
      return "Invalid email format";
    }
  }
    // Check media count
    const mediacount = (images.length >0? 1 : 0) + (video ? 1:0) + (file ? 1: 0);
    if(mediacount>1)   return "You can only post one type either images or video or a file not mutliple types.";
    // Text validation
      const plainText = stripHtml(text);
    if (typeof text !== "string") {
    return { error: "Text is not a string." };
  }
  if (!plainText.trim() && images.length === 0 && !video && !file) {
    return { error: "Post cannot be empty. Please add text or media." };
  }

  if (plainText.trim().length > MAX_TEXT_LENGTH) {
    return { error: "Text is too long (max 2500 characters)." };
  }
// images
    if (!Array.isArray(images)) return "Images must be an array.";
    // Remove invalid entries (empty File objects, null, undefined)
    const validImages = images.filter(img => img && img.size > 0);
    if (validImages.length > MAX_IMAGE_COUNT) return `You can only post ${MAX_IMAGE_COUNT} Images.`;
  for (const img of validImages) {
    if (!ALLOWED_IMAGE_TYPES.includes(img.type)) {
      return { error: `Unsupported image type: ${img.type}` };
    }
    if (img.size > MAX_IMAGE_SIZE) {
      return { error: `Image size exceeds ${MAX_IMAGE_SIZE / (1024 * 1024)}MB.` };
    }
  }

  // ✅ File validation
  if (file) {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { error: `Unsupported file type: ${file.type}` };
    }
  }
    
   return null;
}
 