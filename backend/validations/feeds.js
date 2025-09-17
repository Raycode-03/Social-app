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

  if (plainText.trim().length > 2500) {
    return { error: "Text is too long (max 2500 characters)." };
  }
// images
    if (!Array.isArray(images)) return "Images must be an array.";
    // Remove invalid entries (empty File objects, null, undefined)
    const validImages = images.filter(img => img && img.size > 0);
    if (validImages.length > 4) return "You can only post 4 Images.";

    
  
}
  return null;