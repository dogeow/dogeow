import { getTranslatedConfigs } from '@/app/configs'
import type { SearchResult } from '../types'

export function searchLocalData(
  searchTerm: string,
  category: string,
  isAuthenticated: boolean,
  t: (key: string) => string
): SearchResult[] {
  const results: SearchResult[] = []
  const lowerSearchTerm = searchTerm.toLowerCase()
  const translatedConfigs = getTranslatedConfigs(t)

  // 搜索游戏（游戏对所有用户开放）
  if (category === 'all' || category === 'game') {
    const gameResults = translatedConfigs.games
      .filter(
        game =>
          game.name?.toLowerCase().includes(lowerSearchTerm) ||
          game.description?.toLowerCase().includes(lowerSearchTerm) ||
          game.id?.toLowerCase().includes(lowerSearchTerm)
      )
      .filter(game => game.id && game.name && game.description)
      .map(game => ({
        id: game.id!,
        title: game.name!,
        content: game.description!,
        url: `/game/${game.id!}`,
        category: 'game',
        requireAuth: false,
      }))
    results.push(...gameResults)
  }

  // 只有认证用户才能搜索以下内容
  if (isAuthenticated) {
    // 搜索导航
    if (category === 'all' || category === 'nav') {
      const navResults = translatedConfigs.navigation
        .filter(
          nav =>
            nav.name?.toLowerCase().includes(lowerSearchTerm) ||
            nav.description?.toLowerCase().includes(lowerSearchTerm)
        )
        .filter(nav => nav.id && nav.name && nav.description && nav.url)
        .map(nav => ({
          id: nav.id!,
          title: nav.name!,
          content: nav.description!,
          url: nav.url!,
          category: 'nav',
          requireAuth: true,
        }))
      results.push(...navResults)
    }

    // 搜索笔记
    if (category === 'all' || category === 'note') {
      const noteResults = translatedConfigs.notes
        .filter(
          note =>
            note.name?.toLowerCase().includes(lowerSearchTerm) ||
            note.description?.toLowerCase().includes(lowerSearchTerm)
        )
        .filter(note => note.id && note.name && note.description && note.url)
        .map(note => ({
          id: note.id!,
          title: note.name!,
          content: note.description!,
          url: note.url!,
          category: 'note',
          requireAuth: true,
        }))
      results.push(...noteResults)
    }

    // 搜索文件
    if (category === 'all' || category === 'file') {
      const fileResults = translatedConfigs.files
        .filter(
          file =>
            file.name?.toLowerCase().includes(lowerSearchTerm) ||
            file.description?.toLowerCase().includes(lowerSearchTerm)
        )
        .filter(file => file.id && file.name && file.description && file.url)
        .map(file => ({
          id: file.id!,
          title: file.name!,
          content: file.description!,
          url: file.url!,
          category: 'file',
          requireAuth: true,
        }))
      results.push(...fileResults)
    }

    // 搜索实验室
    if (category === 'all' || category === 'lab') {
      const labResults = translatedConfigs.lab
        .filter(
          lab =>
            lab.name?.toLowerCase().includes(lowerSearchTerm) ||
            lab.description?.toLowerCase().includes(lowerSearchTerm)
        )
        .filter(lab => lab.id && lab.name && lab.description && lab.url)
        .map(lab => ({
          id: lab.id!,
          title: lab.name!,
          content: lab.description!,
          url: lab.url!,
          category: 'lab',
          requireAuth: false,
        }))
      results.push(...labResults)
    }
  }

  return results
}
