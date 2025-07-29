/**
 * Development tools for i18n system
 * These utilities help developers identify and fix translation issues
 */

import { validateTranslations, getAllTranslationKeys, hasTranslationKey } from './utils'

/**
 * Validates all translations in the system and reports issues
 * Only runs in development mode
 */
export function validateAllTranslations() {
  if (process.env.NODE_ENV !== 'development') {
    console.log('[i18n] Translation validation skipped in production')
    return
  }

  console.group('[i18n] Full Translation Validation')

  const allKeys = getAllTranslationKeys()
  console.log(`Found ${allKeys.length} translation keys to validate`)

  const validation = validateTranslations(allKeys)

  if (validation.isValid) {
    console.log('✅ All translations are complete!')
  } else {
    console.log(`❌ Found ${validation.missingTranslations.length} missing translations`)

    // Group missing translations by language
    const missingByLanguage = validation.missingTranslations.reduce(
      (acc, { key, language }) => {
        if (!acc[language]) acc[language] = []
        acc[language].push(key)
        return acc
      },
      {} as Record<string, string[]>
    )

    Object.entries(missingByLanguage).forEach(([language, keys]) => {
      console.group(`Missing in ${language} (${keys.length} keys):`)
      keys.forEach(key => console.log(`  - ${key}`))
      console.groupEnd()
    })
  }

  console.groupEnd()
  return validation
}

/**
 * Checks if specific translation keys exist
 * Useful for validating new features before deployment
 */
export function checkTranslationKeys(keys: string[]) {
  if (process.env.NODE_ENV !== 'development') {
    return keys.map(key => ({ key, exists: true })) // Skip in production
  }

  const results = keys.map(key => ({
    key,
    exists: hasTranslationKey(key),
  }))

  const missing = results.filter(r => !r.exists)

  if (missing.length > 0) {
    console.group('[i18n] Translation Key Check')
    console.warn(`${missing.length} translation keys are missing:`)
    missing.forEach(({ key }) => console.warn(`  - ${key}`))
    console.groupEnd()
  }

  return results
}

/**
 * Logs translation usage statistics
 * Helps identify unused or frequently used translations
 */
export function logTranslationStats() {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  const allKeys = getAllTranslationKeys()

  console.group('[i18n] Translation Statistics')
  console.log(`Total translation keys: ${allKeys.length}`)

  // Group by namespace (prefix before first dot)
  const namespaces = allKeys.reduce(
    (acc, key) => {
      const namespace = key.split('.')[0]
      if (!acc[namespace]) acc[namespace] = 0
      acc[namespace]++
      return acc
    },
    {} as Record<string, number>
  )

  console.log('Keys by namespace:')
  Object.entries(namespaces)
    .sort(([, a], [, b]) => b - a)
    .forEach(([namespace, count]) => {
      console.log(`  ${namespace}: ${count} keys`)
    })

  console.groupEnd()
}
