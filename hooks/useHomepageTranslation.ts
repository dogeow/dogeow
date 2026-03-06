'use client'

import { useCallback, useSyncExternalStore } from 'react'

type HomepageLanguage = 'zh-CN' | 'zh-TW' | 'en' | 'ja'

type HomepageTranslationKey =
  | 'home.title'
  | 'home.description'
  | 'home.section_tiles'
  | 'nav.thing'
  | 'nav.lab'
  | 'nav.file'
  | 'nav.tool'
  | 'nav.nav'
  | 'nav.note'
  | 'nav.game'
  | 'nav.chat'
  | 'nav.word'
  | 'footer.privacy_policy'
  | 'footer.terms_of_service'
  | 'footer.site_info'
  | 'common.login_required'

const DEFAULT_LANGUAGE: HomepageLanguage = 'zh-CN'

const HOMEPAGE_TRANSLATIONS: Record<HomepageLanguage, Record<HomepageTranslationKey, string>> = {
  'zh-CN': {
    'home.title': 'DogeOW - 个人工具和游戏平台',
    'home.description': '包含物品管理、文件管理、笔记、导航、实验室和各种小游戏的综合平台',
    'home.section_tiles': '应用入口',
    'nav.thing': '物品管理',
    'nav.lab': '实验室',
    'nav.file': '文件',
    'nav.tool': '工具',
    'nav.nav': '导航',
    'nav.note': '笔记',
    'nav.game': '游戏',
    'nav.chat': '聊天',
    'nav.word': '单词',
    'footer.privacy_policy': '隐私政策',
    'footer.terms_of_service': '用户协议',
    'footer.site_info': '网站信息',
    'common.login_required': '需要登录',
  },
  'zh-TW': {
    'home.title': 'DogeOW - 個人工具和遊戲平台',
    'home.description': '包含物品管理、文件管理、筆記、導航、實驗室和各種小遊戲的綜合平台',
    'home.section_tiles': '應用入口',
    'nav.thing': '物品管理',
    'nav.lab': '實驗室',
    'nav.file': '文件',
    'nav.tool': '工具',
    'nav.nav': '導航',
    'nav.note': '筆記',
    'nav.game': '遊戲',
    'nav.chat': '聊天',
    'nav.word': '單詞',
    'footer.privacy_policy': '隱私政策',
    'footer.terms_of_service': '用戶協議',
    'footer.site_info': '網站信息',
    'common.login_required': '需要登入',
  },
  en: {
    'home.title': 'DogeOW - Personal Tools and Game Platform',
    'home.description':
      'An all-in-one platform for item management, file tools, notes, navigation, labs, and games.',
    'home.section_tiles': 'App shortcuts',
    'nav.thing': 'Things',
    'nav.lab': 'Lab',
    'nav.file': 'Files',
    'nav.tool': 'Tools',
    'nav.nav': 'Navigation',
    'nav.note': 'Notes',
    'nav.game': 'Games',
    'nav.chat': 'Chat',
    'nav.word': 'Words',
    'footer.privacy_policy': 'Privacy Policy',
    'footer.terms_of_service': 'Terms of Service',
    'footer.site_info': 'Site Info',
    'common.login_required': 'Login required',
  },
  ja: {
    'home.title': 'DogeOW - 個人ツールとゲームプラットフォーム',
    'home.description':
      '持ち物管理、ファイル管理、ノート、ナビゲーション、実験室、各種ゲームをまとめた総合プラットフォームです。',
    'home.section_tiles': 'アプリ一覧',
    'nav.thing': '持ち物管理',
    'nav.lab': 'ラボ',
    'nav.file': 'ファイル',
    'nav.tool': 'ツール',
    'nav.nav': 'ナビ',
    'nav.note': 'ノート',
    'nav.game': 'ゲーム',
    'nav.chat': 'チャット',
    'nav.word': '単語',
    'footer.privacy_policy': 'プライバシーポリシー',
    'footer.terms_of_service': '利用規約',
    'footer.site_info': 'サイト情報',
    'common.login_required': 'ログインが必要です',
  },
}

function normalizeHomepageLanguage(language?: string | null): HomepageLanguage {
  if (!language) return DEFAULT_LANGUAGE

  const normalized = language.toLowerCase()
  if (normalized.startsWith('zh-tw') || normalized.startsWith('zh-hk')) return 'zh-TW'
  if (normalized.startsWith('zh')) return 'zh-CN'
  if (normalized.startsWith('ja')) return 'ja'
  if (normalized.startsWith('en')) return 'en'
  return DEFAULT_LANGUAGE
}

function getClientHomepageLanguage(): HomepageLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE

  try {
    const stored = window.localStorage.getItem('dogeow-language-preference')
    if (stored) return normalizeHomepageLanguage(stored)
  } catch {}

  if (typeof document !== 'undefined') {
    return normalizeHomepageLanguage(document.documentElement.lang)
  }

  return normalizeHomepageLanguage(window.navigator.language)
}

function subscribeToHomepageLanguage(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {}
  }

  const observer = new MutationObserver(mutations => {
    if (mutations.some(mutation => mutation.attributeName === 'lang')) {
      onStoreChange()
    }
  })

  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })

  const handleStorage = (event: StorageEvent) => {
    if (event.key === 'dogeow-language-preference') {
      onStoreChange()
    }
  }

  const handleLanguageChange = () => onStoreChange()

  window.addEventListener('storage', handleStorage)
  window.addEventListener('languagechange', handleLanguageChange)

  return () => {
    observer.disconnect()
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener('languagechange', handleLanguageChange)
  }
}

export function useHomepageTranslation() {
  const currentLanguage = useSyncExternalStore(
    subscribeToHomepageLanguage,
    getClientHomepageLanguage,
    () => DEFAULT_LANGUAGE
  )

  const t = useCallback(
    (key: string, fallback?: string) =>
      HOMEPAGE_TRANSLATIONS[currentLanguage][key as HomepageTranslationKey] ??
      HOMEPAGE_TRANSLATIONS[DEFAULT_LANGUAGE][key as HomepageTranslationKey] ??
      fallback ??
      key,
    [currentLanguage]
  )

  return { currentLanguage, t }
}
