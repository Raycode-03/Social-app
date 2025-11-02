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
            return  'User not found';
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
        await db.collection("posts").updateOne({_id : new ObjectId(postId)} , {$inc:{comments: 1}})
        return{
          _id: result.insertedId,
          postId,
          content,
          createdAt: commentDoc.createdAt,
          likes: 0,
          userLiked: false,
          user: {
            email: user.email,
            name: user.name || user.email.split('@')[0],
            avatar: user.image
          }
        };
    } catch (error) {
        console.error("Error adding comment:", error);
        return { error: 'Failed to add comment' };
    }
}
export async function  likecomment(commentId , liked , email){
  await connect_db(); 
  const db = get_db();
  try {
  const incValue = liked ? 1 : -1;
  const comment_doc = await db.collection("comments").findOne({ _id : new ObjectId(commentId) });
  if(!comment_doc) return "Comment not found";
  
     await db.collection("comments").updateOne(
    { _id: new ObjectId(commentId) },
    { $inc: { likes: incValue } }  // usually pass like = 1 to add a like
    
  );
  // Optional: keep a record of who liked it
  if (liked) {
    await db.collection("comment_likes").insertOne({
      commentId: new ObjectId(commentId),
      email,
      createdAt: new Date(),
    });
  } else {
    // if unliking, optionally remove their like record
    await db.collection("comment_likes").deleteOne({
      commentId: new ObjectId(commentId),
      email
    });
  }
  //  then get the total likes to show to the users 
  const totalLikes = comment_doc.comments || 0
  
  return { totalLikes };
  } catch (error) {
    console.error("Error updating like:", error);
  }
}