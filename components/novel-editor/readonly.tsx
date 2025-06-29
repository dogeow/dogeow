"use client";
import {
  EditorContent,
  EditorRoot,
  type JSONContent,
} from "novel";
import { useEffect, useState } from "react";
import hljs from "highlight.js";

// 导入必要的扩展，避免冲突
import {
  StarterKit,
  TaskItem,
  TaskList,
  Mathematics,
  HighlightExtension,
  TiptapUnderline,
  TiptapImage,
  TiptapLink,
} from "novel";
import { CodeBlock } from "@tiptap/extension-code-block";
import { Markdown } from "tiptap-markdown";
import { cx } from "class-variance-authority";

const readonlyExtensions = [
  StarterKit.configure({
    // 禁用内置的 codeBlock，因为我们要使用带高亮的版本
    codeBlock: false,
    bulletList: {
      HTMLAttributes: {
        class: cx("list-disc list-outside leading-3 -mt-2"),
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: cx("list-decimal list-outside leading-3 -mt-2"),
      },
    },
    listItem: {
      HTMLAttributes: {
        class: cx("leading-normal -mb-2"),
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: cx("border-l-4 border-primary px-2"),
      },
    },
    code: {
      HTMLAttributes: {
        class: cx("rounded-md bg-muted px-1.5 py-1 font-mono font-medium"),
        spellcheck: "false",
      },
    },
    horizontalRule: false,
    dropcursor: {
      color: "#DBEAFE",
      width: 4,
    },
    gapcursor: false,
  }),
  TiptapLink.configure({
    HTMLAttributes: {
      class: cx(
        "text-muted-foreground underline underline-offset-[3px] hover:text-primary transition-colors cursor-pointer",
      ),
    },
  }),
  TiptapImage.configure({
    allowBase64: true,
    HTMLAttributes: {
      class: cx("rounded-lg border border-muted"),
    },
  }),
  TaskList.configure({
    HTMLAttributes: {
      class: cx("not-prose pl-2 "),
    },
  }),
  TaskItem.configure({
    HTMLAttributes: {
      class: cx("flex gap-2 items-start"),
    },
    nested: true,
  }),
  CodeBlock.configure({
    HTMLAttributes: {
      class: cx("rounded-md bg-muted text-muted-foreground border font-mono font-medium px-4 py-3 -mx-4 my-2"),
    },
  }),
  Mathematics.configure({
    HTMLAttributes: {
      class: cx("text-foreground rounded p-1 hover:bg-accent cursor-pointer"),
    },
    katexOptions: {
      throwOnError: false,
    },
  }),
  Markdown.configure({
    html: true,
    tightLists: true,
    tightListClass: "tight",
    bulletListMarker: "-",
    linkify: false,
    breaks: false,
    transformPastedText: false,
    transformCopiedText: false,
  }),
  HighlightExtension,
  TiptapUnderline,
];

interface ReadonlyEditorProps {
  content?: JSONContent | null;
  className?: string;
}

const ReadonlyEditor = ({ content, className }: ReadonlyEditorProps) => {
  const [initialContent, setInitialContent] = useState<JSONContent | null>(null);

  // 应用代码高亮
  const highlightCodeblocks = () => {
    setTimeout(() => {
      const codeBlocks = document.querySelectorAll("pre code:not(.hljs)");
      codeBlocks.forEach((block) => {
        if (block instanceof HTMLElement) {
          try {
            hljs.highlightElement(block);
          } catch (error) {
            console.warn('Failed to highlight code block:', error);
          }
        }
      });
    }, 100);
  };

  useEffect(() => {
    if (content) {
      setInitialContent(content);
    }
  }, [content]);

  useEffect(() => {
    if (initialContent) {
      highlightCodeblocks();
    }
  }, [initialContent]);

  if (!initialContent) return null;

  return (
    <div className={`relative w-full ${className || ''}`}>
      <EditorRoot>
        <EditorContent
          initialContent={initialContent}
          extensions={readonlyExtensions}
          className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl font-sans focus:outline-none max-w-full"
          editable={false}
          editorProps={{
            attributes: {
              class:
                "prose prose-lg dark:prose-invert prose-headings:font-bold prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl font-sans focus:outline-none max-w-full",
            },
          }}
        />
      </EditorRoot>
    </div>
  );
};

export default ReadonlyEditor; 