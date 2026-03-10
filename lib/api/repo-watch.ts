'use client'

import { del, get, post } from './core'

export type WatchLevel = 'major' | 'minor' | 'patch'
export type Ecosystem = 'npm' | 'composer'

export interface RepoDependencyPreviewItem {
  package_name: string
  current_version_constraint?: string | null
  normalized_current_version?: string | null
  current_version_source?: 'lock' | 'manifest' | null
  dependency_group?: string | null
}

export interface RepoDependencyManifest {
  ecosystem: Ecosystem
  path: string
  package_name?: string | null
  dependencies: RepoDependencyPreviewItem[]
}

export interface RepoDependencyPreview {
  source: {
    provider: string
    owner: string
    repo: string
    full_name: string
    html_url: string
    description?: string | null
  }
  manifests: RepoDependencyManifest[]
}

export interface WatchedPackage {
  id: number
  source_provider: string
  source_owner: string
  source_repo: string
  source_url: string
  ecosystem: Ecosystem
  package_name: string
  manifest_path?: string | null
  current_version_constraint?: string | null
  normalized_current_version?: string | null
  current_version_source?: 'lock' | 'manifest' | null
  latest_version?: string | null
  watch_level: WatchLevel
  latest_update_type?: WatchLevel | null
  matches_preference: boolean
  registry_url?: string | null
  last_checked_at?: string | null
  last_error?: string | null
  metadata?: Record<string, unknown> | null
}

export interface SaveWatchedPackageInput {
  ecosystem: Ecosystem
  package_name: string
  manifest_path: string
  current_version_constraint?: string | null
  normalized_current_version?: string | null
  current_version_source?: 'lock' | 'manifest' | null
  watch_level: WatchLevel
  dependency_group?: string | null
}

export const previewRepoDependencies = (url: string) =>
  post<RepoDependencyPreview>('/repo-watch/preview', { url })

export const listWatchedPackages = () => get<WatchedPackage[]>('/repo-watch/packages')

export const saveWatchedPackages = (
  source: RepoDependencyPreview['source'],
  sourceUrl: string,
  packages: SaveWatchedPackageInput[]
) =>
  post<WatchedPackage[]>('/repo-watch/packages', {
    source_url: sourceUrl,
    source_owner: source.owner,
    source_repo: source.repo,
    packages,
  })

export const refreshWatchedPackage = (id: number) =>
  post<WatchedPackage>(`/repo-watch/packages/${id}/refresh`, {})

export const deleteWatchedPackage = (id: number) => del<void>(`/repo-watch/packages/${id}`)

export const deleteWatchedPackages = (ids: number[]) =>
  del<{ deleted: number }>('/repo-watch/packages', { ids })
