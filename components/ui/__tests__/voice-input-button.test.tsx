import { render, screen, fireEvent } from '@testing-library/react'
import { VoiceInputButton } from '../voice-input-button'

describe('VoiceInputButton', () => {
  const mockOnToggle = jest.fn()

  beforeEach(() => {
    mockOnToggle.mockClear()
  })

  it('应该渲染按钮', () => {
    render(
      <VoiceInputButton
        isListening={false}
        isSupported={true}
        onToggle={mockOnToggle}
        showTooltip={false}
      />
    )

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('当正在监听时应该显示正确的图标', () => {
    render(
      <VoiceInputButton
        isListening={true}
        isSupported={true}
        onToggle={mockOnToggle}
        showTooltip={false}
      />
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', '停止语音输入')
  })

  it('当未监听时应该显示正确的图标', () => {
    render(
      <VoiceInputButton
        isListening={false}
        isSupported={true}
        onToggle={mockOnToggle}
        showTooltip={false}
      />
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', '开始语音输入')
  })

  it('点击按钮应该调用 onToggle', () => {
    render(
      <VoiceInputButton
        isListening={false}
        isSupported={true}
        onToggle={mockOnToggle}
        showTooltip={false}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockOnToggle).toHaveBeenCalledTimes(1)
  })

  it('当不支持时应该禁用按钮', () => {
    render(
      <VoiceInputButton
        isListening={false}
        isSupported={false}
        onToggle={mockOnToggle}
        showTooltip={false}
      />
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('当 disabled 为 true 时应该禁用按钮', () => {
    render(
      <VoiceInputButton
        isListening={false}
        isSupported={true}
        onToggle={mockOnToggle}
        disabled={true}
        showTooltip={false}
      />
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('当正在监听时应该应用动画样式', () => {
    const { container } = render(
      <VoiceInputButton
        isListening={true}
        isSupported={true}
        onToggle={mockOnToggle}
        showTooltip={false}
      />
    )

    const button = container.querySelector('button')
    expect(button?.className).toMatch(/animate-pulse/)
  })

  it('应该支持自定义 className', () => {
    const { container } = render(
      <VoiceInputButton
        isListening={false}
        isSupported={true}
        onToggle={mockOnToggle}
        className="custom-class"
        showTooltip={false}
      />
    )

    const button = container.querySelector('button')
    expect(button?.className).toMatch(/custom-class/)
  })
})
