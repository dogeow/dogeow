import { countWords, countCharacters, extractTextFromJSON } from '../wordCount'

describe('wordCount', () => {
  describe('countWords', () => {
    it('应该正确统计中文字数', () => {
      expect(countWords('今天,监控没有看。')).toBe(7)
      expect(countWords('玩了半个下午的守望先锋。|')).toBe(11)
      expect(countWords('今天,监控没有看。玩了半个下午的守望先锋。|')).toBe(18)
    })

    it('应该正确统计英文字数', () => {
      expect(countWords('Hello world')).toBe(2)
      expect(countWords('This is a test')).toBe(4)
      expect(countWords("Don't worry")).toBe(2)
    })

    it('应该正确统计中英文混合文本', () => {
      expect(countWords('Hello 世界')).toBe(3)
      expect(countWords('今天 is a good day')).toBe(6)
    })

    it('应该处理空字符串和无效输入', () => {
      expect(countWords('')).toBe(0)
      expect(countWords('   ')).toBe(0)
      expect(countWords(null as unknown as string)).toBe(0)
      expect(countWords(undefined as unknown as string)).toBe(0)
    })

    it('应该移除HTML标签', () => {
      expect(countWords('<p>今天,监控没有看。</p>')).toBe(7)
      expect(countWords('<strong>Hello</strong> world')).toBe(2)
    })

    it('应该处理标点符号', () => {
      expect(countWords('你好，世界！')).toBe(4)
      expect(countWords('Hello, world!')).toBe(2)
    })
  })

  describe('countCharacters', () => {
    it('应该正确统计字符数', () => {
      expect(countCharacters('今天,监控没有看。')).toBe(9)
      expect(countCharacters('Hello world')).toBe(11)
      expect(countCharacters('你好，世界！')).toBe(6)
    })

    it('应该处理空字符串', () => {
      expect(countCharacters('')).toBe(0)
      expect(countCharacters('   ')).toBe(0)
    })
  })

  describe('extractTextFromJSON', () => {
    it('应该从JSON内容中提取文本', () => {
      const jsonContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '今天,监控没有看。',
              },
            ],
          },
        ],
      }
      expect(extractTextFromJSON(jsonContent)).toBe('今天,监控没有看。')
    })

    it('应该处理复杂的JSON结构', () => {
      const jsonContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '今天,监控没有看。',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '玩了半个下午的守望先锋。|',
              },
            ],
          },
        ],
      }
      expect(extractTextFromJSON(jsonContent)).toBe('今天,监控没有看。玩了半个下午的守望先锋。|')
    })

    it('应该处理空内容', () => {
      expect(extractTextFromJSON(null)).toBe('')
      expect(extractTextFromJSON(undefined)).toBe('')
      expect(extractTextFromJSON({})).toBe('')
    })
  })
})
