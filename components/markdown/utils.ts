import { Editor, Element as SlateElement, Point, Range, Transforms } from 'slate'
import { ExtendedEditor, CustomElement } from './types'

// 处理代码块中的Tab键
export const handleCodeBlockTab = (
  event: React.KeyboardEvent<HTMLDivElement>, 
  editor: ExtendedEditor,
  updateHighlighting: () => void
): boolean => {
  // 检查当前是否在代码块中
  const [match] = Editor.nodes(editor, {
    match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'code-block',
  });
  
  if (!match) {
    return false;
  }
  
  const [codeBlock, path] = match;
  
  // 处理 Tab 键
  if (event.key === 'Tab') {
    event.preventDefault();
    
    // 获取当前选区
    const { selection } = editor;
    if (!selection) return true;
    
    // 检查是否有选中的文本
    if (!Point.equals(selection.anchor, selection.focus)) {
      // 有选中的文本，处理多行缩进/反缩进
      const fragment = Editor.fragment(editor, selection);
      const text = fragment.map(n => Editor.string(editor, n)).join('\n');
      const lines = text.split('\n');
      
      // 对选中的每一行应用缩进/反缩进
      if (event.shiftKey) {
        // 反缩进: 移除每行开头的两个空格或一个制表符
        const newText = lines.map(line => {
          if (line.startsWith('  ')) return line.slice(2);
          if (line.startsWith('\t')) return line.slice(1);
          return line;
        }).join('\n');
        
        // 替换选中的文本
        Transforms.delete(editor);
        Transforms.insertText(editor, newText);
      } else {
        // 缩进: 在每行开头添加两个空格
        const newText = lines.map(line => '  ' + line).join('\n');
        
        // 替换选中的文本
        Transforms.delete(editor);
        Transforms.insertText(editor, newText);
      }
      
      // 更新高亮
      setTimeout(() => updateHighlighting(), 10);
      
      return true;
    } else {
      // 没有选中的文本，插入两个空格
      if (!event.shiftKey) {
        Transforms.insertText(editor, '  ');
        setTimeout(() => updateHighlighting(), 10);
        return true;
      }
    }
  }
  
  return false;
};

// 将编辑器内容序列化为普通文本（用于复制）
export const serializeToText = (nodes: any[]): string => {
  return nodes
    .map(n => {
      if (n.text) {
        return n.text;
      }
      
      const type = n.type || 'paragraph';
      const children = serializeToText(n.children || []);
      
      switch (type) {
        case 'paragraph':
          return children + '\n\n';
        case 'heading-one':
          return '# ' + children + '\n\n';
        case 'heading-two':
          return '## ' + children + '\n\n';
        case 'heading-three':
          return '### ' + children + '\n\n';
        case 'block-quote':
          return '> ' + children.replace(/\n/g, '\n> ') + '\n\n';
        case 'code-block':
          const language = n.language || '';
          return '```' + language + '\n' + children + '\n```\n\n';
        case 'bulleted-list':
          return children;
        case 'numbered-list':
          return children;
        case 'list-item':
          return '- ' + children + '\n';
        default:
          return children;
      }
    })
    .join('');
};

// 处理复制高亮代码
export const handleCopyWithSyntaxHighlighting = (
  event: React.ClipboardEvent,
  editor: ExtendedEditor
): boolean => {
  // 检查是否在代码块中
  const [match] = Editor.nodes(editor, {
    match: n => SlateElement.isElement(n) && (n as CustomElement).type === 'code-block',
  });
  
  if (!match || !editor.selection) {
    return false;
  }
  
  // 获取选中的文本
  const text = Editor.string(editor, editor.selection);
  if (!text) return false;
  
  // 设置剪贴板内容
  event.clipboardData.setData('text/plain', text);
  event.preventDefault();
  
  return true;
};

// 格式化Markdown函数
export const formatMarkdown = (value: any[]): string => {
  return serializeToText(value);
}; 