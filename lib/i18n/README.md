# Multi-Language Support (i18n) System

This document describes how to use the enhanced translation system implemented for the dogeow application.

## Overview

The i18n system provides comprehensive multi-language support with:

- 4 supported languages: Chinese Simplified, Chinese Traditional, English, Japanese
- Automatic browser language detection
- Fallback mechanism for missing translations
- Development warnings for missing translations
- Persistent language preferences

## Basic Usage

### Using the useTranslation Hook

```typescript
import { useTranslation } from '@/hooks/useTranslation'

function MyComponent() {
  const { t, currentLanguage, setLanguage } = useTranslation()

  return (
    <div>
      <h1>{t('app.title')}</h1>
      <p>{t('nav.thing', 'Default fallback text')}</p>
      <button onClick={() => setLanguage('en')}>
        Switch to English
      </button>
    </div>
  )
}
```

### Using the Lightweight useT Hook

```typescript
import { useT } from '@/hooks/useTranslation'

function SimpleComponent() {
  const t = useT()

  return <span>{t('common.save')}</span>
}
```

### Using Translation with Explicit Language

```typescript
import { useTranslationWithLanguage } from '@/hooks/useTranslation'

function MultiLanguageComponent() {
  const translateWith = useTranslationWithLanguage()

  return (
    <div>
      <p>English: {translateWith('app.title', 'en')}</p>
      <p>Japanese: {translateWith('app.title', 'ja')}</p>
    </div>
  )
}
```

## Direct API Usage

### Creating Translation Functions

```typescript
import { createTranslationFunction } from '@/lib/i18n'

const t = createTranslationFunction('zh-CN')
const title = t('app.title') // Returns: "Doge先锋"
```

### Language Detection and Validation

```typescript
import { detectBrowserLanguage, isSupportedLanguage, normalizeLanguageCode } from '@/lib/i18n'

const detected = detectBrowserLanguage() // Returns: 'zh-CN' | 'zh-TW' | 'en' | 'ja'
const isValid = isSupportedLanguage('fr') // Returns: false
const normalized = normalizeLanguageCode('zh') // Returns: 'zh-CN'
```

## Development Tools

### Translation Validation

```typescript
import { validateAllTranslations, checkTranslationKeys } from '@/lib/i18n'

// Validate all translations (development only)
validateAllTranslations()

// Check specific keys
checkTranslationKeys(['new.feature.title', 'new.feature.description'])
```

### Translation Statistics

```typescript
import { logTranslationStats } from '@/lib/i18n'

// Log translation statistics (development only)
logTranslationStats()
```

## Fallback Mechanism

The translation system uses a robust fallback mechanism:

1. **Current Language**: Try to get translation in the current language
2. **Default Language**: Fall back to Chinese Simplified (zh-CN)
3. **English**: Fall back to English if available
4. **Provided Fallback**: Use the fallback text provided in the function call
5. **Translation Key**: Return the key itself as last resort

## Development Warnings

In development mode, the system provides helpful warnings:

```typescript
// Missing translation warning
const t = useT()
t('missing.key') // Console: [i18n] Translation missing for key "missing.key"...

// Invalid key warning
t('') // Console: Invalid translation key provided:
```

## Adding New Translations

To add new translations, update the `translations.ts` file:

```typescript
export const translations: Translations = {
  'zh-CN': {
    'new.feature.title': '新功能标题',
    // ... other translations
  },
  'zh-TW': {
    'new.feature.title': '新功能標題',
    // ... other translations
  },
  en: {
    'new.feature.title': 'New Feature Title',
    // ... other translations
  },
  ja: {
    'new.feature.title': '新機能タイトル',
    // ... other translations
  },
}
```

## Best Practices

1. **Use Descriptive Keys**: Use hierarchical keys like `nav.thing` instead of generic keys
2. **Provide Fallbacks**: Always provide fallback text for user-facing strings
3. **Validate Translations**: Use development tools to ensure all translations are complete
4. **Test Language Switching**: Test your components with different languages
5. **Handle Edge Cases**: Consider what happens when translations are missing

## Language Store Integration

The translation system integrates with Zustand for state management:

```typescript
import { useLanguageStore } from '@/stores/languageStore'

// Direct store access (advanced usage)
const { currentLanguage, setLanguage, t } = useLanguageStore()
```

## Supported Languages

| Code  | Language              | Native Name |
| ----- | --------------------- | ----------- |
| zh-CN | Chinese (Simplified)  | 简体中文    |
| zh-TW | Chinese (Traditional) | 繁體中文    |
| en    | English               | English     |
| ja    | Japanese              | 日本語      |

## Performance Considerations

- Translation data is loaded synchronously for better performance
- Language preferences are persisted in localStorage
- Translation functions are memoized to avoid unnecessary re-renders
- Development warnings are stripped in production builds
