import { BaseEditor } from 'slate'
import { ReactEditor } from 'slate-react'
import { HistoryEditor } from 'slate-history'

// 定义自定义元素类型
export type CustomElement = {
  type: 'paragraph' | 'heading-one' | 'heading-two' | 'heading-three' | 
        'bulleted-list' | 'numbered-list' | 'list-item' | 'block-quote' |
        'code-block' | 'table' | 'table-row' | 'table-cell';
  children: CustomText[] | CustomElement[];
  url?: string;
  language?: string;
}

// 定义自定义文本类型
export type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  link?: boolean;
  url?: string;
}

// 笔记类型
export type Note = {
  id: number;
  title: string;
  content: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

// 声明 Slate 编辑器元素类型
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: CustomElement
    Text: CustomText
  }
}

// 使 Descendant 类型明确为我们自定义的类型之一
export type CustomDescendant = CustomElement | CustomText

// 热键定义
export const HOTKEYS = {
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

// 初始编辑器值
export const initialValue = [
  {
    type: 'paragraph',
    children: [
      { text: '' },
    ],
  }
] 