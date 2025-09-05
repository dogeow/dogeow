/**
 * i18n 系统开发工具
 * 这些工具用于帮助开发者发现和修复翻译问题
 */

import { validateTranslations, getAllTranslationKeys, hasTranslationKey } from './utils'

/**
 * 校验系统中所有翻译，并报告问题
 * 仅在开发模式下运行
 */
export function validateAllTranslations() {
  if (process.env.NODE_ENV !== 'development') {
    console.log('[i18n] 生产环境下跳过翻译校验')
    return
  }

  console.group('[i18n] 全量翻译校验')

  const allKeys = getAllTranslationKeys()
  console.log(`发现 ${allKeys.length} 个待校验的翻译 key`)

  const validation = validateTranslations(allKeys)

  if (validation.isValid) {
    console.log('✅ 所有翻译均已完成！')
  } else {
    console.log(`❌ 发现 ${validation.missingTranslations.length} 处缺失翻译`)

    // 按语言分组缺失的翻译
    const missingByLanguage = validation.missingTranslations.reduce(
      (acc, { key, language }) => {
        if (!acc[language]) acc[language] = []
        acc[language].push(key)
        return acc
      },
      {} as Record<string, string[]>
    )

    Object.entries(missingByLanguage).forEach(([language, keys]) => {
      console.group(`在 ${language} 缺失 (${keys.length} 个 key):`)
      keys.forEach(key => console.log(`  - ${key}`))
      console.groupEnd()
    })
  }

  console.groupEnd()
  return validation
}

/**
 * 检查指定的翻译 key 是否存在
 * 用于新功能上线前的翻译校验
 */
export function checkTranslationKeys(keys: string[]) {
  if (process.env.NODE_ENV !== 'development') {
    return keys.map(key => ({ key, exists: true })) // 生产环境下跳过
  }

  const results = keys.map(key => ({
    key,
    exists: hasTranslationKey(key),
  }))

  const missing = results.filter(r => !r.exists)

  if (missing.length > 0) {
    console.group('[i18n] 翻译 Key 检查')
    console.warn(`有 ${missing.length} 个翻译 key 缺失:`)
    missing.forEach(({ key }) => console.warn(`  - ${key}`))
    console.groupEnd()
  }

  return results
}

/**
 * 输出翻译使用统计信息
 * 帮助识别未使用或高频使用的翻译
 */
export function logTranslationStats() {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  const allKeys = getAllTranslationKeys()

  console.group('[i18n] 翻译统计信息')
  console.log(`翻译 key 总数: ${allKeys.length}`)

  // 按命名空间（第一个点前缀）分组
  const namespaces = allKeys.reduce(
    (acc, key) => {
      const namespace = key.split('.')[0]
      if (!acc[namespace]) acc[namespace] = 0
      acc[namespace]++
      return acc
    },
    {} as Record<string, number>
  )

  console.log('各命名空间下的 key 数量:')
  Object.entries(namespaces)
    .sort(([, a], [, b]) => b - a)
    .forEach(([namespace, count]) => {
      console.log(`  ${namespace}: ${count} 个 key`)
    })

  console.groupEnd()
}
