"use client";

// 空的编辑器内容
const emptyEditorContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: []
    }
  ]
};
import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  type EditorInstance,
  EditorRoot,
  ImageResizer,
  type JSONContent,
  handleCommandNavigation,
  handleImageDrop,
  handleImagePaste,
} from "novel";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { usePathname } from "next/navigation";
import { defaultExtensions } from "./extensions";
import { ColorSelector } from "./selectors/color-selector";
import { LinkSelector } from "./selectors/link-selector";
import { MathSelector } from "./selectors/math-selector";
import { NodeSelector } from "./selectors/node-selector";
import { Separator } from "./ui/separator";

import GenerativeMenuSwitch from "./generative/generative-menu-switch";
import { uploadFn } from "./image-upload";
import { TextButtons } from "./selectors/text-buttons";
import { slashCommand, suggestionItems } from "./slash-command";

import hljs from "highlight.js";

const extensions = [...defaultExtensions, slashCommand];

const TailwindAdvancedEditor = () => {
  const pathname = usePathname();
  const [initialContent, setInitialContent] = useState<null | JSONContent>(null);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [charsCount, setCharsCount] = useState();

  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openAI, setOpenAI] = useState(false);

  const [isTyping, setIsTyping] = useState(false);

  //Apply Codeblock Highlighting on the HTML from editor.getHTML()
  const highlightCodeblocks = (content: string) => {
    const doc = new DOMParser().parseFromString(content, "text/html");
    doc.querySelectorAll("pre code").forEach((el) => {
      if (el instanceof HTMLElement) {
        hljs.highlightElement(el);
      }
    });
    return new XMLSerializer().serializeToString(doc);
  };

  const debouncedUpdates = useDebouncedCallback(async (editor: EditorInstance) => {
    // 保存当前光标位置和更多状态信息
    const { from, to } = editor.state.selection;
    const isEditorFocused = editor.isFocused;
    const scrollTop = editor.view.dom.scrollTop;
    

    
    const json = editor.getJSON();
    setCharsCount(editor.storage.characterCount.words());
    window.localStorage.setItem("html-content", highlightCodeblocks(editor.getHTML()));
    window.localStorage.setItem("novel-content", JSON.stringify(json));
    window.localStorage.setItem("markdown", editor.storage.markdown.getMarkdown());
    setSaveStatus("Saved");
    setIsTyping(false);
    
    // 应用代码高亮到当前编辑器中的代码块，但避免重复处理
    const codeBlocks = editor.view.dom.querySelectorAll("pre code:not(.hljs)");
    if (codeBlocks.length > 0) {
      // 立即处理代码高亮，不使用 setTimeout
      codeBlocks.forEach((block) => {
        if (block instanceof HTMLElement) {
          try {
            hljs.highlightElement(block);
          } catch (error) {
            console.warn('Failed to highlight code block:', error);
          }
        }
      });
      
      // 恢复光标位置和滚动位置
      if (isEditorFocused) {
        // 使用 nextTick 确保在下一个事件循环中恢复状态
        Promise.resolve().then(() => {
          try {
            const docSize = editor.view.state.doc.content.size;
            if (from <= docSize && to <= docSize) {
              editor.commands.focus();
              editor.commands.setTextSelection({ from, to });
              // 恢复滚动位置
              editor.view.dom.scrollTop = scrollTop;
            } else {
              editor.commands.focus();
              editor.commands.setTextSelection({ from: docSize, to: docSize });
            }
          } catch (error) {
            console.warn('Failed to restore editor state:', error);
            // 至少保持焦点
            try {
              editor.commands.focus();
            } catch {
              // 忽略焦点恢复失败
            }
          }
        });
      }
    }
  }, 500);

  useEffect(() => {
    const isNewNotePage = pathname === '/note/new';
    
    if (isNewNotePage) {
      // 新建笔记页面：清空localStorage并使用空内容
      window.localStorage.removeItem("novel-content");
      window.localStorage.removeItem("html-content");
      window.localStorage.removeItem("markdown");
      setInitialContent(emptyEditorContent);
    } else {
      // 其他页面：尝试从localStorage加载内容
      const content = window.localStorage.getItem("novel-content");
      if (content) {
        try {
          setInitialContent(JSON.parse(content));
        } catch (error) {
          console.warn('Failed to parse stored content, using empty:', error);
          setInitialContent(emptyEditorContent);
        }
      } else {
        setInitialContent(emptyEditorContent);
      }
    }
    
    // 添加全局复制事件监听器作为备选方案
    const handleGlobalCopy = (e: ClipboardEvent) => {
      console.log('Global copy event detected')
      
      // 检查是否有选中的文本
      const selection = window.getSelection()
      if (!selection || selection.toString().trim() === '') {
        return
      }
      
      const selectedText = selection.toString()
      console.log('Selected text:', selectedText)
      
      // 简单的格式检测和转换
      if (selectedText.includes('##') || selectedText.includes('**') || selectedText.includes('`')) {
        console.log('Text already contains markdown formatting')
        return
      }
      
      // 检查选中的元素是否有格式
      const range = selection.getRangeAt(0)
      const container = range.commonAncestorContainer
      const parentElement = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element
      
      if (parentElement) {
        let markdownText = selectedText
        
        // 检查父元素的标签和样式
        if (parentElement.tagName === 'H1') {
          markdownText = `# ${selectedText}`
        } else if (parentElement.tagName === 'H2') {
          markdownText = `## ${selectedText}`
        } else if (parentElement.tagName === 'H3') {
          markdownText = `### ${selectedText}`
        } else if (parentElement.tagName === 'STRONG' || window.getComputedStyle(parentElement).fontWeight === 'bold' || (parentElement as HTMLElement).style?.fontWeight === 'bold') {
          markdownText = `**${selectedText}**`
        } else if (parentElement.tagName === 'EM' || window.getComputedStyle(parentElement).fontStyle === 'italic' || (parentElement as HTMLElement).style?.fontStyle === 'italic') {
          markdownText = `*${selectedText}*`
        } else if (parentElement.tagName === 'CODE') {
          markdownText = `\`${selectedText}\``
        }
        
        if (markdownText !== selectedText) {
          console.log('Converting to markdown:', markdownText)
          e.clipboardData?.setData('text/plain', markdownText)
          e.preventDefault()
        }
      }
    }
    
    document.addEventListener('copy', handleGlobalCopy)
    
    return () => {
      document.removeEventListener('copy', handleGlobalCopy)
    }
  }, [pathname]);

  if (!initialContent) return null;

  return (
    <div className="relative w-full max-w-screen-lg">
      <div className="flex absolute right-5 top-5 z-10 mb-5 gap-2">
        <div className="rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground">{saveStatus}</div>
        <div className={charsCount ? "rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground" : "hidden"}>
          {charsCount} Words
        </div>
      </div>
      <EditorRoot>
        <EditorContent
          initialContent={initialContent}
          extensions={extensions}
          className="relative min-h-[500px] w-full max-w-screen-lg border-muted bg-background p-4   sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg"
                      editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
              copy: () => {
                console.log('Copy event triggered in Novel Editor')
                return false // 让默认的复制行为处理，但添加我们的逻辑
              }
            },
            handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              class:
                "prose prose-lg dark:prose-invert prose-headings:font-bold prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl font-sans focus:outline-none max-w-full",
            },
          }}
          onUpdate={({ editor }) => {
            if (!isTyping) {
              setIsTyping(true);
              setSaveStatus("Unsaved");
            }
            debouncedUpdates(editor);
          }}
          onCreate={({ editor }) => {
            console.log('Editor created, adding copy listener')
            
            // 添加全局复制事件监听器
            const handleCopy = (e: ClipboardEvent) => {
              console.log('Global copy event detected')
              
              const selection = editor.state.selection
              if (selection.empty) {
                return
              }
              
              try {
                // 获取当前完整的markdown
                const fullMarkdown = editor.storage.markdown.getMarkdown()
                console.log('Full markdown:', fullMarkdown)
                
                // 获取选中的文本
                const selectedText = editor.state.doc.textBetween(selection.from, selection.to)
                console.log('Selected text:', selectedText)
                
                // 检查选中内容是否有格式
                const fragment = selection.content()
                let hasFormatting = false
                
                fragment.content.forEach(node => {
                  if (node.marks && node.marks.length > 0) {
                    hasFormatting = true
                  }
                  if (node.type.name !== 'text' && node.type.name !== 'paragraph') {
                    hasFormatting = true
                  }
                })
                
                if (hasFormatting && fullMarkdown.includes(selectedText)) {
                  // 尝试从完整markdown中提取对应部分
                  const lines = fullMarkdown.split('\n')
                  const selectedLines = selectedText.split('\n')
                  
                  // 简单匹配：找到包含选中文本的行
                  const matchingLines = lines.filter((line: string) => 
                    selectedLines.some((selectedLine: string) => 
                      line.includes(selectedLine.trim()) && selectedLine.trim().length > 0
                    )
                  )
                  
                  if (matchingLines.length > 0) {
                    const markdownResult = matchingLines.join('\n')
                    console.log('Setting markdown to clipboard:', markdownResult)
                    
                    e.clipboardData?.setData('text/plain', markdownResult)
                    e.preventDefault()
                  }
                }
              } catch (error) {
                console.error('Copy processing failed:', error)
              }
            }
            
            // 添加事件监听器到编辑器DOM元素
            const editorElement = editor.view.dom
            editorElement.addEventListener('copy', handleCopy)
            
            // 清理函数
            editor.on('destroy', () => {
              editorElement.removeEventListener('copy', handleCopy)
            })
          }}
          slotAfter={<ImageResizer />}
        >
          <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="px-2 text-muted-foreground">No results</EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item) => (
                <EditorCommandItem
                  value={item.title}
                  onCommand={(val) => item.command?.(val)}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
                  key={item.title}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>

          <GenerativeMenuSwitch open={openAI} onOpenChange={setOpenAI}>
            <Separator orientation="vertical" />
            <NodeSelector open={openNode} onOpenChange={setOpenNode} />
            <Separator orientation="vertical" />

            <LinkSelector open={openLink} onOpenChange={setOpenLink} />
            <Separator orientation="vertical" />
            <MathSelector />
            <Separator orientation="vertical" />
            <TextButtons />
            <Separator orientation="vertical" />
            <ColorSelector open={openColor} onOpenChange={setOpenColor} />
          </GenerativeMenuSwitch>
        </EditorContent>
      </EditorRoot>
    </div>
  );
};

export default TailwindAdvancedEditor;