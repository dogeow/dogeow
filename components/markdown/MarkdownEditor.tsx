"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { Slate, Editable, RenderElementProps, RenderLeafProps } from 'slate-react'
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, Code, Save, Quote, Heading1, Heading2, ImageIcon } from 'lucide-react'
import Image from "next/image"
import { toast } from 'react-hot-toast'
import { useMarkdownEditor } from './hooks/useMarkdownEditor'
import { handleCodeBlockTab, handleCopyWithSyntaxHighlighting } from './utils'
import './styles.css'
import { Editor, Text, Range } from 'slate'
import { CustomText } from './types'

export interface MarkdownEditorProps {
  initialContent?: string;
  onSave?: (content: string) => Promise<void>;
  onImageUpload?: (file: File) => Promise<{ url: string; path: string; }>;
  readOnly?: boolean;
  minHeight?: string;
  placeholder?: string;
  isDraft?: boolean;
  onDraftChange?: (isDraft: boolean) => void;
  onChange?: (content: string) => void;
}

// 主MarkdownEditor组件
const MarkdownEditor = ({
  initialContent = '',
  onSave,
  onImageUpload,
  readOnly = false,
  minHeight = '300px',
  isDraft = false,
  onDraftChange,
  onChange,
}: MarkdownEditorProps) => {
  // 客户端环境检查
  const [isClient, setIsClient] = useState(false)
  
  // 使用自定义hook
  const {
    editor,
    value,
    setValue,
    isUploading,
    setIsUploading,
    updateHighlighting,
    handleSave,
    handleKeyDown: baseHandleKeyDown,
    toggleMark,
    toggleBlock,
    isBlockActive,
  } = useMarkdownEditor({
    initialContent,
    onSave
  });
  
  // 保存逻辑
  const saveContent = useCallback(async () => {
    if (!onSave) return false;
    
    const success = await handleSave();
    if (success) {
      toast.success('保存成功！');
    } else {
      toast.error('保存失败，请稍后重试');
    }
    return success;
  }, [handleSave, onSave]);
  
  // 组合键盘处理程序
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    // 先尝试在代码块中处理Tab键
    if (event.key === 'Tab') {
      const handled = handleCodeBlockTab(event, editor, updateHighlighting);
      if (handled) return;
    }
    
    // 处理Ctrl+S/Command+S保存
    if ((event.metaKey || event.ctrlKey) && event.key === 's' && onSave) {
      event.preventDefault();
      saveContent();
      return;
    }
    
    // 调用基础键盘处理程序
    baseHandleKeyDown(event);
  }, [editor, baseHandleKeyDown, updateHighlighting, onSave, saveContent]);
  
  // 处理复制事件（保持代码高亮）
  const handleCopy = useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
    handleCopyWithSyntaxHighlighting(event, editor);
  }, [editor]);
  
  // 处理图片上传
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onImageUpload) return;
    
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setIsUploading(true);
      const file = files[0];
      
      const result = await onImageUpload(file);
      
      // 插入图片
      const imageElement = {
        type: 'image' as const,
        url: result.url,
        children: [{ text: '' }],
      };
      
      editor.insertNode(imageElement);
      
      // 重置文件输入
      e.target.value = '';
    } catch (error) {
      console.error('图片上传失败:', error);
      toast.error('图片上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  }, [editor, onImageUpload, setIsUploading]);

  // 渲染元素函数
  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children, element } = props;
    const elementWithType = element as unknown as { type: string, language?: string, url?: string };

    switch (elementWithType.type) {
      case 'block-quote':
        return (
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 my-2 italic text-gray-700 dark:text-gray-300" {...attributes}>
            {children}
          </blockquote>
        )
        
      case 'bulleted-list':
        return (
          <ul className="list-disc ml-5 my-2" {...attributes}>
            {children}
          </ul>
        )
        
      case 'numbered-list':
        return (
          <ol className="list-decimal ml-5 my-2" {...attributes}>
            {children}
          </ol>
        )
        
      case 'heading-one':
        return (
          <h1 className="text-3xl font-bold my-3" {...attributes}>
            {children}
          </h1>
        )
        
      case 'heading-two':
        return (
          <h2 className="text-2xl font-bold my-2" {...attributes}>
            {children}
          </h2>
        )
        
      case 'heading-three':
        return (
          <h3 className="text-xl font-bold my-2" {...attributes}>
            {children}
          </h3>
        )
        
      case 'list-item':
        return (
          <li className="my-1" {...attributes}>
            {children}
          </li>
        )
        
      case 'code-block':
        return (
          <div {...attributes}>
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-t-md px-3 py-1 text-sm">
              <div className="text-xs text-gray-500">
                {elementWithType.language || 'text'}
              </div>
            </div>
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-b-md overflow-x-auto whitespace-pre-wrap break-words">
              <code className="text-sm font-mono">{children}</code>
            </pre>
          </div>
        )

      case 'image':
        return (
          <div {...attributes} className="my-4 relative">
            {children}
            <div contentEditable={false} className="flex justify-center">
              {elementWithType.url && (
                <Image
                  src={elementWithType.url as string}
                  alt="上传的图片" width={500} height={500}
                  className="max-w-full max-h-[500px] object-contain rounded-md"
                />
              )}
            </div>
          </div>
        )
        
      default:
        return (
          <p className="my-2 leading-relaxed" {...attributes}>
            {children}
          </p>
        )
    }
  }, []);

  // 渲染文本节点函数
  const renderLeaf = useCallback((props: RenderLeafProps) => {
    const { attributes, children, leaf } = props;
    const customLeaf = leaf as unknown as {
      text: string;
      bold?: boolean;
      italic?: boolean;
      code?: boolean;
      link?: boolean;
      url?: string;
      token?: boolean;
      comment?: boolean;
      operator?: boolean;
      keyword?: boolean;
      variable?: boolean;
      regex?: boolean;
      number?: boolean;
      boolean?: boolean;
      string?: boolean;
      function?: boolean;
      tag?: boolean;
      selector?: boolean;
      punctuation?: boolean;
      builtin?: boolean;
      important?: boolean;
    };
    
    let formattedChildren = children;

    // 应用基本格式
    if (customLeaf.bold) {
      formattedChildren = <strong>{formattedChildren}</strong>
    }

    if (customLeaf.italic) {
      formattedChildren = <em>{formattedChildren}</em>
    }

    if (customLeaf.code) {
      formattedChildren = <code className="rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 font-mono text-sm">{formattedChildren}</code>
    }

    if (customLeaf.link) {
      formattedChildren = (
        <a 
          href={customLeaf.url} 
          className="text-blue-500 underline hover:text-blue-700"
          target="_blank" 
          rel="noopener noreferrer"
        >
          {formattedChildren}
        </a>
      )
    }

    // 代码高亮处理
    if (customLeaf.token) {
      let className = ''
      
      if (customLeaf.comment) className = 'token comment'
      if (customLeaf.operator) className = 'token operator'
      if (customLeaf.keyword) className = 'token keyword'
      if (customLeaf.variable) className = 'token variable'
      if (customLeaf.number) className = 'token number'
      if (customLeaf.string) className = 'token string'
      if (customLeaf.function) className = 'token function'
      if (customLeaf.tag) className = 'token tag'
      if (customLeaf.selector) className = 'token selector'
      if (customLeaf.regex) className = 'token regex'
      if (customLeaf.punctuation) className = 'token punctuation'
      if (customLeaf.boolean) className = 'token boolean'
      if (customLeaf.builtin) className = 'token builtin'
      if (customLeaf.important) className = 'token important'
      
      formattedChildren = <span className={className}>{formattedChildren}</span>
    }

    return <span {...attributes}>{formattedChildren}</span>
  }, []);
  
  // 处理编辑器内容变化
  const handleChange = useCallback((newValue: any[]) => {
    setValue(newValue);
    
    // 调用父组件的 onChange 回调
    if (onChange) {
      const jsonContent = JSON.stringify(newValue);
      onChange(jsonContent);
    }
  }, [setValue, onChange]);
  
  // 为SSR设置客户端渲染标记
  useEffect(() => {
    setIsClient(true)
  }, []);
  
  // 如果不是客户端环境，返回加载占位符
  if (!isClient) {
    return (
      <div 
        className="border rounded-md p-3 bg-gray-50"
        style={{ minHeight }}
      >
        <div className="animate-pulse flex space-x-4">
          <div className="space-y-2 w-full">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // 更健壮的 isMarkActive
  function isMarkActive(editor: Editor, format: Exclude<keyof CustomText, 'text'>) {
    const [match] = Editor.nodes(editor, {
      match: n => Text.isText(n) && (n as CustomText)[format] === true,
      universal: true,
    })
    return !!match
  }

  type MarkFormat = 'bold' | 'italic' | 'code'

  const markToggle = (format: MarkFormat) => {
    toggleMark(format)
  }

  interface MarkButtonProps {
    format: MarkFormat
    icon: React.ComponentType<{ className?: string }>
    title: string
    toggleMark: (format: MarkFormat) => void
    editor: typeof editor
  }

  function MarkButton(props: MarkButtonProps) {
    const { format, icon: Icon, title, toggleMark } = props
    const marks = Editor.marks(editor)
    const active = !!(marks && marks[format as keyof typeof marks])
    return (
      <Button
        variant={active ? 'secondary' : 'ghost'}
        size="sm"
        onMouseDown={e => { e.preventDefault(); toggleMark(format) }}
        aria-pressed={active}
        className={active ? 'bg-primary/20 text-primary' : ''}
        title={title}
      >
        <Icon className="h-4 w-4" />
      </Button>
    )
  }

  // 渲染组件
  return (
    <div className="markdown-editor w-full">
      {/* 工具栏在编辑器外部 */}
      {!readOnly && (
        <div className="flex items-center flex-wrap gap-1 p-2 bg-background border rounded-md mb-2">
          <MarkButton format="bold" icon={Bold} title="加粗 (Ctrl+B)" toggleMark={markToggle} editor={editor} />
          <MarkButton format="italic" icon={Italic} title="斜体 (Ctrl+I)" toggleMark={markToggle} editor={editor} />
          <MarkButton format="code" icon={Code} title="行内代码 (Ctrl+`)" toggleMark={markToggle} editor={editor} />
          <div className="border-r mx-1 h-6" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleBlock('heading-one')}
            className={isBlockActive('heading-one') ? 'bg-primary/20 text-primary' : ''}
            title="一级标题"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleBlock('heading-two')}
            className={isBlockActive('heading-two') ? 'bg-primary/20 text-primary' : ''}
            title="二级标题"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleBlock('block-quote')}
            className={isBlockActive('block-quote') ? 'bg-primary/20 text-primary' : ''}
            title="引用"
          >
            <Quote className="h-4 w-4" />
          </Button>
          
          <div className="border-r mx-1 h-6" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleBlock('bulleted-list')}
            className={isBlockActive('bulleted-list') ? 'bg-primary/20 text-primary' : ''}
            title="无序列表"
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleBlock('numbered-list')}
            className={isBlockActive('numbered-list') ? 'bg-primary/20 text-primary' : ''}
            title="有序列表"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <div className="border-r mx-1 h-6" />
          
          {onImageUpload && (
            <div className="relative">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleImageUpload}
                accept="image/*"
                disabled={isUploading}
              />
              <Button
                variant="ghost"
                size="sm"
                disabled={isUploading}
                title="上传图片"
              >
                <ImageIcon className="h-4 w-4" />
                {isUploading && <span className="ml-2">上传中...</span>}
              </Button>
            </div>
          )}
          
          <div className="flex-grow" />
          
          {onDraftChange && (
            <Button
              variant={isDraft ? "default" : "ghost"}
              size="sm"
              onClick={() => onDraftChange(!isDraft)}
              title={isDraft ? "发布为正式笔记" : "保存为草稿"}
            >
              {isDraft ? "发布正式" : "保存为草稿"}
            </Button>
          )}
          
          {onSave && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => saveContent()}
              title="保存 (Ctrl+S)"
            >
              <Save className="h-4 w-4 mr-1" />
            </Button>
          )}
        </div>
      )}
      <div 
        className={`slate-container border rounded-md p-3 ${readOnly ? 'bg-muted' : ''}`}
        style={{ minHeight }}
      >
        <Slate
          editor={editor}
          initialValue={value}
          onChange={handleChange}
        >
          <Editable
            className="outline-none min-h-full prose dark:prose-invert max-w-none"
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            spellCheck={false}
            autoFocus={!readOnly}
            readOnly={readOnly}
            onKeyDown={handleKeyDown}
            onCopy={handleCopy}
          />
        </Slate>
      </div>
    </div>
  );
};

export default MarkdownEditor; 