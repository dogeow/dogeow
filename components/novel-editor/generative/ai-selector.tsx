'use client'

import { Command, CommandInput } from '@/components/tailwind/ui/command'

import { useCompletion } from 'ai/react'
import { ArrowUp } from 'lucide-react'
import { useEditor } from 'novel'
import { addAIHighlight } from 'novel'
import { useState, useEffect } from 'react'
import MarkdownPreview from '../markdown-preview'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import CrazySpinner from '../ui/icons/crazy-spinner'
import Magic from '../ui/icons/magic'
import { ScrollArea } from '../ui/scroll-area'
import AICompletionCommands from './ai-completion-command'
import AISelectorCommands from './ai-selector-commands'
//TODO: I think it makes more sense to create a custom Tiptap extension for this functionality https://tiptap.dev/docs/editor/ai/introduction

interface AISelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AISelector({ onOpenChange }: AISelectorProps) {
  const { editor } = useEditor()
  const [inputValue, setInputValue] = useState('')
  const [originalSelection, setOriginalSelection] = useState<{ from: number; to: number } | null>(
    null
  )
  const [isMobile, setIsMobile] = useState(false)

  // 检测是否为移动设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const { completion, complete, isLoading } = useCompletion({
    // id: "novel",
    api: '/api/generate', // 使用真实API
    onResponse: response => {
      if (response.status === 429) {
        toast.error('You have reached your request limit for the day.')
        return
      }
      console.log('API Response status:', response.status)
    },
    onError: e => {
      console.error('AI API Error:', e)
      toast.error(e.message)
    },
  })

  const hasCompletion = completion.length > 0

  return (
    <Command className="w-[350px]">
      {hasCompletion && (
        <div className="flex max-h-[400px]">
          <ScrollArea>
            <div className="prose prose-sm p-2 px-4">
              <MarkdownPreview content={completion} />
            </div>
          </ScrollArea>
        </div>
      )}

      {isLoading && (
        <div className="text-muted-foreground flex h-12 w-full items-center px-4 text-sm font-medium text-purple-500">
          <Magic className="mr-2 h-4 w-4 shrink-0" />
          AI is thinking
          <div className="mt-1 ml-2">
            <CrazySpinner />
          </div>
        </div>
      )}
      {!isLoading && (
        <>
          <div className="relative">
            <CommandInput
              value={inputValue}
              onValueChange={setInputValue}
              autoFocus={!isMobile} // 移动端不自动focus，避免弹出键盘
              placeholder={
                hasCompletion ? 'Tell AI what to do next' : 'Ask AI to edit or generate...'
              }
              onFocus={() => editor && addAIHighlight(editor)}
            />
            <Button
              size="icon"
              className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 rounded-full bg-purple-500 hover:bg-purple-900"
              onClick={() => {
                if (completion)
                  return complete(completion, {
                    body: { option: 'zap', command: inputValue, text: completion },
                  }).then(() => setInputValue(''))

                if (!editor) return

                const slice = editor.state.selection.content()
                const text = editor.storage.markdown.serializer.serialize(slice.content)

                complete(text, {
                  body: { option: 'zap', command: inputValue, text },
                }).then(() => setInputValue(''))
              }}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
          {hasCompletion ? (
            <AICompletionCommands
              onDiscard={() => {
                if (editor) {
                  editor.chain().unsetHighlight().focus().run()
                }
                setOriginalSelection(null)
                onOpenChange(false)
              }}
              completion={completion}
              originalSelection={originalSelection}
            />
          ) : (
            <AISelectorCommands
              onSelect={(value, option) => {
                // 保存当前选择范围
                if (editor) {
                  const { from, to } = editor.state.selection
                  setOriginalSelection({ from, to })
                }
                complete(value, { body: { option, text: value } })
              }}
            />
          )}
        </>
      )}
    </Command>
  )
}
