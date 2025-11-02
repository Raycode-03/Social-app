  "use client"
  import Image from "next/image"
  import { useRouter } from "next/navigation"
  import { useEffect, useState } from "react"
  import { toast } from "sonner"
  import { useRef } from "react"
  import {Card,CardContent,CardFooter,CardHeader} from "@/components/ui/card"
  import DOMPurify from "dompurify"
  import { formatDistanceToNow } from 'date-fns';
  import { Eye, Heart, MessageCircle, Share , Pause, Play , File} from "lucide-react"
  import { useInView } from 'react-intersection-observer'
  import { useInfiniteQuery } from '@tanstack/react-query'
  import {PostsSkeleton} from "./skeleton";
  import {PostsSkeletonComment} from "./skeleton";
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
    comments: number; 
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
  isOpen:boolean;
  user: User; 
  content: string;
  email:string;
  createdAt:string;
  likes: number;
  userLiked: boolean; 
}
interface NavbarProps {
    user?: {
        id: string;
        name?: string | null;
        email?: string | null;
        avatar?: string;
        isAdmin: boolean;
        packageType: string;
    }
}

  export default function Page( {user}: NavbarProps) {
    const email = user?.email || "";
    // for the infinte scroll
    const [expandedContent, setExpandedContent] = useState<Record<string, boolean>>({});
    const [commentSection, setCommentSection] = useState<Record<string, boolean>>({});
    const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
    const [sendingComments, setSendingComments] = useState(false);
    const [commentData, setCommentData] = useState<Record<string, Comment[]>>({});
    const [commentText , setCommentText] = useState("");
    const [commentLikes , setCommentLikes] = useState<Record<string, boolean>>({});
    const [commentLikeCounts, setCommentLikeCounts] = useState<Record<string, number>>({});
    const [copied, setCopied] = useState(false);
    const [feeds, setFeeds] = useState<FeedPost[]>([]);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    // Single source of truth for post states
      const [postStates, setPostStates] = useState<Record<string, { 
        likes: number; 
        userLiked: boolean;
        isUpdating: boolean;
        comments : number;
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
          try {
            
         
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
         } catch (err) {
            console.log(err);
            toast.error('Network error. Trying again...');
            throw err; // important for React Query to handle retries
          }
      },
      
      initialPageParam: 1,
      getNextPageParam: (lastPage: PostsResponse) => {
        return lastPage.hasMore ? lastPage.currentPage + 1 : undefined;
      },
      enabled: !!email,
      staleTime: 1000 * 60 * 2, // ✅ cache for 2 minutes
      refetchOnWindowFocus: false,
    });

    // Simple intersection observer
    const { ref, inView } = useInView();
    useEffect(() => {
      if (inView && hasNextPage && !isFetchingNextPage ) {
        fetchNextPage().catch((err) => {
          console.error('Pagination fetch failed:', err);
          toast.error('Could not load more posts. Check your connection.');
    });
      }
    }, [inView, hasNextPage, fetchNextPage , isFetchingNextPage]);
    // Custom hook for fetching comments
   const fetchComments = async (postId: string) => {
  setLoadingComments(prev => ({ ...prev, [postId]: true }));
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/feeds/comments`, {
      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ postId }),     
    });
    const data = await res.json();
    
    if (!res.ok) {
      toast.error(data.error || "Unable to fetch comments");
      return;
    }
    
    setCommentData(prev => ({
      ...prev,
      [postId]: data || []
    }));
    
    // Initialize like state per comment
    const newCommentLikes: Record<string, boolean> = {};
    const newCommentLikeCounts: Record<string, number> = {};

    (data || []).forEach((comment: any) => {
      newCommentLikes[comment._id] = comment.userLiked || false;
      newCommentLikeCounts[comment._id] = comment.likes || 0;
    });

    setCommentLikes(prev => ({ ...prev, ...newCommentLikes }));
    setCommentLikeCounts(prev => ({ ...prev, ...newCommentLikeCounts }));
  } catch (err) {
    toast.error("Failed to fetch comments");
    console.log(err);
  } finally {
    setLoadingComments(prev => ({ ...prev, [postId]: false }));
  }
};

// Then use it in both places
useEffect(() => {
  Object.keys(commentSection).forEach(postId => {
    if (commentSection[postId] && !commentData[postId]) {
      fetchComments(postId);
    }
  });
}, [commentSection]);

  // send a comment
  const handleSubmitComment = async(postId: string) =>{
   if (!commentText.trim()) {
    toast.error("Comment cannot be empty");
    return;
  }
  setSendingComments(true);
    // Create a temporary comment for optimistic UI
    const tempId = 'temp-' + Date.now();
    const newComment: Comment = {
    _id: tempId,
    postId,
    isOpen: false,
    content: commentText,
    email,
    createdAt: new Date().toISOString(),
    likes: 0,
    userLiked: false,
    user:{
      email: email,
      name: email.split('@')[0],
      avatar: '',
    }
  } as Comment; // tell TypeScript it’s a Comment

  // Optimistically add the new comment to the UI
   setCommentData(prev => ({
    ...prev,
    [postId]: [ newComment , ...(prev[postId] || [])],
  }));


  // Optionally initialize like states for the new comment
  setCommentLikes(prev => ({ ...prev, [tempId]: false }));
  setCommentLikeCounts(prev => ({ ...prev, [tempId]: 0 }));

  // Clear input immediately for better UX
  setCommentText('');

  
  try {
    const res = await fetch(`/api/feeds/newcomment`, {
      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ content: commentText, postId: postId, email })
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to send comment");
      return;
    }
    toast.success("Comment posted!");
    // Replace temporary comment with real one from server
     setCommentData(prev => ({
      ...prev,
      [postId]: prev[postId].map(c => (c._id === tempId ? data : c)),
    }));
    toast.success('Comment posted!');
  } catch (error) {
      console.log(error);
      toast.error("Failed to send comment")
      setCommentData(prev => ({
        ...prev,
        [postId]: prev[postId].filter(c => c._id !== tempId),
      }));
    }
    finally{
      setSendingComments(false);
    }
  }
    // Initialize likedIds when data loads
  useEffect(() => {
    if (data) {
      const allPosts = data.pages.flatMap(page => page.posts);
      setFeeds(allPosts);
        
       // Initialize post states from server data
      const initialPostStates: Record<string, { likes: number; userLiked: boolean; isUpdating: boolean , comments : number }> = {};
      allPosts.forEach(post => {
        initialPostStates[post._id] = {
          likes: post.likes,
          userLiked: post.userLiked,
          isUpdating: false,
          comments : post.comments,
          

        };
      });
      setPostStates(initialPostStates);
    }
  }, [data]);
  const  handlelikepercomment = (commentId : string) => async () => {
    const currentlyLiked = commentLikes[commentId];
    const newLiked = !currentlyLiked;
    // Step 1: Optimistic update
    setCommentLikeCounts(prev => ({
      ...prev,
      [commentId]: prev[commentId] + (newLiked ? 1 : -1),
    }));
    setCommentLikes(prev => ({
      ...prev,
      [commentId]: newLiked,
    }));
    try {
    // Step 2: Send update to backend
    const res = await fetch(`/api/feeds/likecomment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({commentId:commentId, liked: newLiked , email:email}),
    });
    if (!res.ok) toast.error('failed to update comment like');
  } catch (error) {
    console.error(error);
    // Step 3: Revert if failed
    toast.error('failed to update comment like');
    setCommentLikes(prev => ({
      ...prev,
      [commentId]: currentlyLiked,
    }));
    setCommentLikeCounts(prev => ({
      ...prev,
      [commentId]: prev[commentId] + (currentlyLiked ? 1 : -1),
    }));
  }
      // Here you can also send the like status to the server if needed
  }
    // socket for real-time updates
  // useEffect(() => {
  //   socket.on("postLiked", (data) => {
  //     // Update the local state or refetch data as needed
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
        comments: currentState.comments
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
          comments : currentState.comments
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
                    comments: post.comments,
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
                email={post.email[0].toUpperCase() + post.email.slice(1)} 
                size={48}
                className="border-2 border-gray-200"
              />
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900 text-base">{post.email[0].toUpperCase() + post.email.slice(1)}</span>
                  <span className="text-xs text-gray-500">{formatDistanceToNow( new Date(post.createdAt))} ago</span>
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
              </CardContent>
              <CardContent className=" px-0 rounded-none">
                <div className={`rounded-none overflow-hidden mb-2 p-0 px-0`}>
              {/* Images */}
              {post.images && post.images.length > 0 && (
                <div className="mt-2">
                  {post.images.length === 1 && (
                    <Image 
                      src={post.images[0].url} 
                      alt="Post media" 
                      className="w-full object-cover cursor-zoom-in" 
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
                          className=" object-cover cursor-zoom-in" 
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
                <div className="relative mt-2 overflow-hidden"  
                      onMouseEnter={() => handleMouseEnter(post._id)}
                    onMouseLeave={() => handleMouseLeave(post._id)}
                    >
                  <video
                    ref={setVideoRef(post._id)}
                    className="w-full"
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
                  <div className="flex flex-col items-center justify-center h-32 bg-gray-100 border border-gray-200"> {/* ← Added bg and border */}
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
            </CardContent>
            <CardContent className="px-3 py-2 sm:px-5 sm:py-3">
                <div className="flex sm:flex-row justify-between items-start sm:items-center gap-2 text-gray-500 text-sm mb-1">
                  <span className="flex gap-1 items-center">
                    <Eye className="w-4 h-4" />
                    <span>46</span>
                  </span>
                  <span>{postState.likes } Likes / {postState.comments} comments</span>
                </div>
              
                <div className="border-t border-gray-200 my-1" />

                <div className="flex sm:flex-row justify-between items-stretch sm:items-center text-gray-600 font-medium text-sm gap-2 mt-4">
                  <button className="flex items-center gap-1 hover:text-blue-600 transition w-full sm:w-auto justify-center" onClick={()=>togglelike( post._id ) }>
                          <Heart className={`w-5 h-5 ${postState.userLiked ? "text-blue-600" : ""}`}
                                  fill={postState.userLiked ? "currentColor" : "none"} />
              {postState.userLiked ? "Liked" : "Like"}
                  </button>
                  <button className="flex items-center gap-1 hover:text-blue-600 transition w-full sm:w-auto justify-center"  onClick={() => {
                        const newCommentSectionState = !commentSection[post._id];
                        setCommentSection(prev => ({
                          ...prev,
                          [post._id]: newCommentSectionState
                        }));
                        
                        // If opening comment section and we don't have comments yet, fetch them
                        if (newCommentSectionState && !commentData[post._id]) {
                          setLoadingComments(prev => ({ ...prev, [post._id]: true }));
                          // The useEffect will handle the actual fetching
                        }
                      }}>
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
          maxLength={600}
          value={commentText}
          onChange={(e)=>setCommentText(e.target.value) }
        />
                  {/* Post button */}
                  <button className={`self-end px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm ${sendingComments ? 'disabled':''}`} onClick={()=>handleSubmitComment(post._id) }>
                    Send
                  </button>
                  </div>

                  {/* Example comment list */}
                <div className="w-full space-y-3 mt-2">
                  {sendingComments ? (
              <div className="absolute top-10 left-0 opacity-15 bg-black h-[100vh] w-[100vh] z-10">Loading comments...
                <Image src="/video/spinAnimation.gif" alt="spin Animation" width={22} height={22} className="relative m-auto"/>
              </div>
            ):(<div></div>)}
      {loadingComments[post._id] ? (
        <div className="text-center py-4"><PostsSkeletonComment count={4}/></div>
      ) : commentData[post._id]?.length > 0 ? (
        commentData[post._id].map((comment) => (
          
          <div key={comment._id}>
            <div className="flex items-start gap-3">
              <UserAvatar 
                avatar={comment?.user?.avatar || "https://img.icons8.com/ios-filled/50/user-male-circle.png"}
                email={comment?.user?.email|| ""}
                size={36}
                className="border border-gray-300"
              />
              <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
                <span className="font-semibold text-sm text-gray-900 flex gap-4">
                  { comment.user.email[0].toUpperCase() + comment.user.email.slice(1)}
                  <span className="font-normal text-sm text-gray-500">{formatDistanceToNow( new Date(comment.createdAt) )} ago</span>
                </span>
                <p className="text-gray-800 text-sm mt-0.5">{comment.content}</p>
                <div className="flex gap-4 mt-1 text-xs text-gray-500">
                  <button className={`hover:text-blue-600 ${commentLikes[comment._id] ? 'text-blue-600' : ''} flex`} onClick={handlelikepercomment(comment._id)}disabled={sendingComments}>
                  <Heart className={`w-4 h-4 mr-1 ${commentLikes[comment._id]} ? 'block text-blue-600': 'hidden' `} fill={commentLikes[comment._id] ? "currentColor" : "none"} />
                  {/* make work on this  */}
                    {commentLikes[comment._id] ? `${commentLikeCounts[comment._id] ?? comment.likes} ${commentLikeCounts[comment._id] === 1 ? 'Like' : 'Likes'}`:''}</button>
                  <button className="hover:text-blue-600">Reply</button>
                </div>
              </div>
            </div>
          
          </div>
        ))
      ) : (
        <div className="text-center py-4 text-gray-500">No comments yet</div>
      )}
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