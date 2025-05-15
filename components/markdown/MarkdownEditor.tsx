"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Slate, Editable, RenderElementProps, RenderLeafProps } from 'slate-react'
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, Code, Save, Quote, Heading1, Heading2, ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { ElementType, CustomElement, CustomText } from './types'
import { useMarkdownEditor } from './hooks/useMarkdownEditor'
import { handleCodeBlockTab, handleCopyWithSyntaxHighlighting } from './utils'

export interface MarkdownEditorProps {
  initialContent?: string;
  onSave?: (content: string) => Promise<void>;
  onImageUpload?: (file: File) => Promise<{ url: string; path: string; }>;
  readOnly?: boolean;
  minHeight?: string;
  placeholder?: string;
}

// 主MarkdownEditor组件
const MarkdownEditor = ({
  initialContent = '',
  onSave,
  onImageUpload,
  readOnly = false,
  minHeight = '300px',
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
    isMarkActive,
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
              <img
                src={elementWithType.url}
                alt="上传的图片"
                className="max-w-full max-h-[500px] object-contain rounded-md"
              />
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
  
  // 自定义工具栏
  const Toolbar = useCallback(({ children }: { children: React.ReactNode }) => {
    return (
      <div className="flex items-center flex-wrap gap-1 p-2 bg-background border rounded-md mb-2">
        {children}
      </div>
    );
  }, []);
  
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

  // 渲染组件
  return (
    <div className="markdown-editor w-full">
      {/* 工具栏（只在非只读模式显示） */}
      {!readOnly && (
        <Toolbar>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleMark('bold')}
            className={isMarkActive('bold') ? 'bg-accent text-accent-foreground' : ''}
            title="加粗 (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleMark('italic')}
            className={isMarkActive('italic') ? 'bg-accent text-accent-foreground' : ''}
            title="斜体 (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleMark('code')}
            className={isMarkActive('code') ? 'bg-accent text-accent-foreground' : ''}
            title="行内代码 (Ctrl+`)"
          >
            <Code className="h-4 w-4" />
          </Button>
          
          <div className="border-r mx-1 h-6" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleBlock('heading-one')}
            className={isBlockActive('heading-one') ? 'bg-accent text-accent-foreground' : ''}
            title="一级标题"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleBlock('heading-two')}
            className={isBlockActive('heading-two') ? 'bg-accent text-accent-foreground' : ''}
            title="二级标题"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleBlock('block-quote')}
            className={isBlockActive('block-quote') ? 'bg-accent text-accent-foreground' : ''}
            title="引用"
          >
            <Quote className="h-4 w-4" />
          </Button>
          
          <div className="border-r mx-1 h-6" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleBlock('bulleted-list')}
            className={isBlockActive('bulleted-list') ? 'bg-accent text-accent-foreground' : ''}
            title="无序列表"
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleBlock('numbered-list')}
            className={isBlockActive('numbered-list') ? 'bg-accent text-accent-foreground' : ''}
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
          
          {onSave && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => saveContent()}
              title="保存 (Ctrl+S)"
            >
              <Save className="h-4 w-4 mr-1" />
              保存
            </Button>
          )}
        </Toolbar>
      )}
      
      {/* 编辑器核心 */}
      <div 
        className={`slate-container border rounded-md p-3 ${readOnly ? 'bg-muted' : ''}`}
        style={{ minHeight }}
      >
        <Slate
          editor={editor}
          initialValue={value}
          onChange={value => setValue(value)}
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