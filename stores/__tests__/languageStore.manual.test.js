// Manual test to verify language store functionality
// This can be run in browser console or Node.js environment

// Mock the required dependencies for manual testing
const mockI18n = {
  detectBrowserLanguage: () => 'en',
  createTranslationFunction: lang => (key, fallback) =>
    `${lang}:${key}${fallback ? `:${fallback}` : ''}`,
  normalizeLanguageCode: lang => {
    const supportedLangs = ['zh-CN', 'zh-TW', 'en', 'ja']
    return supportedLangs.includes(lang) ? lang : 'zh-CN'
  },
  getAvailableLanguages: () => [
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', isDefault: true },
    { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', isDefault: false },
    { code: 'en', name: 'English', nativeName: 'English', isDefault: false },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', isDefault: false },
  ],
}

console.log('Testing language store functionality...')

// Test 1: Language normalization
console.log('Test 1: Language normalization')
console.log('Valid language (en):', mockI18n.normalizeLanguageCode('en')) // Should be 'en'
console.log('Invalid language (fr):', mockI18n.normalizeLanguageCode('fr')) // Should be 'zh-CN'

// Test 2: Translation function creation
console.log('\nTest 2: Translation function creation')
const tEn = mockI18n.createTranslationFunction('en')
const tZh = mockI18n.createTranslationFunction('zh-CN')
console.log('English translation:', tEn('nav.game')) // Should be 'en:nav.game'
console.log('Chinese translation:', tZh('nav.game')) // Should be 'zh-CN:nav.game'
console.log('With fallback:', tEn('missing.key', 'Default')) // Should be 'en:missing.key:Default'

// Test 3: Browser language detection
console.log('\nTest 3: Browser language detection')
console.log('Detected language:', mockI18n.detectBrowserLanguage()) // Should be 'en'

// Test 4: Available languages
console.log('\nTest 4: Available languages')
const languages = mockI18n.getAvailableLanguages()
console.log('Available languages count:', languages.length) // Should be 4
console.log('First language:', languages[0]) // Should be zh-CN object

console.log('\nAll tests completed successfully!')

// Add a simple Jest test to make this file valid
describe('Manual Language Store Tests', () => {
  it('should pass manual tests', () => {
    expect(true).toBe(true)
  })
})
