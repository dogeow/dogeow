import { Markdown } from 'tiptap-markdown'

import {
  AIHighlight,
  CharacterCount,
  CodeBlockLowlight,
  Color,
  CustomKeymap,
  GlobalDragHandle,
  HighlightExtension,
  HorizontalRule,
  Mathematics,
  Placeholder,
  StarterKit,
  TaskItem,
  TaskList,
  TextStyle,
  TiptapImage,
  TiptapLink,
  TiptapUnderline,
  Twitter,
  UpdatedImage,
  UploadImagesPlugin,
  Youtube,
} from 'novel'

import { MarkdownCopyExtension } from './extensions/markdown-copy'

import { cx } from 'class-variance-authority'
import { common, createLowlight } from 'lowlight'

// TODO 我在这里用 cx 是为了让 tailwind 自动补全生效，如果有人能写个正则只捕获对象里的 class key 也可以
const aiHighlight = AIHighlight
// 你可以用自己的配置覆盖 placeholder
const placeholder = Placeholder
const tiptapLink = TiptapLink.configure({
  HTMLAttributes: {
    class: cx(
      'text-muted-foreground underline underline-offset-[3px] hover:text-primary transition-colors cursor-pointer'
    ),
  },
})

const tiptapImage = TiptapImage.extend({
  addProseMirrorPlugins() {
    return [
      UploadImagesPlugin({
        imageClass: cx('opacity-40 rounded-lg border border-stone-200'),
      }),
    ]
  },
}).configure({
  allowBase64: true,
  HTMLAttributes: {
    class: cx('rounded-lg border border-muted'),
  },
})

const updatedImage = UpdatedImage.configure({
  HTMLAttributes: {
    class: cx('rounded-lg border border-muted'),
  },
})

const taskList = TaskList.configure({
  HTMLAttributes: {
    class: cx('pl-2'),
  },
})
const taskItem = TaskItem.configure({
  HTMLAttributes: {
    class: cx('flex gap-2 items-start'),
  },
  nested: true,
})

const horizontalRule = HorizontalRule.configure({
  HTMLAttributes: {
    class: cx('mt-4 mb-6 border-t border-muted-foreground'),
  },
})

const starterKit = StarterKit.configure({
  bulletList: {
    HTMLAttributes: {
      class: cx('list-disc list-outside leading-3 -mt-2'),
    },
  },
  orderedList: {
    HTMLAttributes: {
      class: cx('list-decimal list-outside leading-3 -mt-2'),
    },
  },
  listItem: {
    HTMLAttributes: {
      class: cx('leading-normal -mb-2'),
    },
  },
  blockquote: {
    HTMLAttributes: {
      class: cx('border-l-4 border-primary px-2'),
    },
  },
  codeBlock: false, // 禁用内置的 codeBlock，使用 codeBlockLowlight 替代
  code: {
    HTMLAttributes: {
      class: cx('rounded-md bg-muted  px-1.5 py-1 font-mono font-medium'),
      spellcheck: 'false',
    },
  },
  horizontalRule: false,
  dropcursor: {
    color: '#DBEAFE',
    width: 4,
  },
  gapcursor: false,
})

const codeBlockLowlight = CodeBlockLowlight.configure({
  // 配置 lowlight：common / all / 也可以用 highlightJS，如果只需要指定某些语言语法
  // common：包含 37 种常用语言语法，大多数场景够用
  lowlight: createLowlight(common),
  HTMLAttributes: {
    class: cx(
      'rounded-md bg-muted text-muted-foreground border font-mono font-medium px-4 py-3 -mx-4 my-2'
    ),
  },
})

const youtube = Youtube.configure({
  HTMLAttributes: {
    class: cx('rounded-lg border border-muted'),
  },
  inline: false,
})

const twitter = Twitter.configure({
  HTMLAttributes: {
    class: cx(''),
  },
  inline: false,
})

const mathematics = Mathematics.configure({
  HTMLAttributes: {
    class: cx('text-foreground rounded p-1 hover:bg-accent cursor-pointer'),
  },
  katexOptions: {
    throwOnError: false,
  },
})

const characterCount = CharacterCount.configure()

const markdownExtension = Markdown.configure({
  html: true,
  tightLists: true,
  tightListClass: 'tight',
  bulletListMarker: '-',
  linkify: false,
  breaks: false,
  transformPastedText: true, // 启用粘贴文本转换，将markdown转换为富文本
  transformCopiedText: true, // 启用复制文本转换，将富文本转换为markdown
})

export const defaultExtensions = [
  starterKit,
  placeholder,
  tiptapLink,
  tiptapImage,
  updatedImage,
  taskList,
  taskItem,
  horizontalRule,
  aiHighlight,
  codeBlockLowlight,
  youtube,
  twitter,
  mathematics,
  characterCount,
  TiptapUnderline,
  markdownExtension,
  HighlightExtension,
  TextStyle,
  Color,
  CustomKeymap,
  GlobalDragHandle,
  MarkdownCopyExtension,
]
