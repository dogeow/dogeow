import { Editor, Element as SlateElement, Node, NodeEntry, Path, Point, Transforms } from 'slate'
import { ExtendedEditor, TokenRange } from './types'
import Prism from 'prismjs'

// 加载 Prism 语言
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-php'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-scss'
import 'prismjs/components/prism-swift'

// 获取代码块节点的装饰范围
export const getChildNodeToDecorations = ([block, blockPath]: NodeEntry<SlateElement>): Map<SlateElement, TokenRange[]> => {
  const nodeToDecorations = new Map<SlateElement, TokenRange[]>();
  
  if (!('type' in block) || block.type !== 'code-block' || !block.language) {
    return nodeToDecorations;
  }

  try {
    // 获取代码块的所有文本
    const text = Node.string(block);
    if (!text) return nodeToDecorations;
    
    const language = block.language;
    
    // 确保语言已加载
    let grammar = Prism.languages[language];
    if (!grammar) {
      console.warn(`没有找到语言: ${language}, 使用普通文本`);
      grammar = Prism.languages.text || {};
    }
    
    // 使用 Prism 标记化文本 - 使用 try-catch 避免可能的错误
    let tokens;
    try {
      tokens = Prism.tokenize(text, grammar);
    } catch (err) {
      console.warn(`标记化失败: ${err}, 使用普通文本`);
      // 如果标记化失败，将整个文本作为一个标记处理
      tokens = [text];
    }
    
    // 使用数组存储范围
    const ranges: TokenRange[] = [];
    
    // 递归处理 tokens 并生成装饰范围
    const processTokens = (tokens: (string | Prism.Token)[], offset = 0) => {
      let currentOffset = offset;
      
      for (const token of tokens) {
        if (typeof token === 'string') {
          // 纯文本标记 - 跳过，不需要高亮
          currentOffset += token.length;
        } else {
          const { content, type } = token;
          
          // 处理字符串内容
          if (typeof content === 'string') {
            // 单个 token
            const tokenLength = content.length;
            
            if (tokenLength > 0) {
              // 创建范围对象并包含token类型
              const range: TokenRange = {
                anchor: { path: blockPath, offset: currentOffset },
                focus: { path: blockPath, offset: currentOffset + tokenLength },
                token: true,
                [type]: true
              };
              
              ranges.push(range);
              currentOffset += tokenLength;
            }
          } 
          // 处理嵌套内容
          else if (Array.isArray(content)) {
            // 递归前的准备工作 - 计算总长度
            let totalLength = 0;
            const calculateLength = (items: (string | Prism.Token)[]) => {
              for (const item of items) {
                if (typeof item === 'string') {
                  totalLength += item.length;
                } else if (typeof item.content === 'string') {
                  totalLength += item.content.length;
                } else if (Array.isArray(item.content)) {
                  calculateLength(item.content);
                }
              }
            };
            
            calculateLength(content);
            
            // 为父 token 创建一个范围
            if (totalLength > 0) {
              const parentRange: TokenRange = {
                anchor: { path: blockPath, offset: currentOffset },
                focus: { path: blockPath, offset: currentOffset + totalLength },
                token: true,
                [type]: true
              };
              
              ranges.push(parentRange);
            }
            
            // 递归处理嵌套标记
            processTokens(content, currentOffset);
            currentOffset += totalLength;
          }
        }
      }
      
      return currentOffset;
    };
    
    processTokens(tokens);
    
    // 只有当有范围时才设置
    if (ranges.length > 0) {
      nodeToDecorations.set(block, ranges);
    }
    
  } catch (error) {
    console.error('代码高亮处理错误:', error);
  }
  
  return nodeToDecorations;
};

// 检查代码块标记（当输入 ``` 后按回车）
export const checkCodeBlock = (editor: ExtendedEditor, updateHighlighting: () => void): boolean => {
  try {
    // 获取当前选区
    const { selection } = editor;
    if (!selection) return false;
    
    // 获取当前行
    const [block, path] = Editor.above(editor, {
      match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
    }) || [];
    
    if (!block) return false;
    
    // 检查是否已经是代码块
    if (('type' in block) && block.type === 'code-block') {
      return false;
    }
    
    // 获取当前行内容
    const text = block ? Node.string(block) : '';
    
    // 检查是否是代码块开始标记 ```language
    const codeMatch = /^```(\w*)$/.exec(text);
    
    if (codeMatch) {
      // 获取语言（如果有）
      const language = codeMatch[1] || 'text';
      
      // 删除原来的内容
      if (path) {
        Transforms.delete(editor, {
          at: {
            anchor: Editor.start(editor, path),
            focus: Editor.end(editor, path),
          },
        });
        
        // 转换为代码块
        Transforms.setNodes(
          editor,
          { type: 'code-block', language },
          { at: path }
        );
      }
      
      // 添加空行
      if (selection && selection.anchor) {
        Transforms.insertText(editor, '', { at: selection.anchor });
      }
      
      // 强制更新高亮
      setTimeout(() => updateHighlighting(), 10);
      
      return true;
    }
  } catch (error) {
    console.error('代码块检测错误:', error);
  }
  
  return false;
};

// 处理代码块中的Tab键
export const handleCodeBlockTab = (
  event: React.KeyboardEvent<HTMLDivElement>, 
  editor: ExtendedEditor,
  updateHighlighting: () => void
): boolean => {
  // 检查当前是否在代码块中
  const [match] = Editor.nodes(editor, {
    match: n => SlateElement.isElement(n) && 'type' in n && n.type === 'code-block',
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
      const text = fragment.map(n => Node.string(n)).join('\n');
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
        Transforms.delete(editor, { at: selection });
        Transforms.insertText(editor, newText, { at: selection.anchor });
      } else {
        // 缩进: 在每行开头添加两个空格
        const newText = lines.map(line => `  ${line}`).join('\n');
        
        // 替换选中的文本
        Transforms.delete(editor, { at: selection });
        Transforms.insertText(editor, newText, { at: selection.anchor });
      }
      
      // 更新代码高亮
      requestAnimationFrame(() => {
        updateHighlighting();
      });
      
      return true;
    } else {
      // 没有选中的文本，插入两个空格作为缩进
      if (!event.shiftKey) {
        // 常规 Tab - 插入两个空格
        Editor.insertText(editor, '  ');
      } else {
        // Shift+Tab - 移除前面的两个空格或一个制表符
        const { anchor } = selection;
        const currentLineStart = { 
          path: anchor.path, 
          offset: 0 
        };
        
        // 获取当前行的文本
        const currentLineRange = { 
          anchor: currentLineStart, 
          focus: anchor 
        };
        const lineText = Editor.string(editor, currentLineRange);
        
        // 如果当前行以两个空格或制表符开头，删除它们
        if (lineText.startsWith('  ')) {
          // 删除两个空格
          Transforms.delete(editor, { 
            at: { 
              anchor: currentLineStart, 
              focus: { path: anchor.path, offset: 2 } 
            }
          });
        } else if (lineText.startsWith('\t')) {
          // 删除一个制表符
          Transforms.delete(editor, { 
            at: { 
              anchor: currentLineStart, 
              focus: { path: anchor.path, offset: 1 } 
            }
          });
        }
      }
      
      // 更新代码高亮
      requestAnimationFrame(() => {
        updateHighlighting();
      });
      
      return true;
    }
  }
  
  return false;
};

// 合并多个Map
export const mergeMaps = <K, V>(...maps: Map<K, V>[]) => {
  const map = new Map<K, V>();
  
  for (const m of maps) {
    for (const [key, value] of m) {
      map.set(key, value);
    }
  }
  
  return map;
}; 