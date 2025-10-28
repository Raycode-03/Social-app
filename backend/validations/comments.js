import validator from "validator"
export function newcommentvalidate(data) {
    const { content, postId, email } = data;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return 'Content cannot be empty.';
    }
    if(content.length > 200) {
        return 'Content cannot exceed 200 characters.';
    }
    if (!postId || typeof postId !== 'string' || !validator.isMongoId(postId)) {
        return 'A valid postId is required.';
    }
    if (!email || typeof email !== 'string' || !validator.isEmail(email)) {
        return 'A valid email is required.';
    }
    return null; // No validation errors
}