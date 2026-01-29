import React from 'react'
import { X, Tag, FileText } from 'lucide-react'
import type { NodeData, ThemeColors } from '../types'

interface NodeDetailsPanelProps {
  node: NodeData | null
  isOpen: boolean
  onClose: () => void
  themeColors: ThemeColors
  onViewArticle: () => void
}

export function NodeDetailsPanel({
  node,
  isOpen,
  onClose,
  themeColors,
  onViewArticle,
}: NodeDetailsPanelProps) {
  if (!isOpen || !node) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        right: 20,
        width: 320,
        maxHeight: 'calc(100vh - 80px)',
        zIndex: 20,
        background: themeColors.card,
        border: `1px solid ${themeColors.border}`,
        borderRadius: 12,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
        color: themeColors.cardForeground,
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: `1px solid ${themeColors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: themeColors.card,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontWeight: '600',
            fontSize: 16,
            color: themeColors.cardForeground,
          }}
        >
          节点详情
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: themeColors.mutedForeground,
            cursor: 'pointer',
            padding: 4,
            borderRadius: 4,
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: 16, overflowY: 'auto', maxHeight: 'calc(100vh - 160px)' }}>
        <div style={{ marginBottom: 16 }}>
          <h4
            style={{
              margin: '0 0 8px 0',
              fontWeight: '600',
              fontSize: 14,
              color: themeColors.cardForeground,
            }}
          >
            标题
          </h4>
          <p
            style={{
              margin: 0,
              padding: 8,
              background: themeColors.background,
              borderRadius: 6,
              color: themeColors.cardForeground,
            }}
          >
            {node.title}
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <h4
            style={{
              margin: '0 0 8px 0',
              fontWeight: '600',
              fontSize: 14,
              color: themeColors.cardForeground,
            }}
          >
            Slug
          </h4>
          <p
            style={{
              margin: 0,
              padding: 8,
              background: themeColors.background,
              borderRadius: 6,
              color: themeColors.cardForeground,
              wordBreak: 'break-all',
            }}
          >
            {node.slug}
          </p>
        </div>

        {node.tags && node.tags.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h4
              style={{
                margin: '0 0 8px 0',
                fontWeight: '600',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: themeColors.cardForeground,
              }}
            >
              <Tag size={14} />
              标签
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {node.tags.map((tag, index) => (
                <span
                  key={index}
                  style={{
                    padding: '4px 8px',
                    background: themeColors.accent,
                    borderRadius: 12,
                    fontSize: 12,
                    color: themeColors.cardForeground,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {node.summary && (
          <div style={{ marginBottom: 16 }}>
            <h4
              style={{
                margin: '0 0 8px 0',
                fontWeight: '600',
                fontSize: 14,
                color: themeColors.cardForeground,
              }}
            >
              摘要
            </h4>
            <p
              style={{
                margin: 0,
                padding: 8,
                background: themeColors.background,
                borderRadius: 6,
                color: themeColors.cardForeground,
              }}
            >
              {node.summary}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onViewArticle}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: themeColors.primary,
              color: themeColors.card,
              border: `1px solid ${themeColors.border}`,
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <FileText size={14} />
            查看文章
          </button>
        </div>
      </div>
    </div>
  )
}
