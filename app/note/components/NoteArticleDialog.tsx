import React from 'react'
import dynamic from 'next/dynamic'
import * as Dialog from '@radix-ui/react-dialog'
import type { NodeData, ThemeColors, JSONContent } from '../types/graph'

const ReadonlyEditor = dynamic(() => import('@/components/novel-editor/readonly'), {
  ssr: false,
})

const MarkdownPreview = dynamic(() => import('@/components/novel-editor/markdown-preview'), {
  ssr: false,
})

interface ArticleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeNode: NodeData | null
  articleHtml: string
  articleRaw: string
  articleJson: JSONContent | null
  loadingArticle: boolean
  articleError: string
  isDark: boolean
  themeColors: ThemeColors
}

export function NoteArticleDialog({
  open,
  onOpenChange,
  activeNode,
  articleHtml,
  articleRaw,
  articleJson,
  loadingArticle,
  articleError,
  isDark,
  themeColors,
}: ArticleDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)',
            zIndex: 50,
          }}
        />
        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(880px, 92vw)',
            maxHeight: '85vh',
            background: themeColors.card,
            borderRadius: 12,
            boxShadow: isDark ? '0 16px 50px rgba(0,0,0,0.6)' : '0 10px 40px rgba(0,0,0,0.2)',
            zIndex: 51,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: `1px solid ${themeColors.border}`,
              gap: 8,
            }}
          >
            <Dialog.Title style={{ fontSize: 18, fontWeight: 600, flex: 1 }}>
              {activeNode?.title ?? '文章'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                aria-label="Close"
                style={{
                  padding: '6px 8px',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: 6,
                  background: themeColors.card,
                  color: themeColors.foreground,
                }}
              >
                关闭
              </button>
            </Dialog.Close>
          </div>
          <div
            style={{
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              overflowY: 'auto',
            }}
          >
            {activeNode?.tags?.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {activeNode.tags.map(t => (
                  <span
                    key={t}
                    style={{
                      fontSize: 12,
                      padding: '2px 6px',
                      border: `1px solid ${themeColors.border}`,
                      borderRadius: 999,
                      color: themeColors.mutedForeground,
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            ) : null}
            {activeNode?.summary ? (
              <p style={{ color: themeColors.mutedForeground }}>{activeNode.summary}</p>
            ) : null}
            <div style={{ borderTop: `1px solid ${themeColors.border}`, paddingTop: 12 }}>
              {loadingArticle ? (
                <div style={{ color: themeColors.mutedForeground }}>加载中...</div>
              ) : articleError ? (
                <div style={{ color: '#dc2626' }}>加载失败：{articleError}</div>
              ) : articleRaw ? (
                <MarkdownPreview content={articleRaw} />
              ) : articleHtml ? (
                <div
                  className={`prose prose-slate max-w-none ${isDark ? 'prose-invert' : ''}`}
                  dangerouslySetInnerHTML={{ __html: articleHtml }}
                />
              ) : articleJson ? (
                <ReadonlyEditor content={articleJson} />
              ) : (
                <div style={{ color: themeColors.mutedForeground }}>点击节点以加载文章</div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
