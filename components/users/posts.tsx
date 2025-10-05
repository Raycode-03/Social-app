"use client"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import DOMPurify from "dompurify"
import { Eye, Heart, MessageCircle, Share , Pause, Play} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useRef } from "react"
interface mediaItem {
  url : string;
}
interface FeedPost {
  _id: string;
  email: string;
  content: string;
  createdAt: string;
  likes: number;
  file: mediaItem| null;
  images: mediaItem [];
  video: mediaItem | null;
  userLiked: boolean;
  // add other fields as needed (images, comments, etc.)
}
export default function Page({ email }: { email: string  | null}) {
  
  const [expanded, setExpanded] = useState(false);
  const [likedIds, setLikedIds] = useState<string[]>([]); 
  const [commentSection, setCommentSection] = useState(false)
  const [copied, setCopied] = useState(false);
  const [feeds, setFeeds] = useState<FeedPost[]>([]);
  const [feedLikes, setFeedLikes] = useState<Record<string, number>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
   const [showOverlay, setShowOverlay] = useState(true);
   const [isPlaying, setIsPlaying] = useState(false);

   
  const handleToggle = () => {
    const vid = videoRef.current;
    if (!vid) return;

    if (vid.paused) {
      vid.play();
      setIsPlaying(true);
      setShowOverlay(false);

    } else {
      vid.pause();
      setIsPlaying(false);
      setShowOverlay(true);
    }
  };
  const router = useRouter();
      //fetch posts from the database
      useEffect(() => {
        const fetchfeeds= async()=>{
          try {
            const baseUrl = process.env.NEXTAUTH_URL||'http://localhost:3000';
        const res =await fetch(`${baseUrl}/api/feeds/allfeeds?email=${email}`,{
            method: "GET",
    })
      const data = await res.json();
        if (res.status === 401) {
          router.push("/auth/login");
        }
        if (!res.ok) {
          toast.error(data.error || "Unable to post");
          return;
        }
        setFeeds(data)
         // ✅ Pre-populate likedIds from server response
        const liked = data.filter((post: FeedPost) => post.userLiked).map((post: FeedPost) => post._id);
        setLikedIds(liked);
          } catch (err) {
            console.log(err);
            toast.error("Unable to fetch posts");
          }
        }
         fetchfeeds();
  }, [email]);
  // socket for real-time updates
// useEffect(() => {
//   socket.on("postLiked", (data) => {
//     // Update the local state or refetch data as needed
//     console.log("Post liked:", data);
//   });
//   return () => {
//     socket.disconnect();
//   };
// }, []);

 const handleShare = async (postId : string) => {
    const shareUrl = `${window.location.origin}/feeds/post/${postId}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const togglelike = async (postId : string , )=> {
    
    const alreadyliked = likedIds.includes(postId) ;
    if (alreadyliked) {
      setLikedIds(prev => prev.filter(id => id !== postId));   // remove
        setFeedLikes(prev => ({
    ...prev,
    [postId]: (prev[postId] ?? feeds.find(p=>p._id===postId)?.likes ?? 0)
             + (alreadyliked ? -1 : 1)
  }));
    } else {
      setLikedIds(prev => [...prev, postId]);  // add
      setFeedLikes(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
    }
    
  try {
    const baseUrl = process.env.NEXTAUTH_URL||'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/feeds/likepost`,{
      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({postId , liked: !alreadyliked, email}),     
    })
    const data_likes= await res.json();
  } catch (error) { 
    console.log(error)
    toast.error('failed to update like');
     if (alreadyliked) {
      setLikedIds(prev => [...prev, postId]);
      setFeedLikes(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
    } else {
      setLikedIds(prev => prev.filter(id => id !== postId));
      setFeedLikes(prev => ({ ...prev, [postId]: (prev[postId] || 1) - 1 }));
    }
    
  }
  }
  return (
    <div>
      {feeds.map(post => {
        const isliked = likedIds.includes(post._id);  
        const fullText = post.content || "";
        const previewText =
          fullText.length > 120 && !expanded
            ? fullText.slice(0, 120) + "..."
            : fullText;
          // ✅ sanitize here
          const clean = DOMPurify.sanitize(previewText, {
            ALLOWED_TAGS: [
              "b", "i", "u", "em", "strong",
              "p", "br",
              "ul", "ol", "li",
              "blockquote",
              "h1", "h2",
              "a"
            ],
            ALLOWED_ATTR: ["href", "target"],
          });
        return (
          <Card className="w-full max-w-[34rem] mx-auto rounded-lg shadow border border-gray-200 bg-white mb-6 pt-2 pb-2" key={post._id}>
      {/* Someone liked/commented bar */}
      <div className="w-full flex items-center gap-2 text-gray-500 text-sm py-2 px-3 sm:px-5 border-b border-gray-200">
        <Image
          src="/logos/bake.jpg"   
          alt="User avatar"
          width={28}
          height={28}
          className="rounded-full border w-8 h-8"
        />
        <span className="truncate">Emmanuel Lucius commented on this</span>
      </div>

      <CardHeader className="flex flex-row items-center gap-2 px-3 py-1 sm:px-5 sm:py-2">
        <Image
          src="/logos/bake.jpg"
          alt="User avatar"
          width={48}
          height={48}
          className="rounded-full border w-15 h-15 object-fill"
        />
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 text-base">{post.email}</span>
          <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</span>
        </div>
      </CardHeader>

      <CardContent className="px-3 py-2 sm:px-5 sm:py-3">
        <div className="text-gray-900 text-[15px] leading-relaxed mb-2 break-words" 
          dangerouslySetInnerHTML={{ __html: clean }}
        />
          <div>
            
          {fullText.length > 120 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-1 text-blue-600 hover:underline focus:outline-none"
            >
              {expanded ? "Read less" : "Read more"}
            </button>
          )}
        </div>

        <div className={`rounded-lg overflow-hidden ${post.video ? "" : "border border-gray-100"}  mb-2`}>
              {/* Images */}
            {post.images && post.images.length > 0 && (
              <div className="mt-2">
                {post.images.length === 1 && (
                  <Image src={post.images[0].url} alt="Post media" className="rounded-lg w-full object-cover"  width={600} height={400}/>
                )}

                {post.images.length === 2 && (
                  <div className="grid grid-cols-2 gap-2">
                    {post.images.map((img, i) => (
                      <Image key={i} src={img.url} alt="Post media" className="rounded-lg object-cover" width={600} height={400}/>
                    ))}
                  </div>
                )}

                {post.images.length === 3 && (
                  <div className="grid grid-cols-2 gap-2">
                    <Image
                      src={post.images[0].url}
                      alt="Post media"
                      className="rounded-lg col-span-1 row-span-2 object-cover" 
                      width={600} height={400}
                    />
                    <div className="flex flex-col gap-2">
                      <Image src={post.images[1].url} alt="Post media" className="rounded-lg object-cover" width={600} height={400}/>
                      <Image src={post.images[2].url} alt="Post media" className="rounded-lg object-cover" width={600} height={400}/>
                    </div>
                  </div>
                )}

                {post.images.length >= 4 && (
              <div className="grid grid-cols-2 gap-2">
                {post.images.slice(0, 4).map((img, i) => (
                  <div key={i} className="relative">
                    <Image src={img.url} alt="Post media" className="rounded-lg object-cover w-full h-full" width={600} height={400}/>
                    {i === 3 && post.images.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-lg font-semibold rounded-lg">
                        +{post.images.length - 4}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
                
              </div>
            )}


            {/* Video */}
          {post.video && (
  <div className="relative mt-2 rounded-lg overflow-hidden"  onMouseEnter={() => isPlaying && setShowOverlay(true)}
        onMouseLeave={() => isPlaying && setShowOverlay(false)}>
    <video
      ref={videoRef}
      className="w-full rounded-lg"
      src={post.video.url}
      onClick={handleToggle}
    />

    {/* Center overlay button */}
    {showOverlay && (
       <button
            onClick={handleToggle}
            className="absolute inset-0 flex items-center justify-center bg-black/20"
          >
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-700/70 text-white text-2xl">
              {isPlaying ? <Pause /> : <Play />}
            </div>
          </button>
    )}
  </div>
)}


            {/* File */}
            {post.file && (
              <a
                href={post.file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-blue-600 underline"
              >
                📄 Download file
              </a>
            )}
              
        </div>

        <div className="flex sm:flex-row justify-between items-start sm:items-center gap-2 text-gray-500 text-sm mb-1">
          <span className="flex gap-1 items-center">
            <Eye className="w-4 h-4" />
            <span>46</span>
          </span>
          <span>{feedLikes[post._id]??post.likes ?? 0 } Likes / (22) comments</span>
        </div>

        <div className="border-t border-gray-200 my-1" />

        <div className="flex sm:flex-row justify-between items-stretch sm:items-center text-gray-600 font-medium text-sm gap-2 mt-4">
          <button className="flex items-center gap-1 hover:text-blue-600 transition w-full sm:w-auto justify-center" onClick={()=>togglelike( post._id ) }>
                  <Heart className={`w-5 h-5 ${isliked ? "text-blue-600" : ""}`}
                          fill={isliked ? "currentColor" : "none"} />
      {isliked ? "Liked" : "Like"}
          </button>
          <button className="flex items-center gap-1 hover:text-blue-600 transition w-full sm:w-auto justify-center" onClick={() => setCommentSection(!commentSection)} >
            <MessageCircle className="w-5 h-5" /> Comment
          </button>
          <div className="relative flex items-center w-full sm:w-auto justify-center">
          <button
            className="flex items-center gap-1 hover:text-blue-600 transition w-full sm:w-auto justify-center"
            onClick={()=>handleShare(post._id)}
            title="Copy post link"
          >
            <Share className="w-5 h-5" /> Share
          </button>
          {copied && (
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 shadow">
              Copied!
            </span>
          )}
        </div>
        </div>
      </CardContent>
      {commentSection && (
         <CardFooter className="flex flex-col gap-3 border-t border-gray-200 p-4">
          <div className="send flex flex-row items-center gap-2 w-full">
            {/* Comment input */}
          <textarea
  className="w-full h-10 border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
  placeholder="Write a comment..."
  maxLength={200}
/>
          {/* Post button */}
          <button className="self-end px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            Send
          </button>
          </div>

          {/* Example comment list */}
          <div className="w-full space-y-3 mt-2">
  {/* Comment 1 */}
  <div className="flex items-start gap-3">
    <Image
      src="/logos/bake.jpg"
      alt="Jane's avatar"
      width={30}
      height={30}
      className="rounded-full border w-13 h-13 object-fill"
    />
    <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
      <span className="font-semibold text-sm text-gray-900">Jane</span>
      <p className="text-gray-800 text-sm mt-0.5">Nice post!</p>
      <div className="flex gap-4 mt-1 text-xs text-gray-500">
        <button className="hover:underline">Like</button>
        <button className="hover:underline">Reply</button>
        <span>2h</span>
      </div>
    </div>
  </div>
  {/* Divider */}
  <div className="border-b border-gray-200" />

  {/* Comment 2 */}
  <div className="flex items-start gap-3">
    <Image
      src="/logos/bake.jpg"
      alt="John's avatar"
      width={30}
      height={30}
      className="rounded-full border w-12 h-12"
    />
    <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
      <span className="font-semibold text-sm text-gray-900">John</span>
      <p className="text-gray-800 text-sm mt-0.5">I agree 👍</p>
      <div className="flex gap-4 mt-1 text-xs text-gray-500">
        <button className="hover:underline">Like</button>
        <button className="hover:underline">Reply</button>
        <span>1h</span>
      </div>
    </div>
  </div>
</div>
        </CardFooter>
      )}
      
    </Card>
        );
      })}
    </div>
  )
}
