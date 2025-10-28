"use client";
import { Skeleton } from "@/components/ui/skeleton";

export function PostsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="w-full max-w-[34rem] mx-auto bg-white rounded-lg shadow border border-gray-200 mb-6 pt-2 pb-2">
          {/* Someone liked/commented bar */}
          <div className="w-full flex items-center gap-2 text-gray-500 text-sm py-2 px-3 sm:px-5 border-b border-gray-200">
            <Skeleton className="h-8 w-8 rounded-full bg-gray-300" />
            <Skeleton className="h-4 w-48 bg-gray-300" />
          </div>

          {/* Header with avatar and user info */}
          <div className="flex flex-row items-center gap-2 px-3 py-1 sm:px-5 sm:py-2">
            <Skeleton className="h-12 w-12 rounded-full bg-gray-300" />
            <div className="flex flex-col space-y-2">
              <Skeleton className="h-4 w-32 bg-gray-300" />
              <Skeleton className="h-3 w-24 bg-gray-300" />
            </div>
          </div>

          {/* Content */}
          <div className="px-3 py-2 sm:px-5 sm:py-3">
            {/* Text content skeleton */}
            <div className="space-y-2 mb-2">
              <Skeleton className="h-4 w-full bg-gray-300" />
              <Skeleton className="h-4 w-5/6 bg-gray-300" />
              <Skeleton className="h-4 w-4/6 bg-gray-300" />
              {/* Read more button skeleton */}
              <Skeleton className="h-4 w-16 bg-gray-300 mt-1" />
            </div>

            {/* Images/Videos/File area skeleton */}
            <div className="rounded-lg  mb-2 p-2 px-4">
              {/* Single image skeleton */}
              <Skeleton className="h-64 w-full rounded-lg bg-gray-300" />
            </div>

            {/* Stats bar */}
            <div className="flex justify-between items-center text-gray-500 text-sm mb-1">
              <div className="flex gap-1 items-center">
                <Skeleton className="h-4 w-4 bg-gray-300" />
                <Skeleton className="h-4 w-8 bg-gray-300" />
              </div>
              <Skeleton className="h-4 w-32 bg-gray-300" />
            </div>

            <div className="border-t border-gray-200 my-1" />

            {/* Action buttons */}
            <div className="flex justify-between items-center text-gray-600 font-medium text-sm gap-2 mt-4">
              <Skeleton className="h-8 w-20 bg-gray-300 rounded" />
              <Skeleton className="h-8 w-24 bg-gray-300 rounded" />
              <Skeleton className="h-8 w-20 bg-gray-300 rounded" />
            </div>
          </div>

          {/* Comment section skeleton (optional - only if you want to show comment area in skeleton) */}
          <div className="flex flex-col gap-3 border-t border-gray-200 p-4">
            {/* <div className="send flex flex-row items-center gap-2 w-full">
              <Skeleton className="h-10 flex-1 rounded-lg bg-gray-300" />
              <Skeleton className="h-8 w-16 bg-gray-300 rounded-lg" />
            </div> */}
            
            {/* Comment list skeletons */}
            {/* <div className="w-full space-y-3 mt-2"> */}
              {/* Comment 1 */}
              {/* <div className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full bg-gray-300" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-20 bg-gray-300" />
                  <Skeleton className="h-4 w-full bg-gray-300" />
                  <div className="flex gap-4">
                    <Skeleton className="h-3 w-8 bg-gray-300" />
                    <Skeleton className="h-3 w-8 bg-gray-300" />
                    <Skeleton className="h-3 w-8 bg-gray-300" />
                  </div>
                </div>
              </div> */}
              
              {/* <div className="border-b border-gray-200" /> */}
              
              {/* Comment 2 */}
              {/* <div className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full bg-gray-300" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24 bg-gray-300" />
                  <Skeleton className="h-4 w-5/6 bg-gray-300" />
                  <div className="flex gap-4">
                    <Skeleton className="h-3 w-8 bg-gray-300" />
                    <Skeleton className="h-3 w-8 bg-gray-300" />
                    <Skeleton className="h-3 w-8 bg-gray-300" />
                  </div>
                </div>
              </div> */}
            {/* </div> */}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PostsSkeletonComment ({ count =  4} : {count?:number}){
  return(
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="flex">
            <Skeleton className="h-8 w-8 rounded-full bg-gray-300 left-0" />
            <div className="right-0 gap-2 flex flex-col">
              <Skeleton  className="h-4 w-48 bg-gray-300" />
          <Skeleton className="h-4 w-100 bg-gray-300" />
            </div>
          </div>
          
          </div>
      ))}
    </div>
  )
}
