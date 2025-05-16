import { BaseEditor, Descendant } from 'slate'
import { ReactEditor } from 'slate-react'
import { HistoryEditor } from 'slate-history'
import { Range as SlateRange } from 'slate'

// 定义自定义元素类型
export type CustomElement = {
  type: 'paragraph' | 'heading-one' | 'heading-two' | 'heading-three' | 
        'bulleted-list' | 'numbered-list' | 'list-item' | 'block-quote' |
        'code-block' | 'table' | 'table-row' | 'table-cell' | 'image';
  children: (CustomText | CustomElement)[];
  url?: string;
  language?: string;
}

// 定义自定义文本类型，扩展支持代码高亮
export type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  link?: boolean;
  url?: string;
  // 代码高亮相关属性
  token?: boolean;
  comment?: boolean;
  operator?: boolean;
  urlLink?: boolean;
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
}

// 范围类型
export interface TokenRange extends SlateRange {
  token: boolean
  [key: string]: any
}

// 创建扩展编辑器类型
export type ExtendedEditor = BaseEditor & ReactEditor & HistoryEditor & {
  nodeToDecorations?: Map<CustomElement, TokenRange[]>
}

// 元素节点类型
export type ElementType = CustomElement['type']

// 热键定义
export const HOTKEYS: Record<string, keyof Omit<CustomText, 'text'>> = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+`': 'code',
  'mod+\\': 'code',
  'mod+k': 'link',
}

// 定义列表类型
export const LIST_TYPES = ['numbered-list', 'bulleted-list']

// 定义块级元素类型
export const BLOCK_TYPES = ['paragraph', 'heading-one', 'heading-two', 'heading-three', 'block-quote', 'code-block']

// 初始内容
export const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  }
] 