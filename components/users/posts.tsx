  "use client"
  import Image from "next/image"
  import { useRouter } from "next/navigation"
  import { useEffect, useState } from "react"
  import { toast } from "sonner"
  import { useRef } from "react"
  import {Card,CardContent,CardFooter,CardHeader} from "@/components/ui/card"
  import DOMPurify from "dompurify"
  import { Eye, Heart, MessageCircle, Share , Pause, Play , File} from "lucide-react"
  import { useInView } from 'react-intersection-observer'
  import { useInfiniteQuery } from '@tanstack/react-query'
  import PostsSkeleton from "./skeleton";
  import { UserAvatar } from "./userAvatar"
  interface mediaItem {
    url : string;
    name: string;
    
  }
  interface User {
  email: string;
  name: string;
  avatar: string;
}
  interface FeedPost {
    _id: string;
    email: string;
    avatar:string; 
    content: string;
    createdAt: string;
    likes: number;
    file: mediaItem| null;
    images: mediaItem [];
    video: mediaItem | null;
    userLiked: boolean;
    commentCount: number; 
    likedByFriends: User[];
  }
  interface PostsResponse {
    posts: FeedPost[];
    hasMore: boolean;
    currentPage: number;
  }
  interface Comment {
  _id: string;
  postId: string;
  user: User; 
  content: string;
  createdAt: string;
  likes: number;
  userLiked: boolean;
}


  export default function Page({ email }: { email: string  | null}) {
    // for the infinte scroll
    const [expandedContent, setExpandedContent] = useState<Record<string, boolean>>({});
    const [commentSection, setCommentSection] = useState<Record<string, boolean>>({});
    // const [commentText , setCommentText] = useState("");
    // const [commentList , setCommentList] = useState([]);
    const [commentInputs , setCommentInputs] = useState<Record<string, string>>({});
    const [copied, setCopied] = useState(false);
    const [feeds, setFeeds] = useState<FeedPost[]>([]);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    // Single source of truth for post states
      const [postStates, setPostStates] = useState<Record<string, { 
        likes: number; 
        userLiked: boolean;
        isUpdating: boolean;
        comments: Comment[];
        isAddingComment: boolean;
        commentCount: number; // Store count from post fetch
      }>>({});
    // for video play/pause
    const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
    const [videoStates, setVideoStates] = useState<{[key: string]: { isPlaying: boolean; showOverlay: boolean }}>({});

    // Helper function to set refs
    const setVideoRef = (postId: string) => (el: HTMLVideoElement | null) => {
      if (el) {
        videoRefs.current.set(postId, el);
      } else {
        videoRefs.current.delete(postId);
      }
    };

    const handleToggle = (postId: string) => {
      const vid = videoRefs.current.get(postId);
      if (!vid) return;

      if (vid.paused) {
        vid.play();
        setVideoStates(prev => ({
          ...prev,
          [postId]: { 
            isPlaying: true, 
            showOverlay: false 
          }
        }));
      } else {
        vid.pause();
        setVideoStates(prev => ({
          ...prev,
          [postId]: { 
            isPlaying: false, 
            showOverlay: true 
          }
        }));
      }
    };

    const handleMouseEnter = (postId: string) => {
      if (videoStates[postId]?.isPlaying) {
        setVideoStates(prev => ({
          ...prev,
          [postId]: { 
            ...prev[postId], 
            showOverlay: true 
          }
        }));
      }
    };
    const handleMouseLeave = (postId: string) => {
      if (videoStates[postId]?.isPlaying) {
        setVideoStates(prev => ({
          ...prev,
          [postId]: { 
            ...prev[postId], 
            showOverlay: false 
          }
        }));
      }
    };
    const handleVideoEnd = (postId: string) => {
      setVideoStates(prev => ({
        ...prev,
        [postId]: { 
          isPlaying: false, 
          showOverlay: true
        }
      }));
    };
    const router = useRouter();
        //fetch posts from the database
        // REPLACE your manual fetch with React Query
    const {
      data,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      isLoading,
    } = useInfiniteQuery({
      queryKey: ['posts', email],
      queryFn: async ({ pageParam = 1 }) => {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/feeds/allfeeds?email=${email}&page=${pageParam}&limit=5`);
        
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || "Unable to fetch posts");
        return;
        }
        
        return res.json();
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage: PostsResponse) => {
        return lastPage.hasMore ? lastPage.currentPage + 1 : undefined;
      },
      enabled: !!email,
    });

    // Simple intersection observer
    const { ref, inView } = useInView();

    useEffect(() => {
      if (inView && hasNextPage) {
        fetchNextPage();
      }
    }, [inView, hasNextPage, fetchNextPage]);

    
    
    // Initialize likedIds when data loads
  useEffect(() => {
    if (data) {
      const allPosts = data.pages.flatMap(page => page.posts);
      setFeeds(allPosts);
        
       // Initialize post states from server data
      const initialPostStates: Record<string, { likes: number; userLiked: boolean; isUpdating: boolean, comments: Comment[];isAddingComment: boolean; commentCount: number; }> = {};
      allPosts.forEach(post => {
        initialPostStates[post._id] = {
          likes: post.likes,
          userLiked: post.userLiked,
          isUpdating: false,
          comments: [], // Start with empty comments
          isAddingComment: false,
          commentCount: post.commentCount || 0
        };
      });
      setPostStates(initialPostStates);
    }
  }, [data]);
    
  // Custom hook for fetching comments
  // const useComments = (postId: string, enabled: boolean) => {
  //   return useQuery({
  //     queryKey: ['comments', postId],
  //     queryFn: async () => {
  //       const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  //       const res = await fetch(`${baseUrl}/api/feeds/allfeeds/comments?postId=${postId}&email=${email}`);
        
  //       if (!res.ok) {
  //         throw new Error('Failed to fetch comments');
  //       }
        
  //       return res.json();
  //     },
  //     enabled: enabled && !!postId, // Only fetch when enabled
  //     staleTime: 1000 * 60 * 5, // 5 minutes
  //   });
  // }
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
      const currentState = postStates[postId];
    if (!currentState || currentState.isUpdating) return;

    const currentLikes = currentState.likes;
    const currentlyLiked = currentState.userLiked;
       // Optimistic update
    setPostStates(prev => ({
      ...prev,
      [postId]: {
        likes: currentlyLiked ? currentLikes - 1 : currentLikes + 1,
        userLiked: !currentlyLiked,
        isUpdating: true,
        comments: currentState.comments, // explicitly include
      isAddingComment: currentState.isAddingComment, // explicitly include
      commentCount: currentState.commentCount // explicitly include
      }
    }));
      
    try {
      const baseUrl = process.env.NEXTAUTH_URL||'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/feeds/likepost`,{
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({postId , liked: !currentlyLiked, email}),     
      });
      if (!res.ok) {
        toast.error('failed to update like');
      }
       const data = await res.json(); 
         // Update with server response if available, otherwise keep optimistic state
      setPostStates(prev => ({
        ...prev,
        [postId]: {
          likes: data.likes ?? (currentlyLiked ? currentLikes - 1 : currentLikes + 1),
          userLiked: data.userLiked ?? !currentlyLiked,
          isUpdating: false,
          comments: currentState.comments, // explicitly include
      isAddingComment: currentState.isAddingComment, // explicitly include
      commentCount: currentState.commentCount // explicitly include
        }
      }));
    } catch (error) { 
      console.log(error)
      toast.error('failed to update like');
       setPostStates(prev => ({
        ...prev,
        [postId]: {
          ...currentState,
          isUpdating: false
        }
      }));
    }
    }
    const handleDownload = async (file: { url: string; name: string }| null) => {
      if (!file) {
          toast.error('File not available');
          return;
      }
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = file.name; // This will force the correct filename
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
    } catch (err) {
      console.log(err);
      toast.error('Download failed');
    }
  };
    // 👇 Show skeleton while loading
    if (isLoading) {
      return <PostsSkeleton count={5} />;
    }
    // Also show skeleton when fetching next page
    return (
      <div>
        
              {feeds.map((post , index) => { 
                const postState = postStates[post._id] || { 
                    likes: post.likes, 
                    userLiked: post.userLiked, 
                    isUpdating: false,
                    comments: [],
                    isAddingComment: false,
                    commentCount: post.commentCount 
                };
                const isLastPost = index ===feeds.length - 1;
                const fullText = post.content || "";
                const isExpanded = expandedContent[post._id] || false;
                const previewText =
                  fullText.length > 120 && !isExpanded
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
                  <Card className="w-full max-w-[34rem] mx-auto rounded-lg shadow border border-gray-200 bg-white mb-6 pt-2 pb-2" key={post._id}  ref={isLastPost ? ref : null}>
              {/* Someone liked/commented bar */}
              {post.likedByFriends.length > 0 && (
                <>
              <div className="w-full flex items-center flex-row gap-2 text-gray-500 text-sm py-2 px-3 sm:px-5 border-b border-gray-200">
               {/* For single like */}
              {post.likedByFriends.length === 1 && (
                  <div className="flex items-center gap-2">
                    <UserAvatar avatar={post.likedByFriends[0].avatar} email={post.likedByFriends[0].email} size={43} className=""/>
                    <span className="font-bold">{post.likedByFriends[0].name} liked this</span>
                  </div>
                )}

               {/* For multiple likes - show first 2-3 avatars */}
                {post.likedByFriends.length > 1 && (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {post.likedByFriends.slice(0, 3).map((friend) => (
                        <UserAvatar 
                          key={friend.email}
                          avatar={friend.avatar} 
                          email={friend.email} 
                          size={35}
                          className="border-2 border-white"
                        />
                      ))}
                    </div>
                   <span className="font-bold"> {post.likedByFriends[0].name} and {post.likedByFriends.length - 1} others liked this</span>
                  </div>
                )}
              </div>
              </>
              )}

              <CardHeader className="flex flex-row items-center gap-2 px-3 py-1 sm:px-5 sm:py-2">
                <UserAvatar 
                avatar={post.avatar}
                email={post.email} 
                size={48}
                className="border-2 border-gray-200"
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
                      onClick={() => setExpandedContent(prev => ({
                        ...prev,
                        [post._id]: !prev[post._id]
                      }))
                    }
                      className="ml-1 text-blue-600 hover:underline focus:outline-none"
                    >
                      {isExpanded ? "Read less" : "Read more"}
                    </button>
                  )}
                </div>

                <div className={`rounded-lg overflow-hidden ${post.images.length>1 ? "border border-gray-100" : ""} mb-2 p-2 px-4`}>
              {/* Images */}
              {post.images && post.images.length > 0 && (
                <div className="mt-2">
                  {post.images.length === 1 && (
                    <Image 
                      src={post.images[0].url} 
                      alt="Post media" 
                      className="rounded-lg w-full object-cover cursor-zoom-in" 
                      width={600} 
                      height={400}
                      onClick={() => setZoomedImage(post.images[0].url)}
                      unoptimized={true}
                    />
                  )}

                  {post.images.length === 2 && (
                    <div className="grid grid-cols-2 gap-3">
                      {post.images.map((img, i) => (
                        <Image 
                          key={i} 
                          src={img.url} 
                          alt="Post media" 
                          className="rounded-lg object-cover cursor-zoom-in" 
                          width={600} 
                          height={400}
                          onClick={() => setZoomedImage(img.url)}
                          unoptimized={true}
                        />
                      ))}
                    </div>
                  )}

                  {post.images.length === 3 && (
                    <div className="grid grid-cols-2 gap-3">
                      <Image
                        src={post.images[0].url}
                        alt="Post media"
                        className="rounded-lg col-span-1 row-span-2 object-cover cursor-zoom-in"
                        width={600} 
                        height={400}
                        onClick={() => setZoomedImage(post.images[0].url)}
                        unoptimized={true}
                      />
                      <div className="flex flex-col gap-2">
                        <Image 
                          src={post.images[1].url} 
                          alt="Post media" 
                          className="rounded-lg object-cover cursor-zoom-in" 
                          width={600} 
                          height={400}
                          onClick={() => setZoomedImage(post.images[1].url)}
                          unoptimized={true}
                        />
                        <Image 
                          src={post.images[2].url} 
                          alt="Post media" 
                          className="rounded-lg object-cover cursor-zoom-in" 
                          width={600} 
                          height={400}
                          onClick={() => setZoomedImage(post.images[2].url)}
                          unoptimized={true}
                        />
                      </div>
                    </div>
                  )}

                  {post.images.length >= 4 && (
                    <div className="grid grid-cols-2 gap-3">
                      {post.images.slice(0, 4).map((img, i) => (
                        <div key={i} className="relative">
                          <Image 
                            src={img.url} 
                            alt="Post media" 
                            className="rounded-lg object-cover w-full h-full cursor-zoom-in" 
                            width={600} 
                            height={400}
                            onClick={() => setZoomedImage(img.url)}
                            unoptimized={true}
                          />
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
                <div className="relative mt-2 rounded-lg overflow-hidden"  
                      onMouseEnter={() => handleMouseEnter(post._id)}
                    onMouseLeave={() => handleMouseLeave(post._id)}
                    >
                  <video
                    ref={setVideoRef(post._id)}
                    className="w-full rounded-lg"
                    src={post.video.url}
                    onClick={() => handleToggle(post._id)}
                    onEnded={() => handleVideoEnd(post._id)}
                
                  />
                  {(videoStates[post._id]?.showOverlay ?? true) && (
                    <button
                      onClick={() => handleToggle(post._id)}
                      className="absolute inset-0 flex items-center justify-center bg-black/20"
                    >
                      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-700/70 text-white text-2xl">
                        {videoStates[post._id]?.isPlaying ? <Pause /> : <Play />}
                      </div>
                    </button>
                  )}
                </div>
                
              )}

              {/* File */}
              {post.file && (
                <a
                  onClick={(e) => {
                        e.preventDefault();
                        handleDownload(post?.file);
                  }}
                  
                  className="block mt-2"
                >
                  <div className="flex flex-col items-center justify-center h-32 bg-gray-100 rounded-lg border border-gray-200"> {/* ← Added bg and border */}
                    <File className="text-3xl mb-2" strokeWidth={2} />
                    <span className="text-xs text-center truncate px-2">{post.file.name || "file"}</span>          
                  </div>          
                </a>
              )}

              {/* Zoom Modal */}
              {zoomedImage && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                  onClick={() => setZoomedImage(null)}
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                     src={zoomedImage} 
                    className="max-w-full max-h-full object-contain"
                    alt="Zoomed post image"
                    fill={true} // Use fill instead of width/height
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                    onClick={(e) => e.stopPropagation()}
                    unoptimized={true}
                    />
                    <button 
                      className="absolute top-4 right-4 text-white text-2xl bg-black/50 rounded-full w-10 h-10 flex items-center justify-center"
                      onClick={() => setZoomedImage(null)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>

                <div className="flex sm:flex-row justify-between items-start sm:items-center gap-2 text-gray-500 text-sm mb-1">
                  <span className="flex gap-1 items-center">
                    <Eye className="w-4 h-4" />
                    <span>46</span>
                  </span>
                  <span>{postState.likes } Likes / (22) comments</span>
                </div>

                <div className="border-t border-gray-200 my-1" />

                <div className="flex sm:flex-row justify-between items-stretch sm:items-center text-gray-600 font-medium text-sm gap-2 mt-4">
                  <button className="flex items-center gap-1 hover:text-blue-600 transition w-full sm:w-auto justify-center" onClick={()=>togglelike( post._id ) }>
                          <Heart className={`w-5 h-5 ${postState.userLiked ? "text-blue-600" : ""}`}
                                  fill={postState.userLiked ? "currentColor" : "none"} />
              {postState.userLiked ? "Liked" : "Like"}
                  </button>
                  <button className="flex items-center gap-1 hover:text-blue-600 transition w-full sm:w-auto justify-center"  onClick={() => setCommentSection(prev => ({
                        ...prev,
                        [post._id]: !prev[post._id]
                      }))}>
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
              {commentSection[post._id] && (
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
                  {postState.comments.map((comment) => (
                    <div key={comment._id}>
                      <div className="flex items-start gap-3">
                        <UserAvatar 
                          user={comment.user} 
                          size={36}
                          className="border border-gray-300"
                        />
                        <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
                          <span className="font-semibold text-sm text-gray-900">
                            {comment.user.name || comment.user.email}
                          </span>
                          <p className="text-gray-800 text-sm mt-0.5">{comment.content}</p>
                          <div className="flex gap-4 mt-1 text-xs text-gray-500">
                            <button className="hover:underline">Like</button>
                            <button className="hover:underline">Reply</button>
                            <span>{new Date(comment.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="border-b border-gray-200 my-2" />
                    </div>
                  ))}
                </div>
              </CardFooter>
            )}
            </Card>
                );
              })}
              {/* Show loading skeleton at the BOTTOM when fetching more */}
              {isFetchingNextPage && <PostsSkeleton count={3} />}

              {/* Show end message */}
              {!hasNextPage && feeds.length > 0 && (
                <p className="text-center text-gray-500 py-8">
                  🎉 You&apos;ve seen all posts!
                </p>
                  )}
      </div>
    )
  }