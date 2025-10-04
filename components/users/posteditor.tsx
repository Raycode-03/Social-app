"use client";
import "@/public/css/posteditor.css";
import { Color } from "@tiptap/extension-color";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState } from "react";
const MenuBar = ({ editor }: { editor: Editor | null, selectionState?: number }) => {
  if (!editor) {
    return null;
  }

    return (
      <div className="menu-bar mt-1 p-3 bg-gray-100 rounded-lg shadow-sm">
        <div className="button-group flex flex-wrap gap-2 font-medium">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "is-active bg-blue-300 text-blue-900" : ""}

          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "is-active bg-blue-300 text-blue-900" : ""}

          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "is-active bg-blue-300 text-blue-900" : ""}
            
          >
            • List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive("orderedList") ? "is-active bg-blue-300 text-blue-900" : ""}
          >
          1. List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "is-active bg-blue-300 text-blue-900" : ""}
        >
          Quote
        </button>
        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={editor.isActive("paragraph") ? "is-active bg-blue-300 text-blue-900" : ""}
        >
          Paragraph
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={editor.isActive("heading", { level: 1 }) ? "is-active" : ""}
        >
          H1
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
        >
          H2
        </button>
      </div>
    </div>
  );
};

interface TiptapEditorProps {
  value: string;
  onChange: (text: string) => void;
  onEditorReady?: (editor: Editor | null) => void; // add this
}

const TiptapEditor = ({ value, onChange, onEditorReady }: TiptapEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [characterCount, setCharacterCount] = useState(0);
  const [selectionState, setSelectionState] = useState(0); // Add this line
  const maxCharacters = 2500;
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "What do you want to talk about?",
      }),
      TextStyle,
      Color,
    ],
    immediatelyRender: false,
    content: value, // set initial content
    onUpdate: ({ editor }) => {
      const text = editor.getHTML();
      const textplain = editor.getText();
      if (textplain.length > maxCharacters) {
        const truncatedText = textplain.slice(0, maxCharacters);
        editor.commands.setContent(truncatedText);
        setCharacterCount(maxCharacters);
        onChange(truncatedText); // <-- update parent
      } else {
        setCharacterCount(textplain.length);
        onChange(text); // <-- update parent
      }
    },
    onCreate: ({ editor }) => {
      const text = editor.getText();
      setCharacterCount(text.length);
      onChange(text); // <-- update parent
    },
  });

  useEffect(() => {
    if (onEditorReady) onEditorReady(editor);
  }, [editor, onEditorReady]);

  // Listen for selection changes to force re-render
  useEffect(() => {
    if (!editor) return;
    const handler = () => setSelectionState((s) => s + 1);
    editor.on('selectionUpdate', handler);
    return () => {
      editor.off('selectionUpdate', handler);
    };
  }, [editor]);
  
// ✅ auto-resize effect
  useEffect(() => {
    
    if (!editorRef.current || !editor) return;

    const el = editorRef.current.querySelector("[contenteditable='true']") as HTMLElement;
    if (!el) return;

    const resize = () => {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 240) + "px"; // 240px = 15rem
    };

    // resize on content changes
    editor.on("update", resize);
    resize();

    return () => {
      editor.off("update", resize);
    };
  }, [editor]);
  useEffect(() => {
    if (editor && value === "") {
      editor.commands.setContent("");
    }
  }, [value, editor]);
  return (
   <div className="editor-container w-full max-w-full overflow-x-hidden">
    <div className="editor-card w-full max-w-full overflow-x-hidden">
      {characterCount >= 1 ? <MenuBar editor={editor} selectionState={selectionState} /> : ""}
      {editor ? (
        <EditorContent
          editor={editor}
          ref={editorRef}
          className="editor-content  w-full max-w-full min-h-[8rem] max-h-[15rem] overflow-y-auto overflow-x-hidden px-3 py-2 border-none focus:outline-none break-words whitespace-pre-wrap"
          placeholder="What do you want to talk about?"
        />
      ) : (
        <p className="text-gray-400">Loading editor...</p>
      )}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-500 text-right">
          <span className={characterCount > maxCharacters * 0.9 ? "text-orange-500 font-medium" : ""}>
            {characterCount}
          </span>
          <span className="text-gray-400">/{maxCharacters}</span>
        </div>
      </div>
    </div>
  </div>
  );
};

export default TiptapEditor;
