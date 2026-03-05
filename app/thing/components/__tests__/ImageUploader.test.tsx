/* eslint-disable @next/next/no-img-element */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImageUploader from '../ImageUploader'
import { UploadedImage } from '../../types'
import { toast } from 'sonner'
import { post } from '@/lib/api'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('swr/mutation', () => ({
  default: (
    key: string,
    fetcher: (url: string, payload: { arg: FormData }) => Promise<unknown>
  ) => ({
    trigger: (arg: FormData) => fetcher(key, { arg }),
  }),
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
    it('应该在超过最大数量时阻止上传', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <ImageUploader
          onImagesChange={mockOnImagesChange}
          existingImages={mockExistingImages}
          maxImages={2}
        />
      )

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['x'], 'new.jpg', { type: 'image/jpeg' })
      await user.upload(fileInput, file)

      expect(toast.error).toHaveBeenCalledWith('最多只能上传2张图片')
      expect(post).not.toHaveBeenCalled()
    })

    it('应该在文件超过大小限制时阻止上传', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <ImageUploader onImagesChange={mockOnImagesChange} maxSize={1} />
      )

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['x'], 'big.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 })
      await user.upload(fileInput, file)

      expect(toast.error).toHaveBeenCalledWith('有1个文件超过1MB限制')
      expect(post).not.toHaveBeenCalled()
    })

    it('应该忽略空文件选择事件', () => {
      const { container } = render(<ImageUploader onImagesChange={mockOnImagesChange} />)
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

      fireEvent.change(fileInput, { target: { files: null } })

      expect(post).not.toHaveBeenCalled()
      expect(mockOnImagesChange).not.toHaveBeenCalled()
    })
  })

  describe('上传', () => {
    it('应该在上传成功后合并图片并回调', async () => {
      const user = userEvent.setup()
      const uploadedImages: UploadedImage[] = [
        {
          id: 3,
          path: '/path/to/image3.jpg',
          thumbnail_path: '/path/to/thumb3.jpg',
          url: 'https://example.com/image3.jpg',
          thumbnail_url: 'https://example.com/thumb3.jpg',
          is_primary: false,
        },
      ]
      vi.mocked(post).mockResolvedValueOnce(uploadedImages)

      const { container } = render(
        <ImageUploader onImagesChange={mockOnImagesChange} existingImages={mockExistingImages} />
      )
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['abc'], 'new.jpg', { type: 'image/jpeg' })
      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(post).toHaveBeenCalledWith('/upload/images', expect.any(FormData))
      })

      expect(mockOnImagesChange).toHaveBeenNthCalledWith(1, mockExistingImages)
      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenLastCalledWith([
          ...mockExistingImages,
          ...uploadedImages,
        ])
      })
      expect(toast.success).toHaveBeenCalledWith('图片上传成功')
      expect(fileInput.value).toBe('')
    })

    it('应该在上传过程中显示上传中状态', async () => {
      const user = userEvent.setup()
      let resolveUpload: (value: UploadedImage[]) => void = () => {}
      const pending = new Promise<UploadedImage[]>(resolve => {
        resolveUpload = resolve
      })
      vi.mocked(post).mockReturnValueOnce(pending)

      const { container } = render(<ImageUploader onImagesChange={mockOnImagesChange} />)
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['abc'], 'new.jpg', { type: 'image/jpeg' })
      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByText('上传中...')).toBeInTheDocument()
      })

      resolveUpload([])

      await waitFor(() => {
        expect(screen.queryByText('上传中...')).not.toBeInTheDocument()
      })
    })

    it('应该在上传失败时提示错误', async () => {
      const user = userEvent.setup()
      vi.mocked(post).mockRejectedValueOnce(new Error('upload failed'))

      const { container } = render(
        <ImageUploader onImagesChange={mockOnImagesChange} existingImages={mockExistingImages} />
      )
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['abc'], 'new.jpg', { type: 'image/jpeg' })
      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('图片上传失败')
      })
      expect(mockOnImagesChange).toHaveBeenCalledWith(mockExistingImages)
    })
  })
})
