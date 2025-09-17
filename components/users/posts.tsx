"use client"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Eye, Heart, MessageCircle, Share } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { toast } from "sonner"
interface FeedPost {
  _id: string;
  email: string;
  content: string;
  createdAt: string;
  likes: number;
  // add other fields as needed (images, comments, etc.)
}
export default function Page({ email }: { email: string  | null}) {
  const [expanded, setExpanded] = useState(false);
  const [liked , setliked]  = useState(false);
  const [commentSection, setCommentSection] = useState(false)
  const [copied, setCopied] = useState(false);
  const postId = "1234567890"; // Replace with your real post ID
  const [feeds, setFeeds] = useState<FeedPost[]>([]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/feeds/post/${postId}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  
      //fetch posts from the database
      useEffect(() => {
        const fetchfeeds= async()=>{
          try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const res =await fetch(`${baseUrl}/api/feeds/allfeeds?email=${email}`,{
            method: "GET",
    })
      const data = await res.json();
      
        if (!res.ok) {
          toast.error(data.error || "Unable to post");
          return;
        }
        setFeeds(data)
          } catch (err) {
            console.log(err)
            toast.error("Unable to fetch posts");
          }
        }
         fetchfeeds();
  }, []);

  return (
    <div>
      {feeds.map(post => {
        const fullText = post.content || "";
        const previewText =
          fullText.length > 120 && !expanded
            ? fullText.slice(0, 120) + "..."
            : fullText;

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
        <div className="text-gray-900 text-[15px] leading-relaxed mb-2 break-words">
          {previewText}
          {fullText.length > 120 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-1 text-blue-600 hover:underline focus:outline-none"
            >
              {expanded ? "Read less" : "Read more"}
            </button>
          )}
        </div>

        <div className="rounded-lg overflow-hidden border border-gray-100 mb-2">
          <Image
            src="/logos/bake.jpg"
            alt="Post media"
            width={400}
            height={200}
            className="object-cover w-full h-40 sm:h-48"
          />
        </div>

        <div className="flex sm:flex-row justify-between items-start sm:items-center gap-2 text-gray-500 text-sm mb-1">
          <span className="flex gap-1 items-center">
            <Eye className="w-4 h-4" />
            <span>46</span>
          </span>
          <span>({post.likes}) Likes / (22) comments</span>
        </div>

        <div className="border-t border-gray-200 my-1" />

        <div className="flex sm:flex-row justify-between items-stretch sm:items-center text-gray-600 font-medium text-sm gap-2 mt-4">
          <button className="flex items-center gap-1 hover:text-blue-600 transition w-full sm:w-auto justify-center" onClick={()=>setliked(!liked)}>
                  <Heart className={`w-5 h-5 ${liked ? "text-blue-600" : ""}`}
                          fill={liked ? "currentColor" : "none"} />
      {liked ? "Liked" : "Like"}
          </button>
          <button className="flex items-center gap-1 hover:text-blue-600 transition w-full sm:w-auto justify-center" onClick={() => setCommentSection(!commentSection)} >
            <MessageCircle className="w-5 h-5" /> Comment
          </button>
          <div className="relative flex items-center w-full sm:w-auto justify-center">
          <button
            className="flex items-center gap-1 hover:text-blue-600 transition w-full sm:w-auto justify-center"
            onClick={handleShare}
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
