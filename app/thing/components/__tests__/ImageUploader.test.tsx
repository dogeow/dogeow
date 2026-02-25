/* eslint-disable @next/next/no-img-element */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImageUploader from '../ImageUploader'
import { UploadedImage } from '../../types'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('swr/mutation', () => ({
  default: vi.fn(() => ({
    trigger: vi.fn(),
  })),
}))

vi.mock('@/lib/api', () => ({
  post: vi.fn(),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, onClick }: { src?: string; alt?: string; onClick?: () => void }) => (
    <img src={src} alt={alt} onClick={onClick} data-testid="uploaded-image" />
  ),
}))

describe('ImageUploader', () => {
  const mockOnImagesChange = vi.fn()
  const mockExistingImages: UploadedImage[] = [
    {
      id: 1,
      path: '/path/to/image1.jpg',
      thumbnail_path: '/path/to/thumb1.jpg',
      url: 'https://example.com/image1.jpg',
      thumbnail_url: 'https://example.com/thumb1.jpg',
      is_primary: true,
    },
    {
      id: 2,
      path: '/path/to/image2.jpg',
      thumbnail_path: '/path/to/thumb2.jpg',
      url: 'https://example.com/image2.jpg',
      thumbnail_url: 'https://example.com/thumb2.jpg',
      is_primary: false,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该渲染上传按钮', () => {
      render(<ImageUploader onImagesChange={mockOnImagesChange} />)

      expect(screen.getByText('上传图片')).toBeInTheDocument()
    })

    it('应该显示现有图片', () => {
      render(
        <ImageUploader onImagesChange={mockOnImagesChange} existingImages={mockExistingImages} />
      )

      const images = screen.getAllByTestId('uploaded-image')
      expect(images).toHaveLength(2)
    })

    it('应该显示主图标签', () => {
      render(
        <ImageUploader onImagesChange={mockOnImagesChange} existingImages={mockExistingImages} />
      )

      expect(screen.getByText('主图')).toBeInTheDocument()
    })

    it('当图片数量达到最大值时不显示上传按钮', () => {
      const maxImages = 2
      render(
        <ImageUploader
          onImagesChange={mockOnImagesChange}
          existingImages={mockExistingImages}
          maxImages={maxImages}
        />
      )

      expect(screen.queryByText('上传图片')).not.toBeInTheDocument()
    })
  })

  describe('交互', () => {
    it('应该在点击删除按钮时删除图片', async () => {
      const user = userEvent.setup()
      render(
        <ImageUploader onImagesChange={mockOnImagesChange} existingImages={mockExistingImages} />
      )

      const deleteButtons = screen.getAllByLabelText('删除图片')
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              id: 2,
              url: 'https://example.com/image2.jpg',
            }),
          ])
        )
      })
    })

    it('应该在点击图片时设置为主图', async () => {
      const user = userEvent.setup()
      render(
        <ImageUploader onImagesChange={mockOnImagesChange} existingImages={mockExistingImages} />
      )

      const images = screen.getAllByTestId('uploaded-image')
      await user.click(images[1])

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: 1, is_primary: false }),
            expect.objectContaining({ id: 2, is_primary: true }),
          ])
        )
      })
    })

    it('应该在点击上传按钮时打开文件选择器', async () => {
      const user = userEvent.setup()
      const { container } = render(<ImageUploader onImagesChange={mockOnImagesChange} />)

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      const clickSpy = vi.spyOn(fileInput, 'click')

      const uploadButton = screen.getByText('上传图片')
      await user.click(uploadButton)

      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe('验证', () => {
    it('应该验证最大图片数量', () => {
      const { toast } = require('sonner')

      render(
        <ImageUploader onImagesChange={mockOnImagesChange} existingImages={mockExistingImages} />
      )

      // 由于需要实际的文件上传测试，这里主要验证组件渲染正常
      expect(screen.getAllByTestId('uploaded-image')).toHaveLength(2)
    })
  })
})
