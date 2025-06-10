import { useState, useCallback, useMemo } from 'react'
import { createEditor, Descendant, Editor, Element as SlateElement, Transforms } from 'slate'
import { withHistory } from 'slate-history'
import { withReact } from 'slate-react'
import isHotkey from 'is-hotkey'
import { ElementType, HOTKEYS, LIST_TYPES, initialValue, ExtendedEditor, CustomText } from '../types'
import { CustomElement } from '@/app/note/types/editor'
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
  // 创建编辑器实例
  const editor = useMemo(() => 
    withMarkdownShortcuts(withHistory(withReact(createEditor() as ExtendedEditor))),
  []);

  // 初始化编辑器内容
  const [value, setValue] = useState<Descendant[]>(() => {
    if (!initialContent) return initialValue;
    try {
      return JSON.parse(initialContent);
    } catch {
      return [{ type: 'paragraph', children: [{ text: initialContent }] }];
    }
  });
  
  const [isUploading, setIsUploading] = useState(false);
  
  // 更新高亮函数 - 用于强制重新渲染编辑器以更新语法高亮
  const updateHighlighting = useCallback(() => {
    // 使用更安全的方式来触发重新渲染，避免影响光标位置
    // 只有在编辑器有选区时才进行操作
    if (editor.selection) {
      // 保存当前选区
      const currentSelection = editor.selection;
      
      // 使用 requestAnimationFrame 来延迟更新，避免干扰当前的键盘事件
      requestAnimationFrame(() => {
        try {
          // 恢复选区（如果它仍然有效）
          if (currentSelection && Editor.hasPath(editor, currentSelection.anchor.path)) {
            Transforms.select(editor, currentSelection);
          }
        } catch (error) {
          // 如果恢复选区失败，忽略错误
          console.debug('恢复选区失败:', error);
        }
      });
    }
  }, [editor]);
  
  // 保存内容
  const handleSave = useCallback(async () => {
    if (!onSave) return false;
    
    try {
      await onSave(JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('保存失败:', error);
      return false;
    }
  }, [value, onSave]);

  // 检查标记是否激活
  const isMarkActive = useCallback((format: keyof Omit<CustomText, 'text'>) => {
    const marks = Editor.marks(editor);
    return marks?.[format] === true;
  }, [editor]);

  // 格式切换
  const toggleMark = useCallback((format: keyof Omit<CustomText, 'text'>) => {
    const isActive = isMarkActive(format);
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  }, [editor, isMarkActive]);
  
  // 检查块格式是否激活
  const isBlockActive = useCallback((format: ElementType) => {
    const [match] = Editor.nodes(editor, {
      match: n => SlateElement.isElement(n) && (n as CustomElement).type === format,
    });
    return !!match;
  }, [editor]);

  // 切换块格式
  const toggleBlock = useCallback((format: ElementType) => {
    const isActive = isBlockActive(format);
    const isList = LIST_TYPES.includes(format);
    
    Transforms.unwrapNodes(editor, {
      match: n => SlateElement.isElement(n) && LIST_TYPES.includes((n as CustomElement).type),
      split: true,
    });
    
    Transforms.setNodes(
      editor,
      { type: isActive ? 'paragraph' : isList ? 'list-item' : format } as Partial<SlateElement>
    );
    
    if (!isActive && isList) {
      const block = { type: format, children: [] } as unknown as CustomElement;
      Transforms.wrapNodes(editor, block);
    }
  }, [editor, isBlockActive]);

  // 键盘处理程序
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    // 允许正常的光标移动键（箭头键、Home、End等）正常工作
    const navigationKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];
    if (navigationKeys.includes(event.key)) {
      // 不阻止导航键的默认行为，让Slate自己处理
      return;
    }
    
    // 热键处理 - 只处理特定的格式化热键
    for (const hotkey in HOTKEYS) {
      if (isHotkey(hotkey, event)) {
        event.preventDefault();
        toggleMark(HOTKEYS[hotkey]);
        return;
      }
    }
    
    // Tab键处理
    if (event.key === 'Tab') {
      if (handleCodeBlockTab(event, editor, updateHighlighting)) return;
    }

    // Enter键处理
    if (event.key === 'Enter' && checkCodeBlock(editor, updateHighlighting)) {
      event.preventDefault();
      return;
    }
    
    // 退格键处理
    if (event.key === 'Backspace' && editor.selection) {
      const [listItem] = Editor.nodes(editor, {
        match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'list-item',
      });
      
      if (listItem && Editor.isStart(editor, editor.selection.anchor, listItem[1])) {
        event.preventDefault();
        const [parent] = Editor.parent(editor, listItem[1]);
        const isLastItem = parent.children.length === 1;
        
        if (isLastItem) {
          Transforms.unwrapNodes(editor, {
            match: n => SlateElement.isElement(n) && LIST_TYPES.includes((n as CustomElement).type),
            split: true,
          });
          Transforms.setNodes(
            editor,
            { type: 'paragraph' },
            { match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'list-item' }
          );
        } else {
          Transforms.setNodes(editor, { type: 'paragraph' }, { at: listItem[1] });
          Transforms.liftNodes(editor, { at: listItem[1] });
        }
      }
    }
  }, [editor, toggleMark, updateHighlighting]);

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