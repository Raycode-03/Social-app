import { connect_db, get_db } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function allfeeds(email, page, limit) {
  await connect_db();
  const db = get_db();

  const skip = (page - 1) * limit;
  
  // user document
  const user = await db.collection('users').findOne({ email });
  if (!user) throw new Error('User not found');
  const userId = user._id;
    
  // friend IDs
  const friendsDocs = await db.collection('friends')
    .find({ userId })
    .toArray();
  const friendIds = friendsDocs.map(f => f.friendId);
    
  // friends' emails
  const friendUsers = await db.collection('users')
    .find({ _id: { $in: friendIds } })
    .project({ email: 1 })
    .toArray();
  const friendEmails = friendUsers.map(u => u.email);

  // REMOVE skip/limit from individual queries - get ALL relevant posts
  const userPosts = await db.collection('posts')
    .find({ email })
    .sort({ createdAt: -1 })
    .toArray();

  const friendsPosts = await db.collection('posts')
    .find({ email: { $in: friendEmails } })
    .sort({ createdAt: -1 })
    .toArray();

  const userLikes = await db.collection('likes')
    .find({ email })
    .toArray();
  
  const likedPostIds = userLikes.map(l => l.postId);
  const likedPostIdsStr = likedPostIds.map(id => id.toString());

  const postsUserLiked = await db.collection('posts')
    .find({ _id: {$in: likedPostIds } })
    .sort({ createdAt: -1 })
    .toArray();
  
  const friendLikes = await db.collection('likes')
    .find({ email: { $in: friendEmails } })
    .toArray();
  
  const postsFriendLiked = await db.collection('posts')
    .find({ _id: { $in: friendLikes.map(l => l.postId) } })
    .sort({ createdAt: -1 })
    .toArray();

  const combined = [
    ...userPosts,
    ...friendsPosts,
    ...postsUserLiked,
    ...postsFriendLiked,  
  ];

  // Remove duplicates by _id
  const uniquePostsMap = new Map();
  combined.forEach(post => {
    const postId = post._id.toString();
    if (!uniquePostsMap.has(postId)) {
      uniquePostsMap.set(postId, {
        ...post,
        userLiked: likedPostIdsStr.includes(postId)
      });
    }
  });

  const unique = Array.from(uniquePostsMap.values());
  unique.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Apply pagination AFTER combining and removing duplicates
  const startIndex = skip;
  const endIndex = startIndex + limit;
  const resultPosts = unique.slice(startIndex, endIndex);
  const hasMore = endIndex < unique.length;
  
  // After creating resultPosts, check for duplicates:
  const postIds = resultPosts.map(p => p._id.toString());
  const duplicateIds = postIds.filter((id, index) => postIds.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    console.log('DUPLICATE IDs FOUND:', duplicateIds);
  }
  return {
    posts: resultPosts.map(post => ({
      ...post,
      images: post.images || [],
      video: post.video || null,
      file: post.file || null,
    })),
    hasMore,
    currentPage: page,
    totalPosts: unique.length // For debugging
  };
}
export async function  likepost(postId , liked , email){
  await connect_db(); 
  const db = get_db();
  console.log(liked)
  const incValue = liked ? 1 : -1;
  
  const posts_doc = await db.collection("posts").findOne({ _id : new ObjectId(postId) });
  if(!posts_doc) return {error:"Post not found"};
  console.log(incValue, " incValue")
    const updateResult = await db.collection("posts").updateOne(
    { _id: new ObjectId(postId) },
    { $inc: { likes: incValue } }  // usually pass like = 1 to add a like
    
  );
  // Optional: keep a record of who liked it
  if (liked) {
    await db.collection("likes").insertOne({
      postId: new ObjectId(postId),
      email,
      createdAt: new Date(),
    });
  } else {
    // if unliking, optionally remove their like record
    await db.collection("likes").deleteOne({
      postId: new ObjectId(postId),
      email
    });
  }
  //  then get the total likes to show to the users 
  const totalLikes = posts_doc.likes || 0
  
  return { totalLikes };
}
