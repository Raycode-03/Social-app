import { connect_db, get_db } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function allcomments(postId) {
    await connect_db();
    const db = get_db();  
    
    const comments = await db.collection('comments')
        .find({ postId: new ObjectId(postId) })
        .sort({ createdAt: -1 })
        .toArray();
        // get user info from users collection
    const userIds = comments.map(comment => comment.userId);
    const users = await db.collection('users')
        .find({ _id: { $in: userIds } })
        .toArray();
    const userMap = new Map();
    await users.forEach(user => {
        userMap.set(user._id.toString(), {
            email: user.email,
            name: user.name,
            avatar: user.image || user.email.charAt(0).toUpperCase() // ✅ Use first letter of email as fallback
        });
    });
    // attach user info to comments
    comments.forEach(comment => {
        const user = userMap.get(comment.userId.toString());
        comment.user = user;
    });
    
    return comments;
};
export async function newcomment(data) {
    await connect_db();
    const db = get_db();
    try {
        const { content, postId, email } = data;
        // get user
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            return { error: 'User not found' };
        }
       const userId = user._id;
        // create comment document
        const commentDoc = {
            postId: new ObjectId(postId),
            content,
            userId,
            likes: 0,
            createdAt: new Date()
        };
        const result = await db.collection('comments').insertOne(commentDoc);
        return { success: true, commentId: result.insertedId };
    } catch (error) {
        console.error("Error adding comment:", error);
        return { error: 'Failed to add comment' };
    }
}