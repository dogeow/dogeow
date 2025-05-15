import { useState, useCallback, useMemo } from 'react'
import { createEditor, Descendant, Editor, Element as SlateElement, Transforms } from 'slate'
import { withHistory } from 'slate-history'
import { withReact } from 'slate-react'
import isHotkey from 'is-hotkey'
import { ElementType, HOTKEYS, LIST_TYPES, initialValue, ExtendedEditor, CustomElement } from '../types'
import { withMarkdownShortcuts } from '../plugins/withMarkdownShortcuts'
import { checkCodeBlock, handleCodeBlockTab } from '../prism-utils'

export interface UseMarkdownEditorProps {
  initialContent?: string;
  onSave?: (content: string) => Promise<void>;
}

export const useMarkdownEditor = ({
  initialContent = '',
  onSave
}: UseMarkdownEditorProps) => {
  // 把纯文本转换为Slate格式
  const deserializeContent = (content: string): Descendant[] => {
    if (!content) return initialValue;
  
    // 尝试解析JSON内容
    try {
      return JSON.parse(content)
    } catch (error) {
      // 如果不是JSON，就把它当作普通文本处理
      return [
        {
          type: 'paragraph',
          children: [{ text: content }],
        },
      ]
    }
  }
  
  // 序列化Slate内容为JSON字符串
  const serializeContent = (value: Descendant[]): string => {
    return JSON.stringify(value)
  }

  // 创建编辑器实例
  const editor = useMemo(() => {
    // 创建具有markdown快捷方式支持的编辑器
    return withMarkdownShortcuts(withHistory(withReact(createEditor() as ExtendedEditor)));
  }, []);

  // 初始化编辑器内容
  const [value, setValue] = useState<Descendant[]>(() => deserializeContent(initialContent));
  
  // 状态
  const [isUploading, setIsUploading] = useState(false);
  
  // 强制更新高亮的函数
  const updateHighlighting = useCallback(() => {
    // 找到所有代码块
    const entries = Array.from(
      Editor.nodes<SlateElement>(editor, {
        at: [],
        match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'code-block',
      })
    );
    
    // 触发编辑器重新渲染
    if (editor.selection) {
      const point = { ...editor.selection.anchor };
      const focus = editor.selection.focus ? { ...editor.selection.focus } : point;
      editor.selection = { anchor: point, focus };
    }
  }, [editor]);
  
  // 保存内容
  const handleSave = useCallback(async () => {
    if (onSave) {
      try {
        await onSave(serializeContent(value));
        return true;
      } catch (error) {
        console.error('保存失败:', error);
        return false;
      }
    }
    return false;
  }, [value, onSave]);

  // 键盘处理程序
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    // 热键处理
    for (const hotkey in HOTKEYS) {
      if (isHotkey(hotkey, event)) {
        event.preventDefault();
        const mark = HOTKEYS[hotkey];
        toggleMark(mark);
        return;
      }
    }
    
    // Tab键处理
    if (event.key === 'Tab') {
      // 先尝试在代码块内处理Tab
      const handledInCodeBlock = handleCodeBlockTab(event, editor, updateHighlighting);
      if (handledInCodeBlock) return;
    }

    // Enter键处理
    if (event.key === 'Enter') {
      // 检查是否在代码块开始处理
      const handledCodeBlock = checkCodeBlock(editor, updateHighlighting);
      if (handledCodeBlock) {
        event.preventDefault();
        return;
      }
    }
    
    // 退格键处理
    if (event.key === 'Backspace') {
      const { selection } = editor;
      if (selection) {
        const [listItem] = Editor.nodes(editor, {
          match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'list-item',
        });
        
        if (listItem) {
          const [node, path] = listItem;
          const start = Editor.start(editor, path);
          
          // 如果光标在列表项的开头，则移除列表格式
          if (Editor.isStart(editor, selection.anchor, path)) {
            event.preventDefault();
            
            // 获取父元素（列表）
            const [parent, parentPath] = Editor.parent(editor, path);
            
            // 检查列表中剩余的项目数
            const isLastItem = parent.children.length === 1;
            
            if (isLastItem) {
              // 如果是最后一项，解除整个列表
              Transforms.unwrapNodes(editor, {
                match: n => SlateElement.isElement(n) && 
                  LIST_TYPES.includes((n as CustomElement).type),
                split: true,
              });
              
              // 将列表项转换为段落
              Transforms.setNodes(
                editor,
                { type: 'paragraph' },
                { match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'list-item' }
              );
            } else {
              // 否则，将当前列表项转换为段落并提升到列表之外
              Transforms.setNodes(
                editor,
                { type: 'paragraph' },
                { at: path }
              );
              Transforms.liftNodes(editor, { at: path });
            }
            return;
          }
        }
      }
    }
  }, [editor, updateHighlighting]);

  // 格式切换
  const toggleMark = useCallback((format: string) => {
    const isActive = isMarkActive(format);
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  }, [editor]);
  
  // 检查标记是否激活
  const isMarkActive = useCallback((format: string) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
  }, [editor]);
  
  // 切换块格式
  const toggleBlock = useCallback((format: ElementType) => {
    const isActive = isBlockActive(format);
    const isList = LIST_TYPES.includes(format);
    
    Transforms.unwrapNodes(editor, {
      match: n => SlateElement.isElement(n) && 
        LIST_TYPES.includes((n as CustomElement).type),
      split: true,
    });
    
    Transforms.setNodes(
      editor,
      {
        type: isActive ? 'paragraph' : isList ? 'list-item' : format,
      } as Partial<SlateElement>
    );
    
    if (!isActive && isList) {
      const block = { type: format, children: [] } as CustomElement;
      Transforms.wrapNodes(editor, block);
    }
  }, [editor]);
  
  // 检查块格式是否激活
  const isBlockActive = useCallback((format: ElementType) => {
    const [match] = Editor.nodes(editor, {
      match: n => SlateElement.isElement(n) && (n as CustomElement).type === format,
    });
    return !!match;
  }, [editor]);

  return {
    editor,
    value,
    setValue,
    isUploading,
    setIsUploading,
    updateHighlighting,
    handleSave,
    handleKeyDown,
    toggleMark,
    isMarkActive,
    toggleBlock,
    isBlockActive,
  };
};

export default useMarkdownEditor; 