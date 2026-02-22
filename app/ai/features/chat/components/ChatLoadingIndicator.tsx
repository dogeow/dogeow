import React from 'react'
import Image from 'next/image'
import { SimpleMarkdown } from './SimpleMarkdown'

interface ChatLoadingIndicatorProps {
  completion?: string
  variant?: 'dialog' | 'page'
}

export const ChatLoadingIndicator = React.memo<ChatLoadingIndicatorProps>(
  ({ completion, variant = 'page' }) => {
    if (variant === 'dialog') {
      return (
        <div className="flex w-full justify-start">
          <div className="flex w-full min-w-0 flex-col items-start">
            {completion ? (
              <>
                <div className="bg-muted text-foreground w-full rounded-xl px-3 py-2 break-words">
                  <div className="[&_.prose]:prose-neutral [&_.prose_*]:!text-foreground [&_.prose]:my-0 [&_.prose_p]:!my-0 [&_.prose_p]:!mt-0 [&_.prose_p]:!mb-0">
                    <SimpleMarkdown content={completion} />
                  </div>
                </div>
                <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-current" />
                  <span>正在输入...</span>
                </div>
              </>
            ) : (
              <div className="bg-muted text-foreground w-full rounded-xl px-3 py-2 break-words">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div
                      className="bg-muted-foreground/50 h-2 w-2 animate-bounce rounded-full"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="bg-muted-foreground/50 h-2 w-2 animate-bounce rounded-full"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="bg-muted-foreground/50 h-2 w-2 animate-bounce rounded-full"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                  <span className="text-muted-foreground text-sm">正在思考...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    // page variant
    return (
      <div className="flex gap-3">
        <div className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full">
          <Image
            src="/80.png"
            alt="DogeOW Logo"
            width={32}
            height={32}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex max-w-[75%] flex-col items-start">
          <div className="bg-muted text-foreground rounded-2xl px-4 py-2.5">
            {completion ? (
              <SimpleMarkdown content={completion} />
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div
                    className="bg-muted-foreground/50 h-2 w-2 animate-bounce rounded-full"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="bg-muted-foreground/50 h-2 w-2 animate-bounce rounded-full"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="bg-muted-foreground/50 h-2 w-2 animate-bounce rounded-full"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <span className="text-muted-foreground text-sm">正在思考...</span>
              </div>
            )}
          </div>
          {completion && (
            <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
              <div className="h-2 w-2 animate-pulse rounded-full bg-current" />
              <span>正在输入...</span>
            </div>
          )}
        </div>
      </div>
    )
  }
)

ChatLoadingIndicator.displayName = 'ChatLoadingIndicator'
