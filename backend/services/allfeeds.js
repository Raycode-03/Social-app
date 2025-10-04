import { connect_db, get_db } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export  async function allfeeds(email) {
  await connect_db();
  const db = get_db();

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

  // user’s own posts
  const userPosts = await db.collection('posts')
    .find({ email })
    .sort({ createdAt: -1 })
    .toArray();

  // posts by friends
  const friendsPosts = await db.collection('posts')
    .find({ email: { $in: friendEmails } })
    .sort({ createdAt: -1 })
    .toArray();

  // // posts the user liked
  const userLikes = await db.collection('likes')
    .find({ email })
    .toArray();
  
  const likedPostIds = userLikes.map(l => l.postId);
  const likedPostIdsStr = likedPostIds.map(id => id.toString());
  console.log(likedPostIdsStr, "likedPostIds")
  const postsUserLiked = await db.collection('posts')
    .find({ _id: {$in:  likedPostIds } })
    .sort({ createdAt: -1 })
    .toArray();
  
  // // posts friends liked
  const friendLikes = await db.collection('likes')
    .find({ email: { $in: friendEmails } })
    .toArray();
  const postsFriendLiked = await db.collection('posts')
    .find({ _id: { $in: friendLikes.map(l => l.postId) } })
    .sort({ createdAt: -1 })
    .toArray();
  const combined=[
      ...userPosts,
  ...friendsPosts,
  ...postsUserLiked,
  ...postsFriendLiked,  
  ];
  const unique = Array.from(new Map(combined.map(p => [p._id.toString(),
      {...p, userLiked: likedPostIdsStr.includes(p._id.toString())}])
      
  ).values()
);
  unique.sort((a,b)=>b.createdAt-a.createdAt);
  
// return posts with their media files intact
  return unique.map(post => ({
    ...post,
    images: post.images || [],
    video: post.video || null,
    file: post.file || null,
  }));
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
