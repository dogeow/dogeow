import React from 'react'

interface ImagePlaceholderProps {
    className?: string
    size?: number
}

export default function ImagePlaceholder({ className = '', size = 24 }: ImagePlaceholderProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {/* 外框 */}
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />

            {/* 太阳/圆形 */}
            <circle cx="8.5" cy="8.5" r="1.5" />

            {/* 山峰 */}
            <polyline points="21,15 16,10 5,21" />
        </svg>
    )
}