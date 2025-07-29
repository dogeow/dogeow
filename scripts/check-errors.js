import fs from 'fs'
import path from 'path'

// 检查关键文件是否存在
const criticalFiles = [
  'lib/i18n/index.ts',
  'lib/i18n/translations.ts',
  'lib/i18n/utils.ts',
  'hooks/useTranslation.ts',
  'stores/languageStore.ts',
  'components/ui/language-selector.tsx',
  'components/ui/language-transition.tsx',
]

console.log('🔍 检查多语言功能文件...')

let hasErrors = false

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`)
  } else {
    console.log(`❌ ${file} - 文件不存在`)
    hasErrors = true
  }
})

// 检查翻译文件内容
try {
  const translationsPath = path.join(__dirname, '..', 'lib/i18n/translations.ts')
  const content = fs.readFileSync(translationsPath, 'utf8')

  // 检查是否包含所有必需的语言
  const requiredLanguages = ['zh-CN', 'zh-TW', 'en', 'ja']
  requiredLanguages.forEach(lang => {
    if (content.includes(`'${lang}':`) || content.includes(`  ${lang}:`)) {
      console.log(`✅ 翻译文件包含 ${lang}`)
    } else {
      console.log(`❌ 翻译文件缺少 ${lang}`)
      hasErrors = true
    }
  })

  // 检查是否有基本的翻译键
  const basicKeys = ['app.title', 'nav.thing', 'settings.language']
  basicKeys.forEach(key => {
    if (content.includes(`'${key}'`)) {
      console.log(`✅ 包含翻译键 ${key}`)
    } else {
      console.log(`❌ 缺少翻译键 ${key}`)
      hasErrors = true
    }
  })
} catch (error) {
  console.log(`❌ 无法读取翻译文件: ${error.message}`)
  hasErrors = true
}

// 检查package.json中的依赖
try {
  const packagePath = path.join(__dirname, '..', 'package.json')
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'))

  const requiredDeps = ['framer-motion', 'zustand']
  requiredDeps.forEach(dep => {
    if (packageContent.dependencies[dep] || packageContent.devDependencies[dep]) {
      console.log(`✅ 依赖 ${dep} 已安装`)
    } else {
      console.log(`❌ 缺少依赖 ${dep}`)
      hasErrors = true
    }
  })
} catch (error) {
  console.log(`❌ 无法读取package.json: ${error.message}`)
  hasErrors = true
}

console.log('\n📊 检查结果:')
if (hasErrors) {
  console.log('❌ 发现了一些问题，请检查上述错误')
  process.exit(1)
} else {
  console.log('✅ 所有检查都通过了！多语言功能应该正常工作')
  process.exit(0)
}
