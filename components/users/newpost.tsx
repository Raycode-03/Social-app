"use client"
  import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { CircleUserRound, File, FileSpreadsheet, Image as Imageicon, Loader2, Smile, Video, X } from "lucide-react"
import Image from "next/image"
import React, { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
  // correct emoji-mart import
  import { useIsMobile } from "@/hooks/use-mobile"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import type { Editor } from '@tiptap/react';

  // text editing in textarea
  import PostEditor from "@/users/posteditor"
    export default function NewPost({ useremail }: { useremail: string  | null}) {
      const ismobile = useIsMobile();
      interface Emoji {
        native: string;
        
      }

      interface uploadedfile{
        preview_url:string;
        name:string;
        type:string;
        size :number;
      }
      interface PostData {
      text: string;
      images: uploadedfile[] ;
      video?: uploadedfile | null;
      file?: uploadedfile | null;
    }

    const [postData, setPostData] = useState<PostData>({ text: ""  , images: [] , video: null , file: null});
    // Keep raw files separately
    const [rawFiles, setRawFiles] = useState<{ video?: File; images: File[]; file?: File }>({
        video: undefined,
        images: [],
        file: undefined,
    });
      const [openpostmenu , setshowpostmenu] = useState(false);
      const newpostref = useRef(null)
      const pickerRef = useRef<HTMLDivElement | null>(null)
      const [showPicker, setShowPicker] = useState(false);
      const [loading, setLoading] = useState(false);
        const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
        useEffect(()=>{
          const closeonclick = (e: MouseEvent)=>{
              if(newpostref.current && !(newpostref.current as HTMLElement).contains(e.target as Node) ){
                  setshowpostmenu(false);
                  
              }
              if(pickerRef.current &&
            !pickerRef.current.contains(e.target as Node)){
              setShowPicker(false);
            }

          }
        document.addEventListener("mousedown",closeonclick) 
        return ()=>document.removeEventListener("mousedown",closeonclick)
        },[]);
      const MAX_IMAGES = 4;
        const handleimageupload = (e:React.ChangeEvent<HTMLInputElement>)=>{
        const files = e.target.files;
        if (files) {
        const newfiles = Array.from(files);
          if (postData.images.length + newfiles.length > MAX_IMAGES) {
            toast.error(`You can only upload up to ${MAX_IMAGES} images`);
            e.target.value = ""; // reset file input
            return;
          }
          const newImages = newfiles.map((file)=>({
          preview_url : URL.createObjectURL(file), 
          name: file.name,
          type: file.type,
          size: file.size,
          }));
          setPostData((prev) => ({
            ...prev,
            images: [...prev.images, ...newImages],
          }));
          setRawFiles(prev => ({ ...prev, images: [...prev.images, ...newfiles] }));
        }
        e.target.value="";
    }
      const handlevideoupload = (e:React.ChangeEvent<HTMLInputElement>)=>{
        const file = e.target.files?.[0];
        if (file) {
          const newVideo = {
            preview_url: URL.createObjectURL(file),
                name: file.name,
                type: file.type,
                size: file.size
          };
          setPostData(prev => ({
            ...prev,
            video: newVideo,
          }));
          setRawFiles(prev => ({ ...prev, video: file }));
        }
        e.target.value="";
      }
      const handlefileupload = (e:React.ChangeEvent<HTMLInputElement>)=>{
        
        const file = e.target.files?.[0];
        if(!e.target.files) return;
        if (file) {
            setPostData(prev => ({
              ...prev,
              file: {
                preview_url: URL.createObjectURL(file),
                name: file.name,
                type: file.type,
                size: file.size
              }
            }));
            setRawFiles(prev => ({ ...prev, file: file }));
        }
        e.target.value = "";
      }
      
      const handleaddemoji = (emoji:Emoji)=>{
        if (editorInstance) {
          editorInstance.chain().focus().insertContent(emoji.native).run();
        }
      }

    
      //  submti post 
    const Handlepostsubmit =  ( async (e: React.FormEvent<HTMLFormElement>)=>{
      setLoading(true);
      e.preventDefault();
      try {
        // the formdata is safer than the rawfiles
         const formData = new FormData();
          formData.append("text", postData.text);
          formData.append("email", useremail || "");
          rawFiles.images.forEach(file => {
            formData.append("images", file);
          });

          if (rawFiles.video) {
            formData.append("video", rawFiles.video);
          }

          if (rawFiles.file) {
            formData.append("file", rawFiles.file);
          }
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}/api/feeds/newfeed`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) { 
            toast.error(data.error); // or setError(message)
        }

        toast.success(data.message || "Post created successfully!");  
        setPostData({ text: "" , images: [] , video: null , file: null});
        setshowpostmenu(false);
        setShowPicker(false);
      } catch (err) {
          toast.error(`Network error: ${String(err)}`);
        }
      finally {
        setLoading(false);
      }
    });
    // whats the user can see
    return (
      
      <div className="flex justify-center mb-4">
        {/* Mini Input */}
        <Card className="w-full max-w-[34rem] mx-auto p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg" > 
        <div className="flex items-center gap-4">
          {/* User Avatar */}
          <CircleUserRound className="h-10 w-10 text-gray-500 flex-shrink-0" />

          {/* The 'Start a post...' button */}
          <button   className="flex-1 px-4 py-2 border border-gray-200 rounded-full bg-gray-50 text-gray-500 text-left transition-colors duration-200
                      hover:bg-gray-100 focus:outline-none focus:bg-gray-100 font-bold"    onClick= {(()=>setshowpostmenu(true))}>
            Start a post...
          </button>
        </div>
      </Card>

        {/* Expanded Composer */}
      {openpostmenu && (
        <div className="fixed inset-0 flex flex-1 items-center justify-center bg-black/40 z-50 px-8"   >
          <Card className="w-[34rem] max-h-[70vh] flex flex-col relative" ref={newpostref}>
            <CardHeader className="flex justify-between items-center border-b ">
              <p className="text-lg font-semibold">Create a post</p>

                <span className="rounded-full bg-gray-600 w-8 h-8 flex items-center justify-center"><X className="w-5 h-5 cursor-pointer text-white" strokeWidth={3} onClick={() => { setshowpostmenu(false); }} /></span>
            </CardHeader>

    <CardContent className="flex-1 flex flex-col overflow-y-auto max-h-[70vh] space-y-4">
  {/* text editor */}
  <div className="shrink-0">
    <PostEditor
      value={postData.text}
      onChange={(text) => setPostData({ ...postData, text })}
      onEditorReady={setEditorInstance}
    />
  </div>

  {/* preview files */}
  {(postData.video || postData.images.length > 0 || postData.file) && (
    <div className="space-y-4">
      {/* video preview */}
      {postData.video && (
        <div className="relative rounded-lg overflow-hidden">
          <X
            className="absolute top-2 right-2 bg-black/50 rounded-full text-white p-1 cursor-pointer z-10"
            onClick={() => setPostData({ ...postData, video: null })}
          />
          <video
            src={postData.video.preview_url}
            about="Preview video"
            className="w-full rounded-lg max-h-32 object-contain"
            controls 
          />
        </div>
      )}

      {/* images preview */}
      {postData.images.length > 0 && (
        <div
          className={`grid gap-2 ${
            postData.images.length > 1
              ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {postData.images.map((image, i) => (
            <div className="relative rounded-lg overflow-hidden" key={i}>
              <X
                className={`absolute top-2 ${postData.images.length==1 ?'right-8':'right-2'} bg-black/50 rounded-full text-white p-1 cursor-pointer z-10`}
                onClick={() =>
                  setPostData((prevdata) => ({
                    ...prevdata,
                    images: prevdata.images.filter((_, j) => j !== i),
                  }))
                }
              />
              <Image
                src={image.preview_url}
                alt="Preview image"
                className="w-full rounded-lg max-h-52 object-contain"
                height={200}
                width={200}
              />
            </div>
          ))}
        </div>
      )}

      {/* file preview */}
      {postData.file && (
        <div className="relative p-4 rounded-lg border bg-gray-100">
          <X
            className="absolute top-2 right-2 bg-black/50 rounded-full text-white p-1 cursor-pointer z-10"
            onClick={() => setPostData({ ...postData, file: null })}
          />
          <div className="flex flex-col items-center justify-center h-32 text-gray-700">
            <File className="text-3xl mb-2" strokeWidth={2} />
            <span className="text-xs text-center truncate">{postData.file.name}</span>
          </div>
        </div>
      )}
    </div>
  )}
</CardContent>


        <CardFooter className="flex justify-between items-center border-t pt-2">
            {/* Media buttons */}
            {/*  images*/}
              <div className="flex gap-3 text-gray-500">
                <label className={`group ${postData.file ||postData.images.length>=4 || postData.video ? "hidden": "block"}`}>
                  <div className="absolute top-full mt-2 left-0 hidden group-hover:flex bg-black text-white text-sm px-3 py-2 rounded-lg">
                      Upload Images
                  </div>
                    <Imageicon className="cursor-pointer" />  
                    <input type="file" accept="image/*" multiple hidden onChange={handleimageupload} />
                </label>
                {/* videos */}
                <label className={`group ${postData.file ||postData.video || postData.images.length>0 ? "hidden": "block"}`}>
                  <div className="absolute top-full mt-2 left-0 hidden group-hover:flex bg-black text-white text-sm px-3 py-2 rounded-lg">
                      Upload Videos
                  </div>
                  <Video className="cursor-pointer" />
                  <input type="file" accept="video/*" hidden onChange={handlevideoupload} />
                </label>
                {/* files */}
                <label className={`group ${postData.video || postData.file || postData.images.length>0 ? "hidden": "block"}`}>
                  <FileSpreadsheet className="cursor-pointer"/>
                  <div className="absolute top-full mt-2 left-0 hidden group-hover:flex bg-black text-white text-sm px-3 py-2 rounded-lg">
                      Upload PDF / Word / PowerPoint
                  </div>  
                  <input type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" hidden 
                    onChange={handlefileupload}  />
                </label>
                {!ismobile && (
                  <div className="group">
                      <Smile className="cursor-pointer" onClick={() => setShowPicker(!showPicker)} />
                        <div className="absolute top-full mt-2 left-0 hidden group-hover:flex bg-black text-white text-sm px-3 py-2 rounded-lg">
                                  Custom Emoji
                            </div>
                      {showPicker && (
                        <div
                        ref={pickerRef}
                        className="absolute bottom-12 left-0 z-10">
                            <Picker data={data} onEmojiSelect={handleaddemoji} />
                        </div>
                      )}
                  </div> 
                )}
               
              </div>


              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="ghost" className="cursor-pointer hover:bg-gray-200" onClick={()=>{setShowPicker(false); setRawFiles({ images: [] , video: undefined, file: undefined}); setPostData({text: "" , images :[] , video : null, file: null});}}>Clear</Button>
                <form method="post" onSubmit={Handlepostsubmit}>
                  <>                  
                    {loading && (
                      <>  </>
                    )}
                    <Button className="cursor-pointer" disabled={loading}>{loading? (<> <Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending... </>)
                    :("Post")}</Button>
                  </>
                </form>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
      
      </div>


    )
  }